"use client";

import { useMemo, useState } from "react";

import { formatDate, formatMonthYear, sentenceCase } from "@/lib/format";
import type { CaseBundle, Claim, EvidenceFragment, SignalDomain } from "@/lib/types";

const domains: Array<{ key: SignalDomain | "all"; label: string }> = [
  { key: "all", label: "All signals" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "recognition", label: "Recognition" },
  { key: "sleep", label: "Sleep" },
  { key: "behavior", label: "Behavior" },
  { key: "motor", label: "Motor" },
];

const years = ["all", "2024", "2025", "2026"] as const;

function claimTone(trend: Claim["trend"]) {
  switch (trend) {
    case "stable":
      return "border-pine/25 bg-pine/10 text-pine";
    case "improving":
      return "border-clay/20 bg-clay/10 text-rosewood";
    case "declining":
      return "border-rosewood/25 bg-rosewood/10 text-rosewood";
    default:
      return "border-stone/30 bg-ivory text-slate/70";
  }
}

function sourceTone(sourceType: EvidenceFragment["sourceType"]) {
  if (sourceType === "Clinic Summary") {
    return "bg-slate text-white";
  }

  if (sourceType === "Voice Memo" || sourceType === "Caregiver Transcript") {
    return "bg-blush/75 text-rosewood";
  }

  return "bg-ivory text-slate";
}

