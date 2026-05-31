/**
 * AI resume analysis service.
 *
 * Returns a rich ATS report consumed by ResumeUpload.jsx and aiController.js.
 */

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

const TECH_KEYWORDS = [
  "javascript", "typescript", "python", "c++", "c#", "golang", "rust", "ruby", "php", "swift", "kotlin",
  "node.js", "nodejs", "express", "react", "next.js", "nextjs", "vue", "angular", "svelte", "html", "css", "tailwind",
  "mongodb", "postgresql", "postgres", "mysql", "redis", "sql", "nosql", "graphql", "rest", "api",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins", "github actions",
  "git", "agile", "scrum", "jest", "cypress", "playwright", "selenium", "figma",
  "machine learning", "deep learning", "nlp", "llm", "tensorflow", "pytorch",
  "microservices", "system design", "leadership", "communication", "problem solving",
];

const SCORE_LABELS = [
  { min: 85, label: "Excellent" },
  { min: 70, label: "Good" },
  { min: 50, label: "Fair" },
  { min: 0, label: "Weak" },
];

function normalizeText(s) {
  return (s || "").toString().trim();
}

function scoreLabel(score) {
  const s = Number(score) || 0;
  return SCORE_LABELS.find((x) => s >= x.min)?.label || "Weak";
}

function keywordInText(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[^a-z0-9./+#-])${escaped}(?:[^a-z0-9./+#-]|$)`);
  return re.test(text);
}

function findKeywordsInText(text) {
  const lower = (text || "").toLowerCase();
  const sorted = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);
  const found = [];
  for (const kw of sorted) {
    if (keywordInText(lower, kw)) found.push(kw);
  }
  return found;
}

function extractJdRequirements(jd) {
  const lines = (jd || "")
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-*•]+/, "").trim())
    .filter((l) => l.length > 3 && l.length < 120);

  const requirementLike = lines.filter((l) =>
    /required|must have|experience with|proficient|familiar|skills?|qualification|responsibilit|years? of/i.test(l)
  );

  const phrases = [];
  for (const line of requirementLike.slice(0, 15)) {
    const cleaned = line.replace(/^(required|must have|experience with|proficient in)\s*:?\s*/i, "").trim();
    if (cleaned.length > 4) phrases.push(cleaned.slice(0, 80));
  }
  return phrases.slice(0, 12);
}

