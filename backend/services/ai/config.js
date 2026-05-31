const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

const SKILL_CATALOG = [
  "angular", "react", "react.js", "vue", "svelte", "next.js", "html5", "html", "css3", "css",
  "javascript", "typescript", "tailwind css", "tailwind", "bootstrap", "responsive design",
  "node.js", "nodejs", "express.js", "express", "firebase", "firestore", "mongodb", "mongoose",
  "sql", "postgresql", "mysql", "rest api", "rest", "api design", "socket.io",
  "aws", "azure", "gcp", "docker", "kubernetes", "vercel", "render", "cloudinary", "ci/cd",
  "machine learning", "deep learning", "hugging face", "chatgpt", "claude", "cursor", "ai tools",
  "llm", "nlp", "python", "java", "git", "github", "postman", "vs code",
  "jwt", "authentication", "rbac", "mvc", "testing", "debugging", "agile", "scrum",
  "full stack", "mern", "deployment", "version control",
  "communication", "leadership", "teamwork", "problem solving", "project management",
  "customer service", "sales", "marketing", "accounting", "excel", "data analysis",
];

const TRANSFERABLE = {
  angular: ["react", "vue", "javascript", "typescript", "frontend", "html", "css", "tailwind"],
  react: ["angular", "vue", "javascript", "frontend"],
  firebase: ["mongodb", "mongoose", "nosql", "jwt", "authentication", "real-time", "deployment", "vercel", "render"],
  "node.js": ["express", "backend", "rest api", "api"],
  express: ["node.js", "backend", "rest api"],
  mongodb: ["firebase", "nosql", "database", "mongoose"],
  java: ["javascript", "backend", "spring"],
  python: ["data analysis", "machine learning", "automation"],
  aws: ["cloud", "deployment", "vercel", "render", "docker"],
  communication: ["collaborat", "stakeholder", "present", "intern", "team"],
  testing: ["jest", "debugging", "quality", "cypress"],
  "ai tools": ["hugging face", "chatgpt", "claude", "cursor", "ai integration", "ai"],
  chatgpt: ["ai", "hugging face", "claude", "cursor", "ai tools"],
  claude: ["ai", "chatgpt", "cursor", "ai tools"],
  cursor: ["ai", "chatgpt", "claude", "ai tools"],
};

const SCORE_LABELS = [
  { min: 85, label: "Excellent" },
  { min: 70, label: "Good" },
  { min: 50, label: "Fair" },
  { min: 0, label: "Weak" },
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "using", "experience", "years", "year", "role", "work",
  "team", "ability", "skills", "strong", "good", "basic", "knowledge", "preferred",
  "candidate", "profile", "responsibilities", "requirements", "department", "type",
  "full", "time", "permanent", "other", "any", "specialization", "related", "field",
  "welcome", "least", "one", "live", "academic", "project", "projects", "etc",
]);

const AI_JSON_SCHEMA = {
  atsScore: "number 0-100 — factor direct matches AND transferable skills (e.g. React→Angular, MongoDB→Firebase)",
  scoreLabel: "Excellent | Good | Fair | Weak",
  overallVerdict: "one sentence honest verdict",
  interviewReadiness: "Almost ready | Needs work | Mismatch",
  roleMatch: "Strong | Partial | Weak",
  roleMatchReason: "3-4 sentences: what matches, what is transferable, what is missing",
  sectionScores: { skills: "0-100", experience: "0-100", education: "0-100", formatting: "0-100" },
  keywordsMatched: "string[] requirements from JD found on resume (include transferable matches labeled)",
  keywordsTotal: "number — count ALL important requirements extracted from JD (aim 10-20)",
  missingSkills: "string[] critical JD requirements absent from resume",
  strengthsList: "string[] 4-8 specific strengths citing resume evidence (projects, metrics, roles)",
  skillsToAdd: "string[] 3-8 prioritized gaps to close",
  formattingIssues: "string[] or empty",
  summary: "4-6 sentences explaining score: matches, transferable skills, gaps, education/experience fit",
  suggestions: "detailed paragraph of role-specific advice",
  keyChanges: "5-7 concrete actions separated by blank lines (\\n\\n)",
  rewrittenSummary: "2-4 sentences using candidate's REAL experience tailored to THIS job",
  tailoredBullets: "string[] 4-5 bullets using candidate's actual projects/internship with [metric] placeholders",
};

function getApiKey() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const openai = process.env.OPENAI_API_KEY || "";
  if (openai.startsWith("sk-or-")) return openai;
  return null;
}

module.exports = {
  OPENROUTER_ENDPOINT,
  DEFAULT_MODEL,
  SKILL_CATALOG,
  TRANSFERABLE,
  SCORE_LABELS,
  STOPWORDS,
  AI_JSON_SCHEMA,
  getApiKey,
};
