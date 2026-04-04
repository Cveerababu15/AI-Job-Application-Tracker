import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiArrowRight,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import API from "../services/api.js";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await API.get("/jobs/dashboard");
        if (!cancelled) setStats(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.message || err.message || "Could not load dashboard.";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      label: "Total applications",
      value: stats?.total ?? "—",
      icon: HiOutlineBriefcase,
      accent: "from-indigo-500 to-violet-600",
    },
    {
      label: "Interviews",
      value: stats?.interviews ?? "—",
      icon: HiOutlineChartBar,
      accent: "from-amber-500 to-orange-600",
    },
    {
      label: "Offers",
      value: stats?.offers ?? "—",
      icon: HiOutlineCheckCircle,
      accent: "from-emerald-500 to-teal-600",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? "—",
      icon: HiOutlineXCircle,
      accent: "from-rose-500 to-red-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Overview of your job search pipeline.
          </p>
        </div>
        <Link
          to="/add-job"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500"
        >
          Add application
          <HiArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const StatIcon = card.icon;
            return (
              <div
                key={card.label}
                className="glass relative overflow-hidden rounded-2xl p-6 shadow-sm"
              >
                <div
                  className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.accent} opacity-20 blur-2xl`}
                  aria-hidden
                />
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-lg`}
                >
                  <StatIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Quick actions
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" to="/jobs">
                View all jobs →
              </Link>
            </li>
            <li>
              <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" to="/resume">
                Analyze resume with AI →
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
