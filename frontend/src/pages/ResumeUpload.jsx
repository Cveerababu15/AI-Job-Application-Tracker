import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCloudArrowUp,
  HiOutlineSparkles,
} from "react-icons/hi2";
import API from "../services/api.js";

function formatKeyChanges(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n\n");
  return String(value);
}

function splitBullets(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n{2,}|\r\n{2,}/g)
    .map((s) => s.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function levelColorByLabel(label) {
  switch (String(label || "").toLowerCase()) {
    case "excellent":
      return "text-[#22C55E]";
    case "good":
      return "text-[#3B82F6]";
    case "fair":
      return "text-[#F59E0B]";
    case "weak":
    case "poor":
      return "text-[#EF4444]";
    default:
      return "text-indigo-600 dark:text-indigo-400";
  }
}

function badgeColor(kind) {
  const k = String(kind || "").toLowerCase();
  if (["excellent", "strong", "ready"].includes(k)) return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
  if (["good", "partial", "almost ready"].includes(k)) return "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
  if (["fair"].includes(k)) return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
  if (["weak", "poor", "mismatch", "needs work"].includes(k)) return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
  return "bg-slate-200/40 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700";
}

function Ring({ value = 0, label, sublabel }) {
  const pct = clamp(value, 0, 100);
  const [shown, setShown] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let start = null;
    const duration = 900;
    const from = 0;
    const to = pct;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [pct]);

  const ringStyle = {
    background: `conic-gradient(#3B82F6 ${shown * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative grid h-40 w-40 place-items-center rounded-full p-2"
        style={ringStyle}
        aria-label="ATS score"
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-white text-center dark:bg-[#0F1117]">
          <div>
            <div className="text-5xl font-bold tabular-nums text-slate-900 dark:text-white">
              {shown}
            </div>
            {label && (
              <div className={`mt-1 text-sm font-semibold ${levelColorByLabel(label)}`}>
                {label}
              </div>
            )}
          </div>
        </div>
      </div>
      {sublabel ? (
        <p className="max-w-md text-center text-sm italic text-slate-600 dark:text-slate-400">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}

function ProgressRow({ label, value }) {
  const v = clamp(value, 0, 100);
  const [w, setW] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setW(v), 120);
    return () => clearTimeout(id);
  }, [v]);

  const color =
    v >= 70 ? "bg-[#22C55E]" : v >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-600 dark:text-slate-400">{v}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200/60 dark:bg-slate-800/60">
        <div
          className={`h-2 rounded-full ${color} transition-[width] duration-700`}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const toneClass =
    tone === "good"
      ? "border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]"
      : tone === "bad"
        ? "border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]"
        : "border-slate-200 bg-white/60 text-slate-700 dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200";
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60 ${className}`} />;
}

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stageText, setStageText] = useState("Scanning keywords...");
  const [showAllMissing, setShowAllMissing] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warning("Choose a PDF resume first.");
      return;
    }
    if (file.type && !file.type.includes("pdf") && !file.name?.toLowerCase().endsWith(".pdf")) {
      toast.warning("Please upload a PDF file.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.warning("Paste the job description so we can compare it to your resume.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription.trim());

    setLoading(true);
    setResult(null);
    try {
      const res = await API.post("/ai/analyze", formData);
      const next = res.data?.data || res.data?.analysis || res.data?.result || null;
      setResult(next);
      toast.success(res.data.message || "Analysis complete.");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Analysis failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;
    const steps = [
      "Scanning keywords...",
      "Scoring sections...",
      "Generating rewrites...",
      "Finalizing report...",
    ];
    let i = 0;
    setStageText(steps[0]);
    const t = setInterval(() => {
      i = (i + 1) % steps.length;
      setStageText(steps[i]);
    }, 2000);
    return () => clearInterval(t);
  }, [loading]);

  const matchedKeywords = useMemo(() => {
    if (Array.isArray(result?.keywordsMatched)) return result.keywordsMatched;
    return [];
  }, [result]);

  const missingKeywords = useMemo(() => {
    if (Array.isArray(result?.missingSkills)) return result.missingSkills;
    return [];
  }, [result]);

  const missingVisible = useMemo(() => {
    const list = missingKeywords || [];
    if (showAllMissing) return list;
    return list.slice(0, 20);
  }, [missingKeywords, showAllMissing]);

  const handleCopy = async (text, label = "Copied!") => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      toast.success(label, { autoClose: 2000 });
    } catch {
      toast.error("Copy failed", { autoClose: 2000 });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
          <HiOutlineSparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resume  vs  job match
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">Step 1:</strong> paste the job ad text.
            <strong className="text-slate-800 dark:text-slate-200"> Step 2:</strong> upload your resume PDF.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleUpload}
        className="glass mt-8 space-y-6 rounded-2xl p-6 sm:p-8"
      >
        <div>
          <label
            htmlFor="job-description"
            className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            <HiOutlineClipboardDocumentList className="h-5 w-5 text-indigo-500" />
            <span>Job description</span>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
              Required
            </span>
          </label>
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
            This is the large text box <span className="font-medium">above</span> your PDF upload. Copy the full posting from the company site (title, requirements, stack).
          </p>
          <textarea
            id="job-description"
            name="jobDescription"
            required
            rows={8}
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setResult(null);
            }}
            placeholder="Paste the full job posting here (role, requirements, tech stack, responsibilities)…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Add your resume Here (PDF)
          </span>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 transition hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20">
            <HiOutlineCloudArrowUp className="h-10 w-10 text-indigo-500" />
            <span className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              {file ? file.name : "Click to select a PDF"}
            </span>
            <span className="mt-1 text-xs text-slate-500">PDF only</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !file || !jobDescription.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Compare resume to job"}
        </button>
      </form>

      {loading && (
        <div className="mt-8 space-y-6">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Generating report
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{stageText}</p>
              </div>
              <SkeletonBlock className="h-10 w-28" />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SkeletonBlock className="h-40" />
              <SkeletonBlock className="h-40 sm:col-span-2" />
              <SkeletonBlock className="h-40 sm:col-span-3" />
            </div>
          </div>
          <div className="glass rounded-2xl p-6 sm:p-8">
            <SkeletonBlock className="h-5 w-48" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-11/12" />
              <SkeletonBlock className="h-3 w-10/12" />
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="mt-8 space-y-6">
          {result.analysisSource && result.analysisSource !== "ai" && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
              Basic keyword report — add <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">OPENROUTER_API_KEY</code> (or OpenRouter key as <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">OPENAI_API_KEY</code>) on the backend and restart for full AI analysis.
            </div>
          )}
          <div className="glass rounded-2xl p-6 sm:p-8 dark:bg-[#0F1117]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  ATS report
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  A clear breakdown of why you scored this, plus optimized rewrites.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {result.interviewReadiness && (
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor(result.interviewReadiness)}`}>
                      Interview: {result.interviewReadiness}
                    </span>
                  )}
                  {result.roleMatch && (
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor(result.roleMatch)}`}>
                      Role match: {result.roleMatch}
                    </span>
                  )}
                </div>

                {result.roleMatchReason && (
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Why role match:</span> {result.roleMatchReason}
                  </p>
                )}
              </div>

              <Ring
                value={result.atsScore ?? 0}
                label={result.scoreLabel}
                sublabel={result.overallVerdict || ""}
              />
            </div>
          </div>

          {result.sectionScores && (
            <Section title="Section scores" defaultOpen={true}>
              <div className="grid grid-cols-1 gap-4">
                <ProgressRow label="Skills" value={result.sectionScores.skills} />
                <ProgressRow label="Experience" value={result.sectionScores.experience} />
                <ProgressRow label="Education" value={result.sectionScores.education} />
                <ProgressRow label="Formatting" value={result.sectionScores.formatting} />
              </div>
            </Section>
          )}

          {(matchedKeywords.length > 0 || missingKeywords.length > 0 || Number.isFinite(result.keywordsTotal)) && (
            <Section title="Keyword intelligence" defaultOpen={true}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Keywords: {matchedKeywords.length} / {result.keywordsTotal ?? matchedKeywords.length + missingKeywords.length} matched
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-[#2A2D3E] dark:bg-[#1A1D27]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                     Matched keywords
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchedKeywords.length ? matchedKeywords.map((k, idx) => <Pill key={`${k}-${idx}`} tone="good">{k}</Pill>) : <span className="text-sm text-slate-600 dark:text-slate-400">—</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-[#2A2D3E] dark:bg-[#1A1D27]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                     Missing keywords
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingVisible.length ? missingVisible.map((k, idx) => <Pill key={`${k}-${idx}`} tone="bad">{k}</Pill>) : <span className="text-sm text-slate-600 dark:text-slate-400">—</span>}
                  </div>
                  {missingKeywords.length > 20 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMissing((v) => !v)}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {showAllMissing ? "Show less" : `Show more (${missingKeywords.length - 20} more)`}
                    </button>
                  )}
                </div>
              </div>
            </Section>
          )}

          {(Array.isArray(result.strengthsList) || Array.isArray(result.skillsToAdd)) && (
            <Section title="Strengths & priorities" defaultOpen={true}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-[#2A2D3E] dark:bg-[#1A1D27]">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your Strengths</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {(result.strengthsList || []).length ? (
                      result.strengthsList.map((s, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-bold text-[#22C55E]">+</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-600 dark:text-slate-400">—</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-[#2A2D3E] dark:bg-[#1A1D27]">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Add These Skills</h3>
                  <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {(result.skillsToAdd || []).length ? (
                      result.skillsToAdd.map((s, idx) => <li key={idx}>{s}</li>)
                    ) : (
                      <li className="list-none text-slate-600 dark:text-slate-400">—</li>
                    )}
                  </ol>
                </div>
              </div>
            </Section>
          )}

          {Array.isArray(result.formattingIssues) && result.formattingIssues.length > 0 && (
            <div className="rounded-2xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 p-6 text-slate-900 dark:text-white">
              <h3 className="text-sm font-semibold">Formatting issues</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-800 dark:text-slate-200">
                {result.formattingIssues.map((i, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-bold text-[#F59E0B]">!</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="AI recommendations" defaultOpen={true}>
            {result.summary && (
              <div className="rounded-xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Summary
                </p>
                <p className="mt-2 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {result.suggestions && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Suggestions
                </p>
                <p className="mt-2 leading-relaxed">{result.suggestions}</p>
              </div>
            )}

            {result.keyChanges && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Key changes (do these first)
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {splitBullets(formatKeyChanges(result.keyChanges)).map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700 dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-indigo-600/15 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {(result.rewrittenSummary || Array.isArray(result.tailoredBullets)) && (
            <Section title="AI-generated rewrites" defaultOpen={true}>
              {result.rewrittenSummary && (
                <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/10 to-violet-500/5 p-6 dark:border-indigo-400/25">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Tailored Professional Summary
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Ready to Paste
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.rewrittenSummary, "Summary copied!")}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm leading-relaxed text-slate-800 dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200">
                    {result.rewrittenSummary}
                  </div>
                </div>
              )}

              {Array.isArray(result.tailoredBullets) && result.tailoredBullets.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-6 dark:border-[#2A2D3E] dark:bg-[#1A1D27]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Optimized Bullet Points
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Replace your weakest bullets with these
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {result.tailoredBullets.map((b, idx) => (
                      <li key={idx} className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-800 dark:border-[#2A2D3E] dark:bg-[#0F1117] dark:text-slate-200">
                        <span className="leading-relaxed">{b}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(b, "Bullet copied!")}
                          className="invisible rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 group-hover:visible dark:border-[#2A2D3E] dark:bg-[#1A1D27] dark:text-slate-200 dark:hover:bg-[#1E2230]"
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
