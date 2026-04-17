import Link from "next/link";

const DAYS_TO_DEADLINE = Math.ceil(
  (new Date("2026-09-19").getTime() - Date.now()) / 86_400_000,
);

export function LandingPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(249,192,187,0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(196,112,74,0.15) 0%, transparent 45%), linear-gradient(160deg, #FBF6F1 0%, #EDE3D4 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #F9C0BB 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #C4704A 0%, transparent 70%)" }}
      />

      <div className="relative max-w-2xl text-center">
        {/* Countdown */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/8 px-4 py-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
          <span className="text-xs font-medium text-terracotta">{DAYS_TO_DEADLINE} days to Sep 19, 2026</span>
        </div>

        <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.03em] text-slate sm:text-8xl">
          The stories the FDA isn&apos;t reading.
        </h1>

        <p className="mx-auto mt-8 max-w-lg text-base leading-8 text-slate/55">
          Thousands of proof points — parent voice memos, forum posts, TikToks — sit scattered
          across the internet. PiecesOfThem scrapes them, tags them, and turns them into a
          traceable evidence package before the deadline.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/case/demo-child-a"
            className="rounded-full bg-terracotta px-7 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-oxidizedRose"
          >
            Open Workbench
          </Link>
          <Link
            href="/report/demo-child-a"
            className="rounded-full border border-stone/50 bg-white/60 px-7 py-3.5 text-sm text-slate/70 transition hover:border-stone/70 hover:bg-white/80 hover:text-slate"
          >
            View Evidence Brief
          </Link>
        </div>
      </div>

      <p className="absolute bottom-8 text-xs uppercase tracking-[0.25em] text-slate/30">
        PiecesOfThem · Sanfilippo / UX111 · FDA-facing evidence assembly
      </p>
    </main>
  );
}
