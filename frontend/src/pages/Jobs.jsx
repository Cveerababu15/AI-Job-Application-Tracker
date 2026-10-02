import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { HiOutlineBriefcase, HiOutlineTrash } from "react-icons/hi2";

import { deleteJob, getJobs, updateJob } from "../services/job.js";

const STATUS_OPTIONS = ["Applied", "Interviewing", "Offered", "Rejected"];

const badgeClass = {
  Applied:
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",

  Interviewing:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200",

  Offered:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200",

  Rejected:
    "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200",
};

/**
 * Debounce hook
 *
 * Waits for the user to stop typing before updating
 * the debounced value.
 */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Memoized Job Row
 *
 * React.memo prevents this component from re-rendering
 * when its props have not changed.
 */
const JobRow = memo(function JobRow({
  job,
  onStatusChange,
  onDelete,
}) {
  return (
    <li className="glass rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {job.companyName}
          </h2>

          <p className="text-slate-600 dark:text-slate-400">
            {job.role}
          </p>

          {job.jobLink && (
            <a
              href={job.jobLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Open posting
            </a>
          )}
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            badgeClass[job.status] || badgeClass.Applied
          }`}
        >
          {job.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Status
        </label>

        <select
          value={job.status}
          onChange={(e) =>
            onStatusChange(job._id, e.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onDelete(job._id)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          <HiOutlineTrash className="h-4 w-4" />
          Delete
        </button>
      </div>
    </li>
  );
});

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  /**
   * Debounced search value.
   *
   * query       -> changes immediately while typing
   * debouncedQuery -> changes after 300ms
   */
  const debouncedQuery = useDebouncedValue(query, 300);

  /**
   * Fetch jobs
   */
  const fetchJobs = useCallback(async () => {
    try {
      const res = await getJobs();

      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load jobs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial API request
   */
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /**
   * Delete job
   */
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Remove this application?")) {
      return;
    }

    try {
      await deleteJob(id);

      toast.success("Application removed.");

      // Update local state instead of making another GET request.
      setJobs((prev) =>
        prev.filter((job) => job._id !== id)
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Delete failed."
      );
    }
  }, []);

  /**
   * Update job status
   */
  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await updateJob(id, { status });

      toast.success("Status updated.");

      // Update only the changed job locally.
      setJobs((prev) =>
        prev.map((job) =>
          job._id === id
            ? { ...job, status }
            : job
        )
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Update failed."
      );
    }
  }, []);

  /**
   * Filter jobs
   *
   * useMemo avoids running the filtering operation
   * when unrelated component state changes.
   */
  const filteredJobs = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) {
      return jobs;
    }

    return jobs.filter(
      (job) =>
        job.companyName?.toLowerCase().includes(q) ||
        job.role?.toLowerCase().includes(q)
    );
  }, [jobs, debouncedQuery]);

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Applications
          </h1>

          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage status and notes for each role.
          </p>
        </div>

        <Link
          to="/add-job"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
        >
          Add job
        </Link>
      </div>

      {/* Search */}
      <div className="mt-8">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or role"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-md"
        />
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="glass mt-12 rounded-2xl p-12 text-center">
          <HiOutlineBriefcase className="mx-auto h-12 w-12 text-slate-400" />

          <p className="mt-4 text-slate-600 dark:text-slate-400">
            No applications yet.
          </p>

          <Link
            to="/add-job"
            className="mt-4 inline-block font-semibold text-indigo-600 dark:text-indigo-400"
          >
            Add your first application →
          </Link>
        </div>
      ) : filteredJobs.length === 0 ? (
        /* Search has no results */
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No applications match "{query}".
          </p>
        </div>
      ) : (
        /* Jobs */
        <ul className="mt-10 space-y-4">
          {filteredJobs.map((job) => (
            <JobRow
              key={job._id}
              job={job}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default Jobs;