function heuristicCompare(resumeText, jobDescription) {
  const resumeLower = (resumeText || "").toLowerCase();
  const jd = jobDescription || "";

  const jdKeywords = findKeywordsInText(jd);
  const resumeKeywords = findKeywordsInText(resumeText);
  const matched = jdKeywords.filter((k) => keywordInText(resumeLower, k));
  const missingFromJd = jdKeywords.filter((k) => !keywordInText(resumeLower, k));

  const keywordRatio = jdKeywords.length ? matched.length / jdKeywords.length : 0.5;
  const atsScore = jdKeywords.length
    ? Math.min(100, Math.max(0, Math.round(keywordRatio * 100)))
    : 50;

  const skillsToAdd = [...new Set(missingFromJd)].slice(0, 10);
  const strengthsList = matched.slice(0, 8).map((k) => `Strong alignment on ${k}`);
  const jdRequirements = extractJdRequirements(jd);
  const missingFromReqs = jdRequirements.filter(
    (req) => !resumeLower.includes(req.toLowerCase().slice(0, 20))
  );

  const sectionScores = {
    skills: Math.min(100, Math.round(keywordRatio * 100)),
    experience: resumeLower.includes("experience") || resumeLower.includes("worked") ? 65 : 45,
    education: resumeLower.includes("bachelor") || resumeLower.includes("master") || resumeLower.includes("degree") ? 70 : 50,
    formatting: resumeText.length > 200 ? 75 : 40,
  };

  const label = scoreLabel(atsScore);
  const summaryParts = [
    `Your resume scores ${atsScore}/100 for this role (${label}).`,
    jdKeywords.length
      ? `${matched.length} of ${jdKeywords.length} core tech keywords from the job description appear on your resume.`
      : "Keyword overlap was limited — the job description may use non-standard terms.",
    missingFromJd.length
      ? `Top gaps: ${missingFromJd.slice(0, 5).join(", ")}.`
      : "Core keyword coverage looks solid.",
    "Add quantified outcomes and mirror the employer's phrasing in your summary and experience bullets.",
  ];

  const keyChanges = [
    skillsToAdd.length
      ? `Add or emphasize these job-relevant skills with proof: ${skillsToAdd.slice(0, 5).join(", ")}.`
      : "Lead with the 3–5 skills the posting repeats most often in your skills line and summary.",
    "Rewrite 2–3 experience bullets to mirror verbs and nouns from the job description (e.g. 'built', 'scaled', 'cross-functional').",
    "Quantify impact in every bullet: percentages, revenue, users, latency, team size, or delivery speed.",
    missingFromReqs.length
      ? `Address these requirement themes: ${missingFromReqs.slice(0, 3).join("; ")}.`
      : "Add a tailored professional summary that names the target role and your strongest matching achievements.",
  ].join("\n\n");

  const suggestions = [
    "Reorder skills so the job's must-haves appear first.",
    "Replace generic bullets with role-specific achievements tied to the posting's responsibilities.",
    skillsToAdd.length ? `Close skill gaps with projects or certs for: ${skillsToAdd.slice(0, 4).join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const rewrittenSummary = strengthsList.length
    ? `${label}-match candidate with proven experience in ${matched.slice(0, 4).join(", ")}. Seeking to contribute hands-on expertise aligned with this role's requirements while delivering measurable impact across cross-functional teams.`
    : "Results-driven professional seeking to align experience and skills with this role's core requirements. Focus on quantified achievements and terminology from the job posting in your opening summary.";

  const tailoredBullets = [
    skillsToAdd[0]
      ? `Delivered production features using ${matched.slice(0, 2).join(" and ") || "relevant stack"}, reducing delivery time by X% while collaborating with cross-functional stakeholders.`
      : "Led end-to-end delivery of a key initiative, improving [metric] by X% and aligning outcomes with business priorities stated in the job description.",
    `Applied ${matched[0] || "core technical skills"} to solve [specific problem from JD], achieving measurable results (X% improvement / $Y saved / N users impacted).`,
    missingFromJd[0]
      ? `Building proficiency in ${missingFromJd[0]} through [project/course] to strengthen fit for this role's requirements.`
      : "Partnered with product and engineering teams to ship features on schedule, documenting impact with clear metrics.",
  ];

  return {
    atsScore,
    scoreLabel: label,
    overallVerdict:
      atsScore >= 70
        ? "Solid baseline — targeted rewrites can push you into interview range."
        : "Significant gaps — prioritize keyword alignment and quantified bullets before applying.",
    interviewReadiness: atsScore >= 75 ? "Almost ready" : atsScore >= 55 ? "Needs work" : "Mismatch",
    roleMatch: atsScore >= 75 ? "Strong" : atsScore >= 55 ? "Partial" : "Weak",
    roleMatchReason: jdKeywords.length
      ? `Resume covers ${matched.length}/${jdKeywords.length} tracked keywords; ${missingFromJd.length ? `missing ${missingFromJd.slice(0, 4).join(", ")}` : "keyword coverage is strong"}.`
      : "Limited keyword overlap detected between resume and job description.",
    sectionScores,
    keywordsMatched: matched,
    keywordsTotal: jdKeywords.length,
    missingSkills: missingFromJd.length ? missingFromJd : skillsToAdd,
    strengthsList: strengthsList.length ? strengthsList : resumeKeywords.slice(0, 5).map((k) => `Experience with ${k}`),
    skillsToAdd,
    formattingIssues:
      resumeText.length < 300
        ? ["Resume text is very short — ensure the PDF is text-selectable, not a scanned image."]
        : [],
    summary: summaryParts.join(" "),
    suggestions,
    keyChanges,
    rewrittenSummary,
    tailoredBullets,
    analysisSource: "heuristic",
  };
}

function extractJsonObject(text) {
  if (!text) return null;
  const raw = text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function asStringArray(value, max = 20) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || "").trim()).filter(Boolean).slice(0, max);
}

function asSectionScores(value, fallback) {
  const base = fallback || { skills: 50, experience: 50, education: 50, formatting: 50 };
  if (!value || typeof value !== "object") return base;
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  return {
    skills: clamp(value.skills ?? base.skills),
    experience: clamp(value.experience ?? base.experience),
    education: clamp(value.education ?? base.education),
    formatting: clamp(value.formatting ?? base.formatting),
  };
}

function normalizeAnalysis(parsed, fallback) {
  const score = Number.isFinite(parsed?.atsScore)
    ? Math.max(0, Math.min(100, Number(parsed.atsScore)))
    : fallback.atsScore;

  const keywordsMatched = asStringArray(parsed?.keywordsMatched, 30);
  const missingSkills = asStringArray(parsed?.missingSkills, 30);
  const keywordsTotal = Number.isFinite(parsed?.keywordsTotal)
    ? Math.max(0, Number(parsed.keywordsTotal))
    : keywordsMatched.length + missingSkills.length || fallback.keywordsTotal;

  return {
    atsScore: score,
    scoreLabel: typeof parsed?.scoreLabel === "string" ? parsed.scoreLabel : scoreLabel(score),
    overallVerdict:
      typeof parsed?.overallVerdict === "string" ? parsed.overallVerdict : fallback.overallVerdict,
    interviewReadiness:
      typeof parsed?.interviewReadiness === "string" ? parsed.interviewReadiness : fallback.interviewReadiness,
    roleMatch: typeof parsed?.roleMatch === "string" ? parsed.roleMatch : fallback.roleMatch,
    roleMatchReason:
      typeof parsed?.roleMatchReason === "string" ? parsed.roleMatchReason : fallback.roleMatchReason,
    sectionScores: asSectionScores(parsed?.sectionScores, fallback.sectionScores),
    keywordsMatched: keywordsMatched.length ? keywordsMatched : fallback.keywordsMatched,
    keywordsTotal,
    missingSkills: missingSkills.length ? missingSkills : fallback.missingSkills,
    strengthsList: asStringArray(parsed?.strengthsList, 12).length
      ? asStringArray(parsed?.strengthsList, 12)
      : fallback.strengthsList,
    skillsToAdd: asStringArray(parsed?.skillsToAdd, 15).length
      ? asStringArray(parsed?.skillsToAdd, 15)
      : fallback.skillsToAdd,
    formattingIssues: asStringArray(parsed?.formattingIssues, 8),
    summary: typeof parsed?.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
    suggestions:
      typeof parsed?.suggestions === "string" && parsed.suggestions.trim()
        ? parsed.suggestions.trim()
        : fallback.suggestions,
    keyChanges:
      typeof parsed?.keyChanges === "string" && parsed.keyChanges.trim()
        ? parsed.keyChanges.trim()
        : fallback.keyChanges,
    rewrittenSummary:
      typeof parsed?.rewrittenSummary === "string" && parsed.rewrittenSummary.trim()
        ? parsed.rewrittenSummary.trim()
        : fallback.rewrittenSummary,
    tailoredBullets: asStringArray(parsed?.tailoredBullets, 8).length
      ? asStringArray(parsed?.tailoredBullets, 8)
      : fallback.tailoredBullets,
    analysisSource: "ai",
  };
}

