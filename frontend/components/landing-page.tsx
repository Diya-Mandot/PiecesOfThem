"use client";

import Link from "next/link";

const DAYS_TO_DEADLINE = Math.ceil(
  (new Date("2026-09-19").getTime() - Date.now()) / 86_400_000,
);

const STEPS = [
  {
    n: "01",
    title: "Collect",
    body: "Parent voice memos, forum posts, caregiver journals, and clinic notes are scraped and chunked into evidence fragments.",
    image: "https://picsum.photos/seed/step-collect/800/500",
    dot: "#C4704A",
  },
  {
    n: "02",
    title: "Analyze",
    body: "Each fragment is mapped to an FDA regulatory category — Expressive Language, Episodic Memory, Motor Function — with a confidence score.",
    image: "https://picsum.photos/seed/step-analyze/800/500",
    dot: "#9E6B6B",
  },
  {
    n: "03",
    title: "Package",
    body: "The evidence is assembled into a structured brief ready to hand to the FDA before the September 19th PDUFA deadline.",
    image: "https://picsum.photos/seed/step-package/800/500",
    dot: "#7A9E87",
  },
];

// Ambient background — simplified stability gap that draws itself in
function AmbientLine() {
  // Treated line: gentle upward hold
  const treated = "M -20 195 C 150 180, 320 162, 520 148 S 820 138, 1060 132 S 1300 128, 1460 126";
  // Natural decline: falls away
  const natural = "M -20 195 C 150 200, 320 210, 520 228 S 820 252, 1060 268 S 1300 278, 1460 285";

  return (
    <>
      <style>{`
        @keyframes drawTreated {
          from { stroke-dashoffset: 1600; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawNatural {
          from { stroke-dashoffset: 1600; }
          to   { stroke-dashoffset: 0; }
        }
        .ambient-treated { stroke-dasharray: 1600; animation: drawTreated 5s 0.4s cubic-bezier(.4,0,.2,1) forwards; stroke-dashoffset: 1600; }
        .ambient-natural { stroke-dasharray: 1600; animation: drawNatural 5s 0.8s cubic-bezier(.4,0,.2,1) forwards; stroke-dashoffset: 1600; }
      `}</style>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Gap fill between lines */}
        <path
          d={`${treated} L 1460 285 C 1300 278, 1060 268, 820 252 S 520 228, 320 210 S 150 200, -20 195 Z`}
          fill="rgba(122,158,135,0.04)"
        />
        {/* Natural decline — faint grey */}
        <path
          d={natural}
          fill="none"
          stroke="#C7B7A7"
          strokeWidth="1.2"
          opacity="0.35"
          className="ambient-natural"
        />
        {/* Treated — sage dashed */}
        <path
          d={treated}
          fill="none"
          stroke="#7A9E87"
          strokeWidth="1.8"
          strokeDasharray="10 7"
          opacity="0.3"
          className="ambient-treated"
        />
      </svg>
    </>
  );
}

