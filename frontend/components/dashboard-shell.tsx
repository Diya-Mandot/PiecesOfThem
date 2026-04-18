"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GetTrajectoryResponse } from "@shared/api";
import type { CaseBundle, EvidenceFragment, ReportReadiness, SignalDomain } from "@shared/types";

import { RescueGapChart } from "@/components/rescue-gap-chart";
import { formatMonthYear } from "@/lib/format";

const DOMAIN_DOT: Record<SignalDomain, string> = {
  vocabulary: "#C4704A",
  recognition: "#9E6B6B",
  sleep: "#C7B7A7",
  behavior: "#617368",
  motor: "#C98972",
};

const DOMAIN_LABEL: Record<SignalDomain, string> = {
  vocabulary: "Speech",
  recognition: "Memory",
  sleep: "Sleep",
  behavior: "Behavior",
  motor: "Motor",
};

const FDA_CATEGORY: Record<SignalDomain, { category: string; metric: string }> = {
  vocabulary: { category: "Expressive Language", metric: "Long-term Semantic Memory" },
  recognition: { category: "Episodic Memory", metric: "Social & Familial Recognition" },
  sleep: { category: "Behavioral Regulation", metric: "Sleep Architecture Stability" },
  behavior: { category: "Adaptive Behavior", metric: "Self-regulation & Routine" },
  motor: { category: "Motor Function", metric: "Fine Motor Coordination" },
};

const SOURCE_LABEL: Record<EvidenceFragment["sourceType"], string> = {
  "Parent Journal": "Parent Journal",
  "Voice Memo": "Voice Memo",
  "Clinic Summary": "Clinic Note",
  "Forum Observation": "Forum Post",
  "Caregiver Transcript": "Transcript",
};

const IS_AUDIO: Record<EvidenceFragment["sourceType"], boolean> = {
  "Voice Memo": true,
  "Caregiver Transcript": true,
  "Parent Journal": false,
  "Clinic Summary": false,
  "Forum Observation": false,
};

type FilterMode = "all" | SignalDomain;

const DAYS_TO_DEADLINE = Math.ceil(
  (new Date("2026-09-19").getTime() - Date.now()) / 86_400_000,
);