const AI_JSON_SCHEMA = {
  atsScore: "number 0-100",
  scoreLabel: "Excellent | Good | Fair | Weak",
  overallVerdict: "one sentence verdict for the candidate",
  interviewReadiness: "Almost ready | Needs work | Mismatch",
  roleMatch: "Strong | Partial | Weak",
  roleMatchReason: "2-3 sentences explaining fit vs gaps",
  sectionScores: { skills: "0-100", experience: "0-100", education: "0-100", formatting: "0-100" },
  keywordsMatched: "string[] important JD keywords found on resume",
  keywordsTotal: "number total important JD keywords tracked",
  missingSkills: "string[] JD requirements/skills absent or weak on resume",
  strengthsList: "string[] specific resume strengths with evidence",
  skillsToAdd: "string[] prioritized skills to add or emphasize",
  formattingIssues: "string[] ATS formatting problems if any, else []",
  summary: "3-5 sentences: WHY this score, what matched, what is missing",
  suggestions: "paragraph of actionable resume improvement advice",
  keyChanges: "string with 4-6 numbered priorities separated by blank lines (\\n\\n)",
  rewrittenSummary: "ready-to-paste 2-4 sentence professional summary tailored to this JD",
  tailoredBullets: "string[] 3-5 optimized resume bullets with metrics placeholders",
};

async function callOpenRouter({ resumeText, jobDescription, timeoutMs = 45000 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const resumeSlice = resume.slice(0, 14000);
  const jdSlice = jd.slice(0, 14000);
  const heuristic = heuristicCompare(resumeSlice, jdSlice);

  const system = [
    "You are an expert ATS resume coach and hiring analyst.",
    "Compare the candidate resume against the job description in depth.",
    "Extract REAL keywords, skills, and requirements from the texts — do not invent credentials the resume does not support.",
    "Be specific: cite actual skills, tools, and themes from both documents.",
    "Return ONLY valid JSON matching this exact schema (no markdown, no extra keys):",
    JSON.stringify(AI_JSON_SCHEMA),
  ].join(" ");

  const user = [
    "Produce a detailed, personalized ATS report.",
    "Rules:",
    "- keywordsMatched / missingSkills must come from the job description text.",
    "- strengthsList must cite real resume evidence (projects, roles, tools).",
    "- rewrittenSummary and tailoredBullets must use the candidate's actual background, mirror JD language, and include [metric] placeholders where numbers are unknown.",
    "- keyChanges: each item is one concrete action; separate items with a blank line.",
    "- If the resume is a poor fit, say so clearly but stay constructive.",
    "",
    `BaselineKeywordScan=${JSON.stringify({
      matched: heuristic.keywordsMatched,
      missing: heuristic.missingSkills,
      score: heuristic.atsScore,
    })}`,
    "",
    "JOB DESCRIPTION:",
    jdSlice,
    "",
    "RESUME:",
    resumeSlice,
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "https://jobtracker-ai.app",
        "X-Title": "Job Application Tracker",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.25,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenRouter error: ${res.status} ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = extractJsonObject(text);
    if (!parsed) throw new Error("OpenRouter response not valid JSON");

    return normalizeAnalysis(parsed, heuristic);
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeResume(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const fallback = heuristicCompare(resume, jd);

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY not set — using heuristic analysis. Set the key for AI-powered reports.");
    return fallback;
  }

  try {
    const llm = await callOpenRouter({ resumeText: resume, jobDescription: jd });
    return llm || fallback;
  } catch (error) {
    console.warn("AI provider failed, using heuristic fallback:", error.message);
    return { ...fallback, analysisSource: "heuristic-fallback" };
  }
}

module.exports = analyzeResume;
