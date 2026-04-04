import { Link } from "react-router-dom";
import {
  HiArrowRight,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

function Home() {
  const token = localStorage.getItem("token");

  return (
    <div className="overflow-hidden">
      <section className="relative isolate">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.35),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200">
              <HiOutlineBolt className="h-4 w-4" />
              AI-powered job search workflow
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              Your applications,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                organized & analyzed
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Track every role, stage interviews, and upload your resume for ATS-style
              feedback—clear visuals, fast workflow, built for serious job seekers.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {token ? (
                <Link
                  to="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-500 sm:w-auto"
                >
                  Go to dashboard
                  <HiArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-500 sm:w-auto"
                  >
                    Get started free
                    <HiArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
            {[
              {
                icon: HiOutlineChartBar,
                title: "Pipeline clarity",
                text: "Dashboard stats for interviews, offers, and rejections at a glance.",
              },
              {
                icon: HiOutlineDocumentMagnifyingGlass,
                title: "Resume insights",
                text: "Upload a PDF and get structured ATS-style scoring and suggestions.",
              },
              {
                icon: HiOutlineShieldCheck,
                title: "Secure & simple",
                text: "JWT auth, clean API layer, and a UI tuned for light and dark modes.",
              },
            ].map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass rounded-2xl p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200">
                    <FeatureIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
