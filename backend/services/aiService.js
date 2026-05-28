/**
 * AI resume analysis service.
 *
 * Strategy:
 * - If `OPENROUTER_API_KEY` is configured, use OpenRouter + DeepSeek model for higher-quality results.
 * - If unavailable (or the request fails), fall back to a fast heuristic ATS-style matcher.
 *
 * Returns a stable shape consumed by `aiController.js`:
 *   { atsScore, summary, missingSkills, skillsToAdd, suggestions, keyChanges }
 */

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash";

// Keep heuristic keyword list small and cheap; used for fallback and prompt grounding.
const TECH_KEYWORDS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "node.js",
  "nodejs",
  "express",
  "react",
  "next.js",
  "html",
  "css",
  "tailwind",
  "mongodb",
  "sql",
  "aws",
  "docker",
  "kubernetes",
  "rest",
  "api",
  "git",
  "jest",
];

function normalizeText(s) {
  return (s || "").toString().trim();
}

function findKeywordsInText(text) {
  const lower = (text || "").toLowerCase();
  const found = [];
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) found.push(kw);
  }
  return [...new Set(found)];
}

function heuristicCompare(resumeText, jobDescription) {
  const resumeLower = (resumeText || "").toLowerCase();
  const jd = jobDescription || "";

  const jdKeywords = findKeywordsInText(jd);
  const matched = jdKeywords.filter((k) => resumeLower.includes(k));
  const missingFromJd = jdKeywords.filter((k) => !resumeLower.includes(k));

  const atsScore = jdKeywords.length
    ? Math.min(100, Math.max(0, Math.round((matched.length / jdKeywords.length) * 100)))
    : 45;

  const skillsToAdd = [...new Set(missingFromJd)].slice(0, 10);

  const summary =
    jdKeywords.length > 0
      ? `Compared your resume against this job description: ${matched.length} of ${jdKeywords.length} tracked keywords appear on your resume.`
      : "Compared your resume against this job description using heuristic matching.";

  const keyChanges = [
    skillsToAdd.length ? `Add or surface these job-relevant skills: ${skillsToAdd.slice(0, 6).join(", ")}.` : null,
    "Mirror important phrases from the job description in your summary and skills sections (without copying verbatim).",
    "Quantify impact in bullets (%, $, latency, throughput, team size).",
  ]
    .filter(Boolean)
    .join("\n\n");

  const suggestions =
    skillsToAdd.length > 0
      ? `Prioritize adding evidence for: ${skillsToAdd.slice(0, 5).join(", ")}.`
      : "Tighten wording, mirror role language, and quantify impact.";

  return {
    atsScore,
    summary,
    missingSkills: missingFromJd.length ? missingFromJd : skillsToAdd,
    skillsToAdd,
    suggestions,
    keyChanges,
  };
}

function extractJsonObject(text) {
  if (!text) return null;
  const raw = text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    // Try to recover JSON object embedded in text (common with LLMs).
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const maybe = raw.slice(start, end + 1);
      try {
        return JSON.parse(maybe);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callOpenRouter({ resumeText, jobDescription, timeoutMs = 20000 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  // Keep payload smaller for speed; models can handle long context, but your app benefits from lower latency.
  const resumeSlice = resume.slice(0, 12000);
  const jdSlice = jd.slice(0, 12000);

  const heuristic = heuristicCompare(resumeSlice, jdSlice);

  const system = [
    "You are an ATS resume analyzer for a job application tracker.",
    "Return ONLY valid JSON with the exact keys:",
    "atsScore (0-100 number), summary (string), missingSkills (string[]), skillsToAdd (string[]), suggestions (string), keyChanges (string).",
    "No markdown. No extra keys. No prose outside JSON.",
  ].join(" ");

  const user = [
    "Analyze the resume vs job description.",
    "Use the heuristic result only as a baseline; improve missingSkills and suggestions based on the texts.",
    "Be extremely clear and specific in keyChanges/suggestions. Include short actionable bullets separated by blank lines in keyChanges.",
    "In summary, explain in 2-4 sentences WHY the score is what it is (keyword coverage, proof/evidence, and clarity).",
    "",
    `HeuristicBaseline=${JSON.stringify(heuristic)}`,
    "",
    `JobDescription=${jdSlice}`,
    "",
    `ResumeText=${resumeSlice}`,
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        // OpenAI-compat hint; OpenRouter may ignore on some providers, but it helps keep output parseable.
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenRouter error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = extractJsonObject(text);
    if (!parsed) throw new Error("OpenRouter response not valid JSON");

    // Normalize and harden output
    const result = {
      atsScore: Number.isFinite(parsed.atsScore) ? Math.max(0, Math.min(100, Number(parsed.atsScore))) : heuristic.atsScore,
      summary: typeof parsed.summary === "string" ? parsed.summary : heuristic.summary,
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.filter(Boolean).slice(0, 30) : heuristic.missingSkills,
      skillsToAdd: Array.isArray(parsed.skillsToAdd) ? parsed.skillsToAdd.filter(Boolean).slice(0, 15) : heuristic.skillsToAdd,
      suggestions: typeof parsed.suggestions === "string" ? parsed.suggestions : heuristic.suggestions,
      keyChanges: typeof parsed.keyChanges === "string" ? parsed.keyChanges : heuristic.keyChanges,
    };

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Main exported API used by `aiController.js`
 * @param {string} resumeText
 * @param {string} jobDescription
 */
async function analyzeResume(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  // Always have a fast fallback ready.
  const fallback = heuristicCompare(resume, jd);

  try {
    const llm = await callOpenRouter({ resumeText: resume, jobDescription: jd });
    return llm || fallback;
  } catch (error) {
    // Do not fail the API just because AI provider fails.
    if (process.env.NODE_ENV !== "production") {
      console.warn("AI provider failed, using heuristic fallback:", error.message);
    }
    return fallback;
  }
}

module.exports = analyzeResume;