export function DashboardShell({
  bundle,
  trajectory,
}: {
  bundle: CaseBundle;
  trajectory: GetTrajectoryResponse;
}) {
  const [hoveredChartId, setHoveredChartId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rankedIds, setRankedIds] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);

  const selectedFragment = selectedId
    ? bundle.fragments.find((fragment) => fragment.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setRankedIds(null);
      setSearching(false);
      return;
    }

    setSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            fragments: bundle.fragments.map((fragment) => ({
              id: fragment.id,
              title: fragment.title,
              excerpt: fragment.excerpt,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = (await response.json()) as {
          ranked: { id: string; score: number }[];
        };

        setRankedIds(data.ranked.map((item) => item.id));
      } catch {
        setRankedIds(null);
      } finally {
        setSearching(false);
      }
    }, 420);

    return () => window.clearTimeout(timer);
  }, [searchQuery, bundle.fragments]);

  const domainFiltered = useMemo(
    () =>
      bundle.fragments.filter(
        (fragment) => filterMode === "all" || fragment.signalDomain === filterMode,
      ),
    [bundle.fragments, filterMode],
  );

  const filtered = useMemo(() => {
    const base = (() => {
      if (!rankedIds) return domainFiltered;
      const byId = new Map(domainFiltered.map((fragment) => [fragment.id, fragment]));
      return rankedIds
        .map((id) => byId.get(id))
        .filter((fragment): fragment is EvidenceFragment => Boolean(fragment));
    })();

    // Real fragments sort ahead of any non-production test data.
    return [...base].sort((a, b) => {
      const aReal = a.provenance === "real" ? 0 : 1;
      const bReal = b.provenance === "real" ? 0 : 1;
      return aReal - bReal;
    });
  }, [domainFiltered, rankedIds]);

  const activeSearch = searchQuery.trim();
  const activeDomainLabel = filterMode === "all" ? "All domains" : DOMAIN_LABEL[filterMode];
  const searchMode = activeSearch.length > 0;
  const reportReadiness = bundle.caseRecord.reportReadiness;

  function selectPiece(id: string) {
    setSelectedId((previous) => (previous === id ? null : id));
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(249,192,187,0.2) 0%, transparent 50%), linear-gradient(160deg, #FBF6F1 0%, #EDE3D4 100%)",
      }}
    >
      <header
        className="sticky top-0 z-20 border-b border-stone/15 px-6 py-3"
        style={{ background: "rgba(251,246,241,0.75)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-xl tracking-[-0.02em] text-slate transition hover:text-terracotta"
            >
              PiecesOfThem
            </Link>
            <span className="h-3.5 w-px bg-stone/40" />
            <span className="hidden text-xs uppercase tracking-[0.2em] text-slate/40 sm:block">
              Evidence Workbench
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Petal pink urgency pill */}
            <div className="relative hidden sm:flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: "rgba(249,192,187,0.25)", border: "1px solid rgba(249,192,187,0.5)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petalPink opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-petalPink" />
              </span>
              <span className="text-xs font-semibold" style={{ color: "#C4704A" }}>{DAYS_TO_DEADLINE}d to Sep 19</span>
            </div>
            <Link href="/" className="rounded-full border border-stone/30 bg-white/75 px-4 py-2 text-sm font-medium text-slate transition hover:border-stone/50 hover:bg-white">
              Home
            </Link>
            <GenerateButton readiness={reportReadiness} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8 space-y-8">
        <HeroQuote
          fragment={pickHeroFragment(bundle.fragments)}
          count={bundle.fragments.length}
          claimCount={bundle.claims.length}
        />

        <RescueGapChart
          fragments={bundle.fragments}
          trajectory={trajectory}
          hoveredId={hoveredChartId}
          onHover={setHoveredChartId}
          onSelect={selectPiece}
        />

        <section className="rounded-[2rem] border border-stone/20 bg-white/45 p-5 shadow-whisper backdrop-blur-[2px] sm:p-6 mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-slate">The Pieces</h2>
              <p className="mt-0.5 text-sm text-slate/45">
                {searchMode
                  ? `${filtered.length} fragments ranked semantically for "${activeSearch}"`
                  : `${filtered.length} structured fragments projected from the ingestion pipeline`}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2.5 sm:items-end">
              <div className="relative w-full sm:w-[320px]">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate/35"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
                  <line
                    x1="9.5"
                    y1="9.5"
                    x2="12.5"
                    y2="12.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Semantic search the evidence"
                  className="w-full rounded-full border border-stone/30 bg-white/90 py-2.5 pl-9 pr-10 text-sm text-slate shadow-sm placeholder:text-slate/35 focus:border-sage/50 focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
                {searching ? (
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate/30"
                    width="13"
                    height="13"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="10 6"
                    />
                  </svg>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/35 transition hover:text-slate/70"
                    aria-label="Clear semantic search"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(["all", "vocabulary", "recognition", "sleep", "behavior", "motor"] as FilterMode[]).map(
                  (mode) => {
                    const dot = mode !== "all" ? DOMAIN_DOT[mode as SignalDomain] : undefined;
                    const label = mode === "all" ? "All" : DOMAIN_LABEL[mode as SignalDomain];
                    const active = filterMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFilterMode(mode)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? "border-petalPink/60 text-white shadow-sm"
                            : "border-stone/30 bg-white/60 text-slate/50 hover:border-stone/50 hover:bg-white"
                        }`}
                        style={active ? { background: dot ? dot : "#F9C0BB" } : undefined}
                      >
                        {dot ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: active ? "white" : dot,
                              opacity: active ? 0.8 : 1,
                            }}
                          />
                        ) : null}
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <StatusChip label={activeDomainLabel} tone="neutral" />
            {searchMode ? (
              <StatusChip
                label={searching ? "Ranking semantically..." : `Semantic mode: ${activeSearch}`}
                tone="accent"
              />
            ) : (
              <StatusChip label="Chronological browse mode" tone="neutral" />
            )}
            {!searching && filtered[0] && searchMode ? (
              <StatusChip label={`Top match: ${filtered[0].title}`} tone="soft" />
            ) : null}
            <StatusChip label={readinessLabel(reportReadiness)} tone={readinessTone(reportReadiness)} />
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((fragment, index) => (
                <PieceCard
                  key={fragment.id}
                  fragment={fragment}
                  highlighted={hoveredChartId === fragment.id}
                  selected={selectedId === fragment.id}
                  rankLabel={searchMode ? `#${index + 1}` : null}
                  onSelect={selectPiece}
                />
              ))}
            </div>
          ) : (
            <EmptyPiecesState
              searchMode={searchMode}
              query={activeSearch}
              onResetSearch={() => setSearchQuery("")}
              onResetFilter={() => setFilterMode("all")}
            />
          )}
        </section>
      </main>

      {/* Model card footer */}
      <footer className="mx-auto max-w-[1200px] px-6 py-8 flex justify-center">
        <a href="#" className="flex items-center gap-2 rounded-full border border-stone/25 bg-white/60 px-5 py-2.5 text-xs text-slate/45 transition hover:border-stone/40 hover:text-slate/65 backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <line x1="4" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          View Model Card & Audit Trace
        </a>
      </footer>

      <EvidenceSidebar fragment={selectedFragment} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function HeroQuote({
  fragment,
  count,
  claimCount,
}: {
  fragment: EvidenceFragment | undefined;
  count: number;
  claimCount: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[2rem]"
      style={{ background: "linear-gradient(135deg, #F3D8D2 0%, #FBF6F1 45%, #EDE3D4 100%)" }}
    >
      {/* Large decorative quote mark */}
      <div
        className="pointer-events-none absolute -left-4 -top-6 font-newsreader text-[18rem] leading-none text-terracotta/10 select-none"
        aria-hidden="true"
        style={{ fontStyle: "italic" }}
      >&ldquo;</div>
      {/* Soft blush blob */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(249,192,187,0.6), transparent)" }} />

      <div className="relative px-8 py-10 lg:px-10">
        {/* Label + evidence ID */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-terracotta/40" />
            <p className="text-[10px] uppercase tracking-[0.35em] text-terracotta/60">A piece, in their words</p>
          </div>
          <span className="font-mono text-[10px] text-slate/25">#FRAG-882</span>
        </div>

        {/* Quote */}
        <blockquote className="font-newsreader text-3xl leading-[1.5] text-slate lg:text-4xl" style={{ fontStyle: "italic" }}>
          He still knows our dog&apos;s name. He still knows mine. Some days that feels like the whole world.
        </blockquote>

        {/* Attribution */}
        <p className="mt-5 text-sm text-slate/40">
          Parent journal · March 2025 · Memory domain
        </p>

        {/* Chips */}
        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-stone/20 pt-6">
          {[
            { label: `${count} pieces` },
            { label: `${claimCount} claims` },
            { label: `${DAYS_TO_DEADLINE}d to Sep 19`, accent: true },
          ].map(({ label, accent }) => (
            <span key={label} className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
              accent
                ? "border-terracotta/30 bg-terracotta/8 text-terracotta"
                : "border-stone/30 bg-white/60 text-slate/50"
            }`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PieceCard({
  fragment,
  highlighted,
  selected,
  rankLabel,
  onSelect,
}: {
  fragment: EvidenceFragment;
  highlighted: boolean;
  selected: boolean;
  rankLabel: string | null;
  onSelect: (id: string) => void;
}) {
  const dot = DOMAIN_DOT[fragment.signalDomain];
  const audio = IS_AUDIO[fragment.sourceType];

  return (
    <button
      type="button"
      onClick={() => onSelect(fragment.id)}
      className={`group w-full overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 ${
        selected
          ? "border-sage/50 shadow-paper ring-2 ring-sage/25 -translate-y-1"
          : highlighted
            ? "border-sage/40 shadow-paper -translate-y-1"
            : "border-stone/25 bg-white/80 shadow-whisper hover:border-stone/40 hover:bg-white hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgba(44,41,48,0.10)]"
      }`}
    >
      <div className="relative h-36 w-full overflow-hidden">
        {audio ? (
          <div
            className="flex h-full w-full items-center px-4"
            style={{ background: "linear-gradient(135deg, #F9C0BB 0%, #F3D8D2 60%, #FBF6F1 100%)" }}
          >
            <Waveform id={fragment.id} />
          </div>
        ) : fragment.sourceType === "Parent Journal" ? (
          // Journal — paper texture feel
          <div className="flex h-full w-full items-end p-4"
            style={{ background: `linear-gradient(145deg, #FBF6F1 0%, #EDE3D4 60%, ${dot}22 100%)` }}>
            <p className="font-newsreader text-sm leading-6 text-slate/40 line-clamp-3" style={{ fontStyle: "italic" }}>
              &ldquo;{fragment.excerpt}&rdquo;
            </p>
          </div>
        ) : (
          <>
            <img
              src={`https://picsum.photos/seed/${fragment.id}/600/300`}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            <div className="absolute inset-0 opacity-20" style={{ background: dot }} />
          </>
        )}

        <div className="absolute right-3 top-3 rounded-full border border-white/50 bg-white/80 px-2.5 py-1 text-[10px] text-slate/55 backdrop-blur-sm">
          {formatMonthYear(fragment.date)}
        </div>
        <div className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/70 px-2 py-0.5 font-mono text-[9px] text-slate/35 backdrop-blur-sm">
          REF-{fragment.id.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8)}
        </div>
        {rankLabel ? (
          <div className="absolute bottom-3 left-3 rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate/60 backdrop-blur-sm">
            {rankLabel}
          </div>
        ) : null}
      </div>

      <div className="p-4 pt-3">
        <div className="mb-2.5 flex items-center gap-1.5 text-slate/45">
          <SourceIcon type={fragment.sourceType} />
          <span className="text-[11px] uppercase tracking-[0.18em]">{SOURCE_LABEL[fragment.sourceType]}</span>
        </div>
        <p className="font-display text-lg leading-snug text-slate">{fragment.title}</p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate/55">{fragment.excerpt}</p>
        <p className="mt-1.5 text-[10px] text-slate/30 uppercase tracking-[0.14em]">
          Mapped to {fragment.signalDomain === "vocabulary" ? "Semantic Memory" : fragment.signalDomain === "recognition" ? "Episodic Memory" : fragment.signalDomain === "sleep" ? "Sleep Architecture" : fragment.signalDomain === "behavior" ? "Adaptive Behavior" : "Motor Function"} via Agentic Critic
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em]"
            style={{ background: `${dot}18`, color: dot, border: `1px solid ${dot}35` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            {DOMAIN_LABEL[fragment.signalDomain]}
          </span>
          {fragment.confidence === "high" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sage/25 px-2.5 py-1 text-[11px] tracking-[0.08em] text-sage/80">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5L4 7.5L8 3" stroke="#7A9E87" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Verified
            </span>
          ) : null}
          {fragment.provenance === "real" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C4704A]/30 bg-[#C4704A]/6 px-2.5 py-1 text-[11px] tracking-[0.08em] text-[#C4704A]/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C4704A]/70" />
              Real
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-stone/20 px-2.5 py-1 text-[11px] tracking-[0.08em] text-slate/30">
              <span className="h-1.5 w-1.5 rounded-full bg-slate/20" />
              Test
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "accent" | "soft" | "warning";
}) {
  const className =
    tone === "accent"
      ? "border-terracotta/25 bg-terracotta/10 text-terracotta"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
      : tone === "soft"
        ? "border-petalPink/35 bg-petalPink/12 text-rosewood/70"
        : "border-stone/25 bg-white/70 text-slate/55";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${className}`}
    >
      {label}
    </span>
  );
}

function pickHeroFragment(fragments: EvidenceFragment[]) {
  const preferred = fragments.find((fragment) => fragment.id === "FRG-2025-188");
  if (preferred) {
    return preferred;
  }

  return (
    fragments.find(
      (fragment) =>
        fragment.confidence === "high" &&
        (fragment.signalDomain === "vocabulary" || fragment.signalDomain === "recognition"),
    ) ?? fragments[0]
  );
}

function EmptyPiecesState({
  searchMode,
  query,
  onResetSearch,
  onResetFilter,
}: {
  searchMode: boolean;
  query: string;
  onResetSearch: () => void;
  onResetFilter: () => void;
}) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-stone/30 bg-parchment/70 px-6 py-10 text-center">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate/40">No projected fragments</p>
      <h3 className="mt-2 font-display text-2xl text-slate">
        {searchMode ? "No evidence matched that query" : "No fragments for this filter"}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate/55">
        {searchMode
          ? `The current dataset did not yield semantic matches for "${query}" inside the active domain filter.`
          : "The current domain filter does not have surfaced fragments yet. Reset the filter to review the full evidence pool."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {searchMode ? (
          <button
            type="button"
            onClick={onResetSearch}
            className="rounded-full border border-stone/30 bg-white px-4 py-2 text-sm text-slate transition hover:border-stone/50"
          >
            Clear search
          </button>
        ) : null}
        <button
          type="button"
          onClick={onResetFilter}
          className="rounded-full bg-terracotta px-4 py-2 text-sm text-white transition hover:bg-oxidizedRose"
        >
          Show all domains
        </button>
      </div>
    </div>
  );
}

function EvidenceSidebar({
  fragment,
  onClose,
}: {
  fragment: EvidenceFragment | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = !!fragment;

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handler);
    }

    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const fda = fragment ? FDA_CATEGORY[fragment.signalDomain] : null;
  const score = fragment ? (fragment.confidence === "high" ? 94 : 81) : 0;
  const dot = fragment ? DOMAIN_DOT[fragment.signalDomain] : "#C7B7A7";
  const audio = fragment ? IS_AUDIO[fragment.sourceType] : false;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        ref={ref}
        className={`fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-stone/30 bg-parchment shadow-paper transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative h-44 w-full shrink-0 overflow-hidden">
          {audio ? (
            <div
              className="flex h-full w-full items-center px-6"
              style={{ background: "linear-gradient(135deg, #F9C0BB 0%, #F3D8D2 70%, #FBF6F1 100%)" }}
            >
              {fragment ? <Waveform id={fragment.id} /> : null}
            </div>
          ) : (
            <>
              {fragment ? (
                <img
                  src={`https://picsum.photos/seed/${fragment.id}/800/400`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/30 to-transparent" />
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate/50 shadow-sm backdrop-blur-sm transition hover:text-slate"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-stone/20 px-6 pb-4 pt-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">
            {fragment ? `${SOURCE_LABEL[fragment.sourceType]} · ${formatMonthYear(fragment.date)}` : ""}
          </p>
          <h2 className="mt-1.5 font-display text-2xl leading-snug text-slate">{fragment?.title}</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-[1.3rem] border border-stone/25 bg-white px-5 py-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate/40">Human Story</p>
            <p className="whitespace-pre-wrap break-words font-display text-xl leading-relaxed text-slate">
              &ldquo;{fragment?.excerpt}&rdquo;
            </p>
            <p className="mt-3 text-xs text-slate/35">{fragment?.rawRef}</p>
          </div>

          <div className="rounded-[1.3rem] border border-stone/25 bg-white px-5 py-5">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-slate/40">Regulatory Mapping</p>
            <div className="space-y-3">
              <SidebarRow label="FDA Category" value={fda?.category ?? ""} />
              <SidebarRow label="Metric" value={fda?.metric ?? ""} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate/50">Status</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: `${dot}18`, color: dot, border: `1px solid ${dot}40` }}
                >
                  {fragment?.confidence === "high" ? "Retained" : "Stable with variance"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.3rem] border border-stone/25 bg-white px-5 py-5">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-slate/40">Audit Trail</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate/50">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-stone/20">
                    <div className="h-full rounded-full bg-sage" style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate">{score}%</span>
                </div>
              </div>
              <SidebarRow label="Raw Source" value={fragment?.rawRef ?? ""} />
              <SidebarRow label="Fragment ID" value={fragment?.id ?? ""} mono />
              <SidebarRow label="Provenance" value={fragment ? sentenceCase(fragment.provenance) : ""} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-4">
            {fragment?.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone/30 bg-white px-3 py-1 text-[11px] text-slate/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function GenerateButton({ readiness }: { readiness: ReportReadiness }) {
  const isReviewReady = readiness === "review-ready";

  return (
    <Link
      href="/report/all-evidence?print=1"
      className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full bg-slate px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d="M2 10L5 7L2 4M7 10L10 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {isReviewReady ? "Generate Sept 19th Package" : "Open Labeled Evidence Brief"}
    </Link>
  );
}

function readinessLabel(readiness: ReportReadiness) {
  if (readiness === "review-ready") {
    return "Review-ready evidence";
  }

  if (readiness === "internal-review") {
    return "Mixed evidence: internal review only";
  }

  return "Demo-only evidence";
}

function readinessTone(readiness: ReportReadiness): "accent" | "warning" | "soft" {
  if (readiness === "review-ready") {
    return "accent";
  }

  if (readiness === "internal-review") {
    return "warning";
  }

  return "soft";
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Waveform({ id }: { id: string }) {
  const bars = 36;
  const heights = Array.from({ length: bars }, (_, index) => {
    const a = id.charCodeAt(index % id.length) || 72;
    const b = id.charCodeAt((index * 3 + 2) % id.length) || 65;
    return 10 + ((a * 13 + b * 7 + index * 19) % 56);
  });

  return (
    <svg viewBox={`0 0 ${bars * 9} 80`} preserveAspectRatio="none" className="h-full w-full">
      {heights.map((height, index) => (
        <rect
          key={index}
          x={index * 9 + 1.5}
          y={(80 - height) / 2}
          width={7}
          height={height}
          rx={3.5}
          fill="#F9C0BB"
          opacity={0.4 + (height / 66) * 0.55}
        />
      ))}
    </svg>
  );
}

function SidebarRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs text-slate/50">{label}</span>
        <span className={`text-right text-sm text-slate ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
      </div>
      <div className="h-px bg-stone/15" />
    </>
  );
}

function SourceIcon({ type }: { type: EvidenceFragment["sourceType"] }) {
  if (type === "Voice Memo") {
    return (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <rect x="4.5" y="1.5" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M2 7.5C2 10.5 5 12 7 12C9 12 12 10.5 12 7.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "Clinic Summary") {
    return (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <line x1="7" y1="4" x2="7" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 3.5C2 2.9 2.4 2.5 3 2.5H11C11.6 2.5 12 2.9 12 3.5V10.5C12 11.1 11.6 11.5 11 11.5H3C2.4 11.5 2 11.1 2 10.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}
