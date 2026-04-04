import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineMoon,
  HiOutlinePlusCircle,
  HiOutlineSun,
} from "react-icons/hi2";
import { useTheme } from "../hooks/useTheme.js";

const linkBase =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

const linkActive =
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200";

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) user = JSON.parse(raw);
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `${linkBase} ${isActive ? linkActive : ""}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <HiOutlineBriefcase className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">JobTracker AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navClass}>
            <HiOutlineHome className="h-4 w-4" />
            Home
          </NavLink>
          {token && (
            <>
              <NavLink to="/dashboard" className={navClass}>
                <HiOutlineChartBar className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink to="/jobs" className={navClass}>
                <HiOutlineBriefcase className="h-4 w-4" />
                Jobs
              </NavLink>
              <NavLink to="/add-job" className={navClass}>
                <HiOutlinePlusCircle className="h-4 w-4" />
                Add Job
              </NavLink>
              <NavLink to="/resume" className={navClass}>
                <HiOutlineDocumentText className="h-4 w-4" />
                Resume AI
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {token && user?.name && (
            <span className="hidden max-w-[140px] truncate text-sm text-slate-500 dark:text-slate-400 lg:inline">
              Hi, {user.name}
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <HiOutlineSun className="h-5 w-5" />
            ) : (
              <HiOutlineMoon className="h-5 w-5" />
            )}
          </button>
          {!token ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {token && (
        <div className="flex flex-wrap gap-1 border-t border-slate-100 px-2 py-2 md:hidden dark:border-slate-800">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/jobs" className={navClass}>
            Jobs
          </NavLink>
          <NavLink to="/add-job" className={navClass}>
            Add
          </NavLink>
          <NavLink to="/resume" className={navClass}>
            Resume
          </NavLink>
        </div>
      )}
    </header>
  );
}

export default Navbar;