export function DashboardShell({ bundle }: { bundle: CaseBundle }) {
  const [activeClaimId, setActiveClaimId] = useState(bundle.claims[0]?.id ?? "");
  const [domain, setDomain] = useState<SignalDomain | "all">("all");
  const [year, setYear] = useState<(typeof years)[number]>("all");

  const filteredFragments = useMemo(() => {
    return bundle.fragments.filter((fragment) => {
      const matchesDomain =
        domain === "all" ||
        fragment.signalDomain === domain ||
        fragment.tags.includes(domain);
      const matchesYear = year === "all" || fragment.date.startsWith(year);
      return matchesDomain && matchesYear;
    });
  }, [bundle.fragments, domain, year]);

  const filteredClaims = useMemo(() => {
    return bundle.claims.filter((claim) => domain === "all" || claim.domain === domain);
  }, [bundle.claims, domain]);

  const activeClaim = filteredClaims.find((claim) => claim.id === activeClaimId) ?? filteredClaims[0];
  const highlightedIds = new Set(activeClaim?.fragmentIds ?? []);

  const metrics = [
    { label: "Fragments", value: String(bundle.fragments.length).padStart(2, "0") },
    { label: "Claims", value: String(bundle.claims.length).padStart(2, "0") },
    { label: "Window", value: "24 mo" },
    { label: "Sources", value: "05" },
  ];

  return (
    <main className="min-h-screen bg-parchment text-slate">
      <section className="border-b border-stone/35 bg-hero-glow">
        <div className="mx-auto max-w-[1680px] px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-rosewood/80">
                PiecesOfThem / Demo Case
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl tracking-[-0.03em] sm:text-5xl">
                  {bundle.caseRecord.label}
                </h1>
                <span className="rounded-full border border-stone/40 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rosewood">
                  Synthetic or de-identified
                </span>
              </div>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate/72">
                {bundle.caseRecord.summary}
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate/70">
              <div className="rounded-[1.4rem] border border-white/60 bg-white/70 px-5 py-4 shadow-whisper">
                <div className="text-xs uppercase tracking-[0.26em] text-rosewood/80">
                  Review context
                </div>
                <div className="mt-2 max-w-md leading-6">{bundle.caseRecord.reviewWindow}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.35rem] border border-white/60 bg-white/65 px-4 py-4 shadow-whisper"
              >
                <div className="text-xs uppercase tracking-[0.26em] text-rosewood/70">
                  {metric.label}
                </div>
                <div className="mt-3 font-display text-3xl">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-5 py-5 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {domains.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setDomain(option.key)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  domain === option.key
                    ? "bg-slate text-white"
                    : "border border-stone/40 bg-white/70 text-slate hover:border-rosewood/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setYear(option)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  year === option
                    ? "bg-rosewood text-white"
                    : "border border-stone/40 bg-white/70 text-slate hover:border-rosewood/30"
                }`}
              >
                {option === "all" ? "All years" : option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <aside className="rounded-[2rem] border border-stone/30 bg-white/70 p-5 shadow-paper">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">
                  Evidence fragments
                </p>
                <h2 className="mt-2 font-display text-3xl">Primary record</h2>
              </div>
              <div className="text-sm text-slate/50">{filteredFragments.length} shown</div>
            </div>
            <div className="space-y-3">
              {filteredFragments.map((fragment) => {
                const highlighted = highlightedIds.has(fragment.id);
                return (
                  <article
                    key={fragment.id}
                    className={`rounded-[1.4rem] border px-4 py-4 transition ${
                      highlighted
                        ? "border-rosewood/30 bg-blush/30 shadow-whisper"
                        : "border-stone/25 bg-parchment/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${sourceTone(
                          fragment.sourceType,
                        )}`}
                      >
                        {fragment.sourceType}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate/45">
                        {formatMonthYear(fragment.date)}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl leading-tight">{fragment.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate/72">{fragment.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {fragment.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-stone/35 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate/58"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate/45">
                      {fragment.id} / {fragment.rawRef}
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-stone/30 bg-white/70 p-6 shadow-paper">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">
                  Temporal track
                </p>
                <h2 className="mt-2 font-display text-3xl">Functional signal across time</h2>
              </div>
              <div className="max-w-xl text-sm leading-6 text-slate/64">
                The center lane is built for the live demo. Every claim on the right can illuminate
                the exact fragments it depends on.
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {["2024", "2025", "2026"].map((trackYear) => {
                const yearFragments = filteredFragments.filter((fragment) =>
                  fragment.date.startsWith(trackYear),
                );
                return (
                  <div
                    key={trackYear}
                    className="rounded-[1.7rem] border border-stone/25 bg-gradient-to-b from-white to-ivory/65 p-4"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="font-display text-3xl">{trackYear}</div>
                      <div className="text-xs uppercase tracking-[0.24em] text-slate/45">
                        {yearFragments.length} fragments
                      </div>
                    </div>
                    <div className="space-y-3">
                      {yearFragments.map((fragment, index) => (
                        <div key={fragment.id} className="relative pl-8">
                          <div className="absolute left-2 top-6 h-full w-px bg-stone/40 last:hidden" />
                          <div
                            className={`absolute left-0 top-2 h-4 w-4 rounded-full border ${
                              highlightedIds.has(fragment.id)
                                ? "border-rosewood bg-rosewood"
                                : "border-stone/50 bg-white"
                            }`}
                          />
                          <div
                            className={`rounded-[1.3rem] border px-4 py-4 ${
                              highlightedIds.has(fragment.id)
                                ? "border-rosewood/30 bg-blush/35"
                                : "border-stone/25 bg-white/80"
                            }`}
                          >
                            <div className="text-xs uppercase tracking-[0.18em] text-slate/45">
                              {formatDate(fragment.date)}
                            </div>
                            <h3 className="mt-2 font-display text-2xl leading-tight">
                              {fragment.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate/72">{fragment.excerpt}</p>
                            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-rosewood/75">
                              {sentenceCase(fragment.signalDomain)}
                            </div>
                          </div>
                          {index === yearFragments.length - 1 ? null : (
                            <div className="absolute left-[7px] top-[60px] h-[calc(100%-16px)] w-px bg-stone/40" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-stone/25 bg-slate px-5 py-4 text-white">
              <div className="text-xs uppercase tracking-[0.28em] text-blush/70">
                Data handling note
              </div>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-white/78">
                Demo records are synthetic or de-identified. In a production deployment, restricted
                data would require encryption at rest and in transit plus institutional storage
                controls aligned with the Utah data-classification model.
              </p>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-stone/30 bg-slate p-5 text-white shadow-paper">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.28em] text-blush/75">
                Regulatory summary
              </p>
              <h2 className="mt-2 font-display text-3xl">Cited claim set</h2>
            </div>
            <div className="space-y-3">
              {filteredClaims.map((claim) => (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => setActiveClaimId(claim.id)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    activeClaim?.id === claim.id
                      ? "border-white/45 bg-white/14"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${claimTone(
                        claim.trend,
                      )}`}
                    >
                      {claim.trend}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                      {claim.fragmentIds.length} citations
                    </span>
                  </div>
                  <div className="mt-3 font-display text-2xl leading-tight">{claim.statement}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/55">
                    {claim.id} / {sentenceCase(claim.domain)} / {claim.confidence} confidence
                  </div>
                </button>
              ))}
            </div>

            {activeClaim ? (
              <div className="mt-5 rounded-[1.5rem] border border-white/12 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.28em] text-blush/70">
                  Citation lineage
                </div>
                <div className="mt-4 space-y-3">
                  {bundle.fragments
                    .filter((fragment) => activeClaim.fragmentIds.includes(fragment.id))
                    .map((fragment) => (
                      <div
                        key={fragment.id}
                        className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                          {fragment.id} / {formatMonthYear(fragment.date)}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/82">{fragment.excerpt}</div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <section className="mt-5 rounded-[2rem] border border-stone/30 bg-white/70 p-5 shadow-paper">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">Lineage</p>
              <h2 className="mt-2 font-display text-3xl">Claim-to-fragment audit table</h2>
            </div>
            <div className="text-sm text-slate/50">Every visible claim stays source-linked.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.24em] text-slate/45">
                  <th className="px-4 pb-2">Fragment</th>
                  <th className="px-4 pb-2">Date</th>
                  <th className="px-4 pb-2">Domain</th>
                  <th className="px-4 pb-2">Source</th>
                  <th className="px-4 pb-2">Linked claims</th>
                </tr>
              </thead>
              <tbody>
                {filteredFragments.map((fragment) => {
                  const linkedClaims = bundle.claims.filter((claim) =>
                    claim.fragmentIds.includes(fragment.id),
                  );
                  return (
                    <tr key={fragment.id} className="rounded-[1rem] bg-white shadow-whisper">
                      <td className="rounded-l-2xl border-y border-l border-stone/20 px-4 py-4">
                        <div className="font-medium">{fragment.id}</div>
                        <div className="text-sm text-slate/55">{fragment.title}</div>
                      </td>
                      <td className="border-y border-stone/20 px-4 py-4 text-sm text-slate/70">
                        {formatDate(fragment.date)}
                      </td>
                      <td className="border-y border-stone/20 px-4 py-4 text-sm text-slate/70">
                        {sentenceCase(fragment.signalDomain)}
                      </td>
                      <td className="border-y border-stone/20 px-4 py-4 text-sm text-slate/70">
                        {fragment.sourceType}
                      </td>
                      <td className="rounded-r-2xl border-y border-r border-stone/20 px-4 py-4 text-sm text-slate/70">
                        {linkedClaims.map((claim) => claim.id).join(", ") || "Unlinked support"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