export function LandingPage() {
  return (
    <main className="overflow-x-hidden" style={{
      background: "radial-gradient(ellipse at top, rgba(249,192,187,0.22) 0%, transparent 60%), linear-gradient(160deg, #FBF6F1 0%, #EDE3D4 100%)"
    }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-5 lg:px-16">
        <span className="font-display text-xl tracking-[-0.02em] text-slate">PiecesOfThem</span>
        <div className="flex items-center gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-slate/30 transition hover:text-slate/55 cursor-default">The Science</span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate/30 transition hover:text-slate/55 cursor-default">Regulatory Impact</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-8 py-20 text-center lg:px-16">
        <AmbientLine />

        <div className="relative z-10 flex flex-col items-center">
          {/* Urgency pill */}
          <div className="mb-10 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 shadow-sm"
            style={{ background: "#F9C0BB" }}>
            <div className="h-2 w-2 animate-pulse rounded-full bg-white/80" />
            <span className="text-sm font-semibold tracking-wide text-white">{DAYS_TO_DEADLINE} days to Sep 19, 2026</span>
          </div>

          {/* Headline */}
          <h1 className="font-display max-w-3xl text-6xl leading-[0.93] tracking-[-0.03em] text-slate lg:text-[7rem]">
            The stories<br />the FDA<br />isn&apos;t reading.
          </h1>

          {/* Subtext */}
          <p className="font-newsreader mx-auto mt-9 max-w-xl text-xl leading-8 text-slate/55" style={{ fontStyle: "italic" }}>
            We translate the fragments of a child&apos;s life into the clinical proof the FDA requires.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/case/demo-child-a"
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-slate px-8 py-4 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal">
              <svg
                className="h-3.5 w-3.5 shrink-0 translate-x-[-18px] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                viewBox="0 0 14 14" fill="none"
              >
                <path d="M2 2L6 1L12 5L13 11L8 13L2 9L2 2Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
                <circle cx="7.5" cy="6.5" r="1.5" fill="white" opacity="0.6" />
              </svg>
              <span className="transition-all duration-200 group-hover:-translate-x-0.5">Enter the Archive</span>
            </Link>
            <Link href="/report/demo-child-a"
              className="rounded-full border border-stone/40 bg-white/60 px-8 py-4 text-sm text-slate/60 transition hover:border-stone/60 hover:bg-white hover:text-slate">
              View Evidence Brief
            </Link>
          </div>

          {/* Divider */}
          <div className="mt-16 flex items-center gap-6">
            <div className="h-px w-16 bg-stone/30" />
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate/35">Sanfilippo MPS IIIA · UX111</p>
            <div className="h-px w-16 bg-stone/30" />
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ── */}
      <section className="relative overflow-hidden py-28">
        <img
          src="https://picsum.photos/seed/warmfamily/1400/600"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "blur(6px) saturate(0.7)", transform: "scale(1.06)" }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(251,246,241,0.93) 0%, rgba(243,216,210,0.88) 50%, rgba(251,246,241,0.93) 100%)"
        }} />
        <div className="relative mx-auto max-w-3xl px-8 text-center lg:px-14">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-slate/40">A piece, translated</p>
          <blockquote className="font-newsreader text-3xl leading-[1.3] text-slate lg:text-5xl" style={{ fontStyle: "italic" }}>
            &ldquo;He asked for his favourite song by name. We hadn&apos;t heard him speak in eight months.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-slate/45">— Caregiver transcript · August 2025 · Speech domain · Confidence 91%</p>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="px-8 pb-24 pt-20 lg:px-16">
        <div className="mb-12">
          <h2 className="font-display text-4xl text-slate">What we do with a story.</h2>
          <p className="font-newsreader mt-3 max-w-lg text-lg text-slate/55" style={{ fontStyle: "italic" }}>
            A parent posts in a forum at 2am. We turn that into evidence the FDA can act on.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map(step => (
            <div key={step.n} className="overflow-hidden rounded-[1.8rem] border border-stone/20 bg-white/70 shadow-card">
              <div className="relative h-52 overflow-hidden">
                <img src={step.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                <div className="absolute inset-0 opacity-20" style={{ background: step.dot }} />
                <span className="absolute left-5 top-5 font-display text-5xl font-bold text-white/80">{step.n}</span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl text-slate">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate/55">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative overflow-hidden px-8 pb-20 lg:px-16">
        <div className="relative overflow-hidden rounded-[2rem] px-10 py-16 text-center"
          style={{ background: "linear-gradient(135deg, #2C2930 0%, #38333C 100%)" }}>
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #F9C0BB, transparent)" }} />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #C4704A, transparent)" }} />

          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/40">The deadline is real</p>
          <h2 className="font-display mx-auto max-w-xl text-4xl text-white lg:text-5xl">
            {DAYS_TO_DEADLINE} days to make these stories count.
          </h2>
          <p className="font-newsreader mx-auto mt-5 max-w-md text-lg text-white/50" style={{ fontStyle: "italic" }}>
            UX111 wasn&apos;t rejected for safety. It was rejected for paperwork. Help us fix that.
          </p>
          <Link href="/case/demo-child-a"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-terracotta px-9 py-4 text-sm font-medium text-white shadow-sm transition hover:bg-oxidizedRose">
            <svg
              className="h-3.5 w-3.5 shrink-0 translate-x-[-18px] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
              viewBox="0 0 14 14" fill="none"
            >
              <path d="M2 2L6 1L12 5L13 11L8 13L2 9L2 2Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="7.5" cy="6.5" r="1.5" fill="white" opacity="0.6" />
            </svg>
            <span className="transition-all duration-200 group-hover:-translate-x-0.5">Enter the Archive</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="flex items-center justify-between border-t border-stone/20 px-8 py-6 lg:px-16">
        <p className="text-xs uppercase tracking-[0.22em] text-slate/30">
          Sanfilippo MPS IIIA · UX111 · FDA PDUFA Sep 19 2026
        </p>
        <p className="text-xs tracking-[0.12em] text-slate/20">
          Powered by Agentic RAG v2026.1
        </p>
      </footer>
    </main>
  );
}
