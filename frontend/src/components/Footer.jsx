import { HiOutlineHeart } from "react-icons/hi2";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:text-left">
        <p className="flex items-center gap-1">
          © {new Date().getFullYear()} JobTracker AI
          <HiOutlineHeart className="inline h-4 w-4 text-rose-500" aria-hidden />
        </p>
        <p className="text-slate-400 dark:text-slate-500">
          Track applications · ATS insights · Built with React & Node
        </p>
      </div>
    </footer>
  );
}

export default Footer;
