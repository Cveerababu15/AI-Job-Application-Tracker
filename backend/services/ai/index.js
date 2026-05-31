const { getApiKey } = require("./config");
const { normalizeText } = require("./textUtils");
const { heuristicCompare } = require("./heuristic");
const { callOpenRouter } = require("./openRouter");

async function analyzeResume(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);
  const fallback = heuristicCompare(resume, jd);

  if (!getApiKey()) {
    console.warn("No OpenRouter API key — set OPENROUTER_API_KEY (or OPENAI_API_KEY with sk-or- prefix).");
    return fallback;
  }

  try {
    const llm = await callOpenRouter({ resumeText: resume, jobDescription: jd });
    return llm || fallback;
  } catch (error) {
    console.warn("AI provider failed, using enhanced heuristic:", error.message);
    return { ...fallback, analysisSource: "heuristic-fallback" };
  }
}

module.exports = analyzeResume;
