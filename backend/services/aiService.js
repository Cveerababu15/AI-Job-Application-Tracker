/**
 * Keyword catalogue for matching job descriptions and resumes (heuristic ATS-style).
 * Order does not matter; matching is substring-based (lowercase).
 */
const TECH_KEYWORDS = [
  "javascript", "typescript", "python", "java", "c#", "c++", "go", "rust", "ruby", "php",
  "node.js", "nodejs", "express", "nestjs", "react", "vue", "angular", "next.js", "redux",
  "html", "css", "sass", "scss", "tailwind", "bootstrap",
  "mongodb", "postgresql", "mysql", "redis", "sql", "nosql", "dynamodb", "firebase",
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ci/cd", "terraform",
  "graphql", "rest", "api", "microservices", "kafka", "rabbitmq",
  "git", "github", "agile", "scrum", "jest", "mocha", "pytest", "unit testing",
  "machine learning", "tensorflow", "pytorch", "nlp", "data analysis",
  "figma", "ui/ux", "responsive", "accessibility",
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
  "do", "does", "did", "will", "would", "should", "could", "may", "might", "must",
  "this", "that", "these", "those", "it", "we", "you", "they", "our", "your", "their",
  "who", "what", "which", "about", "into", "through", "during", "before", "after",
  "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "not", "only", "same", "so", "than", "too", "very", "just", "also", "here", "there",
  "when", "where", "why", "how", "any", "can", "if", "then", "else", "using", "including",
]);

/**
 * Find known tech / role keywords present in text.
 * @param {string} text
 * @returns {string[]}
 */
function findKeywordsInText(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = [];
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  return [...new Set(found)];
}

/**
 * Extra salient tokens from job description (longer words often carry skill meaning).
 * @param {string} jd
 * @returns {string[]}
 */
function extractJdFocusTerms(jd) {
  const words = jd.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, " ").split(/\s+/);
  const terms = words.filter((w) => w.length > 4 && !STOPWORDS.has(w));
  const freq = {};
  for (const w of terms) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);
}

/**
 * Compare resume against job description: ATS-style score, gaps, and narrative fields.
 * @param {string} resumeText
 * @param {string} jobDescription
 */
function compareResumeToJob(resumeText, jobDescription) {
  const resumeLower = (resumeText || "").toLowerCase();
  const jd = jobDescription || "";

  const jdKeywords = findKeywordsInText(jd);
  const resumeKeywords = findKeywordsInText(resumeText);

  const jdSet = new Set(jdKeywords.map((k) => k.toLowerCase()));
  const matched = jdKeywords.filter((k) => resumeLower.includes(k.toLowerCase()));
  const missingFromJd = jdKeywords.filter((k) => !resumeLower.includes(k.toLowerCase()));

  let atsScore = 0;
  if (jdKeywords.length > 0) {
    atsScore = Math.round((matched.length / jdKeywords.length) * 100);
  } else {
    const focus = extractJdFocusTerms(jd);
    let hits = 0;
    for (const term of focus) {
      if (resumeLower.includes(term)) hits += 1;
    }
    atsScore = focus.length ? Math.min(100, Math.round((hits / focus.length) * 70) + 15) : 45;
  }

  atsScore = Math.min(100, Math.max(0, atsScore));

  const skillsToAdd = [...new Set(missingFromJd)].slice(0, 10);

  const summaryParts = [];
  summaryParts.push(
    `Compared your resume against this job description: ${jdKeywords.length ? `${matched.length} of ${jdKeywords.length} listed technical keywords appear on your resume.` : "Keyword overlap was estimated from the job text and your resume."}`
  );
  if (atsScore >= 75) {
    summaryParts.push("Strong alignment — tighten wording and quantify impact to stand out further.");
  } else if (atsScore >= 50) {
    summaryParts.push("Moderate fit — adding missing keywords and mirroring the posting’s language will help ATS and recruiters.");
  } else {
    summaryParts.push("Gap-heavy match — prioritize adding the missing skills and relevant projects before applying.");
  }
  const summary = summaryParts.join(" ");

  const keyChanges = [];
  if (skillsToAdd.length) {
    keyChanges.push(`Add or surface these job-relevant skills: ${skillsToAdd.slice(0, 6).join(", ")}.`);
  }
  keyChanges.push("Mirror important phrases from the job description in your summary and skills sections (without copying verbatim).");
  keyChanges.push("Use measurable outcomes (%, revenue, latency, team size) next to each major bullet.");
  if (!resumeLower.includes("project") && !resumeLower.includes("experience")) {
    keyChanges.push("Add a concise projects or professional experience section if missing.");
  }
  keyChanges.push("Ensure your headline or title line reflects the role you are targeting.");

  const suggestionLines = [];
  suggestionLines.push(
    "Reorder bullets so the most relevant tools and outcomes for this role appear in the top third of your resume."
  );
  suggestionLines.push(
    "If you have used a missing skill informally, rename the bullet to include the exact keyword (e.g. “Built REST APIs with Express” vs “built backend”)."
  );
  if (missingFromJd.length > 3) {
    suggestionLines.push(
      `Focus learning or portfolio pieces on: ${skillsToAdd.slice(0, 5).join(", ")}.`
    );
  }
  const suggestions = suggestionLines.join(" ");

  return {
    atsScore,
    summary,
    missingSkills: missingFromJd.length ? missingFromJd : skillsToAdd,
    skillsToAdd,
    suggestions,
    keyChanges: keyChanges.join("\n\n"),
  };
}

/**
 * @param {string} resumeText
 * @param {string} jobDescription
 */
function analyzeResume(resumeText, jobDescription) {
  return compareResumeToJob(resumeText, jobDescription);
}

module.exports = analyzeResume;
