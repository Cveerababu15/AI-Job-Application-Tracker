const { SCORE_LABELS } = require("./config");

function normalizeText(s) {
  return (s || "").toString().replace(/\s+/g, " ").trim();
}

function scoreLabel(score) {
  const s = Number(score) || 0;
  return SCORE_LABELS.find((x) => s >= x.min)?.label || "Weak";
}

function keywordInText(text, kw) {
  const lower = (text || "").toLowerCase();
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[^a-z0-9./+#-])${escaped}(?:[^a-z0-9./+#-]|$)`);
  return re.test(lower);
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

module.exports = {
  normalizeText,
  scoreLabel,
  keywordInText,
  extractJsonObject,
  asStringArray,
  asSectionScores,
};
