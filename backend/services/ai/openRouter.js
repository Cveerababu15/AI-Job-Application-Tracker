const {
  OPENROUTER_ENDPOINT,
  DEFAULT_MODEL,
  AI_JSON_SCHEMA,
  getApiKey,
} = require("./config");
const {
  normalizeText,
  scoreLabel,
  extractJsonObject,
  asStringArray,
  asSectionScores,
} = require("./textUtils");
const { heuristicCompare } = require("./heuristic");

function normalizeAnalysis(parsed, fallback) {
  const score = Number.isFinite(parsed?.atsScore)
    ? Math.max(0, Math.min(100, Number(parsed.atsScore)))
    : fallback.atsScore;

  const keywordsMatched = asStringArray(parsed?.keywordsMatched, 30);
  const missingSkills = asStringArray(parsed?.missingSkills, 30);
  const keywordsTotal = Number.isFinite(parsed?.keywordsTotal)
    ? Math.max(keywordsMatched.length + missingSkills.length, Number(parsed.keywordsTotal))
    : keywordsMatched.length + missingSkills.length || fallback.keywordsTotal;

  return {
    atsScore: score,
    scoreLabel: typeof parsed?.scoreLabel === "string" ? parsed.scoreLabel : scoreLabel(score),
    overallVerdict: typeof parsed?.overallVerdict === "string" ? parsed.overallVerdict : fallback.overallVerdict,
    interviewReadiness: typeof parsed?.interviewReadiness === "string" ? parsed.interviewReadiness : fallback.interviewReadiness,
    roleMatch: typeof parsed?.roleMatch === "string" ? parsed.roleMatch : fallback.roleMatch,
    roleMatchReason: typeof parsed?.roleMatchReason === "string" ? parsed.roleMatchReason : fallback.roleMatchReason,
    sectionScores: asSectionScores(parsed?.sectionScores, fallback.sectionScores),
    keywordsMatched: keywordsMatched.length ? keywordsMatched : fallback.keywordsMatched,
    keywordsTotal,
    missingSkills: missingSkills.length ? missingSkills : fallback.missingSkills,
    strengthsList: asStringArray(parsed?.strengthsList, 12).length ? asStringArray(parsed?.strengthsList, 12) : fallback.strengthsList,
    skillsToAdd: asStringArray(parsed?.skillsToAdd, 15).length ? asStringArray(parsed?.skillsToAdd, 15) : fallback.skillsToAdd,
    formattingIssues: asStringArray(parsed?.formattingIssues, 8),
    summary: typeof parsed?.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
    suggestions: typeof parsed?.suggestions === "string" && parsed.suggestions.trim() ? parsed.suggestions.trim() : fallback.suggestions,
    keyChanges: typeof parsed?.keyChanges === "string" && parsed.keyChanges.trim() ? parsed.keyChanges.trim() : fallback.keyChanges,
    rewrittenSummary: typeof parsed?.rewrittenSummary === "string" && parsed.rewrittenSummary.trim() ? parsed.rewrittenSummary.trim() : fallback.rewrittenSummary,
    tailoredBullets: asStringArray(parsed?.tailoredBullets, 8).length ? asStringArray(parsed?.tailoredBullets, 8) : fallback.tailoredBullets,
    analysisSource: "ai",
  };
}

async function callOpenRouter({ resumeText, jobDescription, timeoutMs = 55000 }) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const resumeSlice = resume.slice(0, 14000);
  const jdSlice = jd.slice(0, 14000);
  const heuristic = heuristicCompare(resumeSlice, jdSlice);

  const system = [
    "You are an expert career coach and ATS analyst for ALL industries (tech, business, healthcare, finance, education, etc.).",
    "Analyze the FULL job description and FULL resume — not a tiny keyword list.",
    "Extract 10-20 meaningful requirements from the JD: tools, skills, responsibilities, education, experience level, soft skills.",
    "Give partial credit for TRANSFERABLE skills (React↔Angular, MongoDB↔Firebase, Excel↔Google Sheets, etc.).",
    "Use ONLY facts from the resume — never invent employers, degrees, or tools the candidate does not have.",
    "Be honest: if stack differs (MERN vs Angular/Firebase), say so but highlight transferable frontend/backend/deployment/AI experience.",
    "Return ONLY valid JSON matching this schema (no markdown):",
    JSON.stringify(AI_JSON_SCHEMA),
  ].join(" ");

  const user = [
    "Create a personalized ATS report for this candidate applying to this specific job.",
    "",
    "Scoring guidance:",
    "- 75-100: strong direct + transferable alignment",
    "- 55-74: partial fit — reframe resume toward role",
    "- below 55: major gaps — suggest upskilling or different roles",
    "",
    "For keywordsMatched: list JD requirements found on resume OR satisfied by transferable experience.",
    "For strengthsList: cite specific projects, internship, metrics from the resume.",
    "For tailoredBullets: rewrite using the candidate's actual projects and experience where relevant.",
    "",
    `HeuristicBaseline=${JSON.stringify({
      score: heuristic.atsScore,
      matched: heuristic.keywordsMatched,
      missing: heuristic.missingSkills,
    })}`,
    "",
    "=== JOB DESCRIPTION ===",
    jdSlice,
    "",
    "=== RESUME ===",
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
        temperature: 0.3,
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

module.exports = { callOpenRouter };
