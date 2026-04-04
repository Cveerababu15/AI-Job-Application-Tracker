import { useState } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCloudArrowUp,
  HiOutlineSparkles,
} from "react-icons/hi2";
import API from "../services/api.js";

function formatList(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatKeyChanges(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n\n");
  return String(value);
}

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      setResult(res.data.analysis);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
          <HiOutlineSparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resume vs job match
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
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            The API field name is <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-200">jobDescription</code> (for Postman: add this key under form-data).
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Resume (PDF)
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

      {result && (
        <div className="mt-8 space-y-6">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Match overview
              </h2>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  ATS-style score
                </p>
                <p className="text-4xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {result.atsScore ?? "—"}
                </p>
              </div>
            </div>

            {result.summary && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Summary
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {result.summary}
                </p>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Skills to add or emphasize
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {formatList(result.skillsToAdd) || formatList(result.missingSkills) || "—"}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Gaps vs job keywords
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {formatList(result.missingSkills) || "—"}
            </p>
          </div>

          {result.keyChanges && (
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Changes to make on your resume
              </h3>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {formatKeyChanges(result.keyChanges)}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Suggestions
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {result.suggestions ?? "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
