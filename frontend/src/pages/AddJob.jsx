import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { HiOutlineBriefcase, HiOutlineLink } from "react-icons/hi2";
import { addJob } from "../services/job.js";

const STATUS_OPTIONS = ["Applied", "Interviewing", "Offered", "Rejected"];

function AddJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    role: "",
    jobLink: "",
    notes: "",
    status: "Applied",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName?.trim() || !form.role?.trim()) {
      toast.warning("Company and role are required.");
      return;
    }
    setLoading(true);
    try {
      await addJob({
        companyName: form.companyName.trim(),
        role: form.role.trim(),
        jobLink: form.jobLink?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        status: form.status,
      });
      toast.success("Job application saved.");
      navigate("/jobs");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add job.");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Add application
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Log a new role and track it through your pipeline.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-5 rounded-2xl p-6 sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Company
          </label>
          <div className="relative">
            <HiOutlineBriefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className={`${field} pl-11`}
              placeholder="e.g. Acme Corp"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Role
          </label>
          <input
            className={field}
            placeholder="e.g. Frontend Engineer"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Job link (optional)
          </label>
          <div className="relative">
            <HiOutlineLink className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className={`${field} pl-11`}
              type="url"
              placeholder="https://..."
              value={form.jobLink}
              onChange={(e) => setForm({ ...form, jobLink: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
          </label>
          <select
            className={field}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes (optional)
          </label>
          <textarea
            className={`${field} min-h-[100px] resize-y`}
            placeholder="Interview dates, contacts, etc."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save application"}
        </button>
      </form>
    </div>
  );
}

export default AddJob;
