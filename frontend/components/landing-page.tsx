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

const SIGNAL_ORBS = [
  {
    label: "speech retention",
    style: {
      top: "14%",
      left: "8%",
      width: "140px",
      height: "140px",
      animationDelay: "0s",
      background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.92), rgba(249,192,187,0.44) 48%, rgba(249,192,187,0.12) 74%, transparent 100%)",
    },
  },
  {
    label: "citation lineage",
    style: {
      top: "22%",
      right: "11%",
      width: "190px",
      height: "190px",
      animationDelay: "1.4s",
      background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(196,112,74,0.3) 45%, rgba(196,112,74,0.08) 72%, transparent 100%)",
    },
  },
  {
    label: "caregiver recognition",
    style: {
      bottom: "16%",
      left: "12%",
      width: "168px",
      height: "168px",
      animationDelay: "0.8s",
      background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.88), rgba(158,107,107,0.26) 48%, rgba(158,107,107,0.08) 76%, transparent 100%)",
    },
  },
  {
    label: "",
    style: {
      top: "34%",
      left: "24%",
      width: "86px",
      height: "86px",
      animationDelay: "2s",
      background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.86), rgba(122,158,135,0.22) 42%, rgba(122,158,135,0.06) 70%, transparent 100%)",
    },
  },
  {
    label: "sleep stability",
    style: {
      bottom: "12%",
      right: "9%",
      width: "156px",
      height: "156px",
      animationDelay: "1.8s",
      background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(122,158,135,0.26) 48%, rgba(122,158,135,0.08) 76%, transparent 100%)",
    },
  },
];

function SignalOrbs() {
  return (
    <>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -14px, 0) scale(1.04); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.82; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {SIGNAL_ORBS.map((orb, index) => (
          <div
            key={`${orb.label}-${index}`}
            className="absolute rounded-full blur-[1px]"
            style={{
              ...orb.style,
              animation: `orbFloat ${11 + index * 1.2}s ease-in-out infinite, orbPulse ${7 + index}s ease-in-out infinite`,
            }}
          >
            <div className="absolute inset-0 rounded-full border border-white/35" />
            <div className="absolute inset-[16%] rounded-full border border-white/18" />
            {orb.label ? (
              <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
                <span className="text-[10px] uppercase tracking-[0.28em] text-slate/42">
                  {orb.label}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
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
        <SignalOrbs />

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
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #2C2930 0%, #38333C 100%)" }}>
        <div className="pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #F9C0BB, transparent)" }} />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #C4704A, transparent)" }} />

        <div className="relative mx-auto max-w-4xl px-8 py-24 lg:px-16 lg:py-32">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-px w-8 bg-petalPink/50" />
            <p className="text-[10px] uppercase tracking-[0.35em] text-petalPink/70">A piece, in their words</p>
          </div>

          <blockquote className="space-y-6">
            <p className="font-newsreader text-xl leading-[1.7] text-white/50 lg:text-2xl" style={{ fontStyle: "italic" }}>
              &ldquo;On the drive home he asked for his favorite song by name from the back seat, clearly and without anyone setting it up. We both went quiet because we had not heard a spontaneous song request in about eight months.
            </p>
            <p className="font-newsreader text-2xl leading-[1.45] text-white lg:text-[2.5rem]" style={{ fontStyle: "italic" }}>
              It was such a small sentence, but it felt enormous — because it meant the connection was still there: the song, the memory of it, and the language needed to ask for it.&rdquo;
            </p>
          </blockquote>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
            <p className="text-sm text-white/35">— Caregiver transcript · August 2025</p>
            <span className="rounded-full border border-petalPink/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-petalPink/60">
              Speech domain
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/25">
              Confidence 91%
            </span>
          </div>
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
