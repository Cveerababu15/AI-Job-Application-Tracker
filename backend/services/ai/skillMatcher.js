const { SKILL_CATALOG, TRANSFERABLE, STOPWORDS } = require("./config");
const { keywordInText } = require("./textUtils");

function findCatalogSkills(text) {
  const lower = (text || "").toLowerCase();
  const sorted = [...SKILL_CATALOG].sort((a, b) => b.length - a.length);
  const found = [];
  for (const kw of sorted) {
    if (keywordInText(lower, kw)) found.push(kw);
  }
  return found;
}

function extractDynamicTerms(text) {
  const terms = new Set();
  const raw = text || "";

  for (const m of raw.matchAll(/\(([^)]+)\)/g)) {
    m[1].split(/[,;/|]/).forEach((p) => {
      const t = p.replace(/\betc\.?\b/gi, "").trim();
      if (t.length > 2 && t.length < 50) terms.add(t.toLowerCase());
    });
  }

  for (const m of raw.matchAll(
    /(?:using|with|in|including|experience (?:in|with)|proficient in|knowledge of|skilled in|built with)\s+([^.;\n]{3,80})/gi
  )) {
    m[1].split(/,|\band\b|\//).forEach((p) => {
      const t = p.trim().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
      if (t.length > 2 && t.length < 40 && !STOPWORDS.has(t.toLowerCase())) {
        terms.add(t.toLowerCase());
      }
    });
  }

  for (const line of raw.split(/\n+/)) {
    const cleaned = line.replace(/^[\s\-*•\d.)]+/, "").trim();
    if (cleaned.length < 8 || cleaned.length > 120) continue;
    if (/develop|maintain|collaborat|ensure|provide|design|manage|support|deliver|implement/i.test(cleaned)) {
      const tools = cleaned.match(/\b[A-Z][a-zA-Z.+#]*(?:\s[A-Z][a-zA-Z.+#]*)*\b/g) || [];
      tools.forEach((t) => {
        if (t.length > 2 && t.length < 30) terms.add(t.toLowerCase());
      });
    }
  }

  return [...terms];
}

function mergeSkillLists(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
  }
  return out;
}

function isTransferableMatch(jdSkill, resumeText) {
  const lower = resumeText.toLowerCase();
  const related = TRANSFERABLE[jdSkill.toLowerCase()] || [];
  return related.some((r) => lower.includes(r));
}

function matchSkills(jdSkills, resumeText) {
  const resumeLower = resumeText.toLowerCase();
  const matched = [];
  const partial = [];
  const missing = [];

  for (const skill of jdSkills) {
    const s = skill.toLowerCase();
    if (keywordInText(resumeLower, s)) {
      matched.push(skill);
    } else if (isTransferableMatch(s, resumeText)) {
      partial.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, partial, missing };
}

function computeScore(matched, partial, missing) {
  const total = matched.length + partial.length + missing.length;
  if (!total) return 52;
  const weighted = matched.length * 1 + partial.length * 0.65;
  return Math.min(100, Math.max(0, Math.round((weighted / total) * 100)));
}

module.exports = {
  findCatalogSkills,
  extractDynamicTerms,
  mergeSkillLists,
  matchSkills,
  computeScore,
  TRANSFERABLE,
};
