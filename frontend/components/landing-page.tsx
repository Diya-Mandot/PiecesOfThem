import Link from "next/link";

const fragments = [
  {
    title: "Voice and transcript",
    body: "Short home recordings preserve everyday vocabulary that rarely surfaces in a clinic visit.",
  },
  {
    title: "Parent journal",
    body: "Micro-observations reveal recognition, routine, and functional persistence across months.",
  },
  {
    title: "Clinical summary",
    body: "Formal notes anchor caregiver evidence inside a reviewer-friendly frame of reference.",
  },
];

const flow = [
  "Ingest de-identified fragments from 2024 to 2026.",
  "Group them by functional signal and observation window.",
  "Assemble cited claims with exact fragment lineage.",
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-parchment text-slate">
      <section className="relative overflow-hidden border-b border-stone/40 bg-hero-glow">
        <div className="absolute inset-0 bg-paper-grain opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 sm:px-10 lg:px-12 lg:pb-28 lg:pt-10">
          <div className="mb-16 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-rosewood/80">
            <span>PiecesOfThem</span>
            <span>Regulatory Evidence Ledger</span>
          </div>
          <div className="grid gap-14 lg:grid-cols-[1.25fr_0.8fr] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-5 text-sm uppercase tracking-[0.28em] text-rosewood">
                Sanfilippo syndrome, lived-experience evidence, functional benefit
              </p>
              <h1 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.03em] text-slate sm:text-7xl">
                Collecting the fragments to save the whole.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate/72">
                PiecesOfThem assembles parent-reported micro-milestones into a cited evidence
                ledger, showing how cognition, recognition, and daily stability persist across
                time when a single clinic snapshot cannot capture the whole child.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/case/demo-child-a"
                  className="rounded-full bg-slate px-6 py-3 text-sm font-medium text-white transition hover:bg-rosewood"
                >
                  Open Demo Case
                </Link>
                <Link
                  href="/report/demo-child-a"
                  className="rounded-full border border-slate/15 bg-white/60 px-6 py-3 text-sm font-medium text-slate transition hover:border-rosewood/30 hover:bg-white"
                >
                  View Evidence Brief
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="grid gap-3 rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-paper backdrop-blur">
                {["2024", "2025", "2026"].map((year, index) => (
                  <div
                    key={year}
                    className={`rounded-[1.5rem] border border-stone/25 px-5 py-4 ${
                      index === 1 ? "bg-blush/35" : "bg-parchment/80"
                    }`}
                  >
                    <div className="mb-2 text-xs uppercase tracking-[0.28em] text-rosewood/80">
                      {year}
                    </div>
                    <div className="font-display text-xl text-slate">
                      {index === 0 && "Naming routines, family recognition"}
                      {index === 1 && "Retained bedtime lexicon, calmer overnight patterns"}
                      {index === 2 && "Stable noun count, preserved familiar voices"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -left-8 top-1/2 hidden h-px w-16 bg-gradient-to-r from-transparent to-rosewood/45 lg:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:px-10 lg:grid-cols-3 lg:px-12">
        {fragments.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-stone/30 bg-white/70 p-7 shadow-whisper"
          >
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-rosewood/80">
              Fragment type
            </p>
            <h2 className="font-display text-3xl text-slate">{item.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate/72">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-stone/35 bg-ivory/65">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rosewood/80">
              Assembly logic
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-slate">
              Not search. Assembly.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate/72">
              The demo focuses on one question the judges can understand immediately: can a lived
              experience ledger make functional stability legible, auditable, and reviewer-ready?
            </p>
          </div>
          <div className="grid gap-4">
            {flow.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-[1.5rem] border border-stone/25 bg-white/70 px-5 py-5 shadow-whisper"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone/40 text-sm text-rosewood">
                  0{index + 1}
                </div>
                <p className="pt-1 text-base leading-7 text-slate/80">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div className="grid gap-10 rounded-[2rem] border border-stone/30 bg-slate px-8 py-10 text-white shadow-paper lg:grid-cols-[1fr_0.9fr] lg:px-12">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-blush/70">
              Data handling
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight">
              Built to feel intimate. Structured to stay defensible.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-white/78">
            <p>
              Demo evidence is synthetic or de-identified. The prototype is for review support
              only and does not provide diagnosis, treatment guidance, or approval
              recommendations.
            </p>
            <p>
              Production handling of restricted data would require encryption in transit and at
              rest, plus formal storage and contract controls.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
