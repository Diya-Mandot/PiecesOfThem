"use client";

import { useEffect, useRef, useState } from "react";

import { RescueGapChart } from "@/components/rescue-gap-chart";
import { formatMonthYear, sentenceCase } from "@/lib/format";
import type { CaseBundle, EvidenceFragment, SignalDomain } from "@/lib/types";

// ── Domain config ─────────────────────────────────────────────────────────────
const DOMAIN_DOT: Record<SignalDomain, string> = {
  vocabulary:  "#C4704A",
  recognition: "#9E6B6B",
  sleep:       "#C7B7A7",
  behavior:    "#617368",
  motor:       "#C98972",
};

const DOMAIN_LABEL: Record<SignalDomain, string> = {
  vocabulary:  "Speech",
  recognition: "Memory",
  sleep:       "Sleep",
  behavior:    "Behavior",
  motor:       "Motor",
};

const FDA_CATEGORY: Record<SignalDomain, { category: string; metric: string }> = {
  vocabulary:  { category: "Expressive Language",   metric: "Long-term Semantic Memory" },
  recognition: { category: "Episodic Memory",        metric: "Social & Familial Recognition" },
  sleep:       { category: "Behavioral Regulation",  metric: "Sleep Architecture Stability" },
  behavior:    { category: "Adaptive Behavior",      metric: "Self-regulation & Routine" },
  motor:       { category: "Motor Function",         metric: "Fine Motor Coordination" },
};

// ── Source config ─────────────────────────────────────────────────────────────
const SOURCE_LABEL: Record<EvidenceFragment["sourceType"], string> = {
  "Parent Journal":       "Parent Journal",
  "Voice Memo":           "Voice Memo",
  "Clinic Summary":       "Clinic Note",
  "Forum Observation":    "Forum Post",
  "Caregiver Transcript": "Transcript",
};

const IS_AUDIO: Record<EvidenceFragment["sourceType"], boolean> = {
  "Voice Memo": true,
  "Caregiver Transcript": true,
  "Parent Journal": false,
  "Clinic Summary": false,
  "Forum Observation": false,
};

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ id }: { id: string }) {
  const BARS = 36;
  const heights = Array.from({ length: BARS }, (_, i) => {
    const a = id.charCodeAt(i % id.length) || 72;
    const b = id.charCodeAt((i * 3 + 2) % id.length) || 65;
    return 10 + ((a * 13 + b * 7 + i * 19) % 56);
  });
  return (
    <svg viewBox={`0 0 ${BARS * 9} 80`} preserveAspectRatio="none" className="h-full w-full">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 9 + 1.5}
          y={(80 - h) / 2}
          width={7}
          height={h}
          rx={3.5}
          fill="#F9C0BB"
          opacity={0.4 + (h / 66) * 0.55}
        />
      ))}
    </svg>
  );
}

// ── Source icon ───────────────────────────────────────────────────────────────
function SourceIcon({ type }: { type: EvidenceFragment["sourceType"] }) {
  if (type === "Voice Memo") return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="4.5" y="1.5" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 7.5C2 10.5 5 12 7 12C9 12 12 10.5 12 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (type === "Clinic Summary") return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="4" x2="7" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (type === "Forum Observation") return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5C2 1.9 2.4 1.5 3 1.5H11C11.6 1.5 12 1.9 12 2.5V8.5C12 9.1 11.6 9.5 11 9.5H8L6 12.5L4 9.5H3C2.4 9.5 2 9.1 2 8.5V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
  if (type === "Parent Journal") return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4.5" y1="4.5" x2="8.5" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.5" y1="9.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5C2 2.9 2.4 2.5 3 2.5H11C11.6 2.5 12 2.9 12 3.5V10.5C12 11.1 11.6 11.5 11 11.5H3C2.4 11.5 2 11.1 2 10.5V3.5Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ── Confidence score ──────────────────────────────────────────────────────────
function confidenceScore(frag: EvidenceFragment) {
  const base = frag.confidence === "high" ? 88 : 72;
  return base + (frag.id.charCodeAt(frag.id.length - 1) % 8);
}

// ── Hero quote ────────────────────────────────────────────────────────────────
function HeroQuote() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-petalPink/40" style={{
      background: "radial-gradient(ellipse at left, rgba(249,192,187,0.55) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(196,112,74,0.12) 0%, transparent 50%), linear-gradient(135deg, #FBF6F1 0%, #F0E0D6 100%)"
    }}>
      {/* Background image — evocative, low opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.07]"
        style={{ backgroundImage: "url(https://picsum.photos/seed/warmhome/1200/500)" }}
      />

      <div className="relative grid gap-8 px-8 py-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-rosewood/60">
            A piece, translated
          </p>
          <blockquote className="font-display text-4xl leading-[1.15] tracking-[-0.02em] text-slate sm:text-5xl">
            &ldquo;She recognized her grandmother immediately. Said her name before anyone prompted her.&rdquo;
          </blockquote>
          <p className="mt-5 text-sm text-slate/50">
            — Parent journal, January 2025 &nbsp;·&nbsp; Recognition domain &nbsp;·&nbsp; Confidence: 96%
          </p>
        </div>

        {/* Right stat cluster */}
        <div className="flex shrink-0 flex-col justify-center gap-4 lg:items-end">
          {[
            { label: "Pieces collected", value: "13" },
            { label: "Domains covered", value: "5" },
            { label: "Days to deadline", value: `${Math.ceil((new Date("2026-09-19").getTime() - Date.now()) / 86_400_000)}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-right">
              <p className="font-display text-4xl text-slate">{value}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate/40">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────
function PieceCard({
  fragment,
  highlighted,
  selected,
  onSelect,
}: {
  fragment: EvidenceFragment;
  highlighted: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const dot = DOMAIN_DOT[fragment.signalDomain];
  const audio = IS_AUDIO[fragment.sourceType];

  return (
    <button
      type="button"
      onClick={() => onSelect(fragment.id)}
      className={`group w-full overflow-hidden rounded-[1.5rem] border text-left transition-all duration-200 ${
        selected
          ? "border-sage/50 shadow-paper ring-2 ring-sage/25"
          : highlighted
            ? "border-sage/40 shadow-paper scale-[1.02]"
            : "border-stone/25 bg-white/80 shadow-card hover:border-stone/45 hover:bg-white hover:shadow-paper hover:scale-[1.01]"
      }`}
      style={{ background: selected || highlighted ? "white" : undefined }}
    >
      {/* Image / waveform header */}
      <div className="relative h-36 w-full overflow-hidden">
        {audio ? (
          // Voice memo: waveform on blush gradient
          <div className="flex h-full w-full items-center px-4" style={{
            background: "linear-gradient(135deg, #F9C0BB 0%, #F3D8D2 60%, #FBF6F1 100%)"
          }}>
            <Waveform id={fragment.id} />
          </div>
        ) : (
          // Text/clinic/forum: photo with gradient overlay
          <>
            <img
              src={`https://picsum.photos/seed/${fragment.id}/600/300`}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* gradient fade to white at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            {/* domain color tint overlay */}
            <div className="absolute inset-0 opacity-20" style={{ background: dot }} />
          </>
        )}

        {/* Date badge — top right */}
        <div className="absolute right-3 top-3 rounded-full border border-white/50 bg-white/80 px-2.5 py-1 text-[10px] text-slate/55 backdrop-blur-sm">
          {formatMonthYear(fragment.date)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-3">
        {/* Source row */}
        <div className="mb-2.5 flex items-center gap-1.5 text-slate/45">
          <SourceIcon type={fragment.sourceType} />
          <span className="text-[11px] uppercase tracking-[0.18em]">
            {SOURCE_LABEL[fragment.sourceType]}
          </span>
        </div>

        {/* Title */}
        <p className="font-display text-lg leading-snug text-slate">{fragment.title}</p>

        {/* Excerpt */}
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate/55">{fragment.excerpt}</p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em]"
            style={{ background: `${dot}18`, color: dot, border: `1px solid ${dot}35` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            {DOMAIN_LABEL[fragment.signalDomain]}
          </span>
          {fragment.confidence === "high" && (
            <span className="rounded-full border border-sage/30 bg-sage/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-sage">
              High confidence
            </span>
          )}
        </div>

        {/* Tap hint */}
        <p className={`mt-2.5 text-[11px] text-slate/35 transition-opacity duration-200 ${
          highlighted || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}>
          Click to see FDA translation →
        </p>
      </div>
    </button>
  );
}

// ── Evidence sidebar ──────────────────────────────────────────────────────────
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
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const fda = fragment ? FDA_CATEGORY[fragment.signalDomain] : null;
  const score = fragment ? confidenceScore(fragment) : 0;
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
        {/* Image or waveform header */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden">
          {audio ? (
            <div className="flex h-full w-full items-center px-6" style={{
              background: "linear-gradient(135deg, #F9C0BB 0%, #F3D8D2 70%, #FBF6F1 100%)"
            }}>
              {fragment && <Waveform id={fragment.id} />}
            </div>
          ) : (
            <>
              {fragment && (
                <img
                  src={`https://picsum.photos/seed/${fragment.id}/800/400`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-parchment via-parchment/30 to-transparent" />
            </>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate/50 shadow-sm backdrop-blur-sm transition hover:text-slate"
          >
            ✕
          </button>
        </div>

        {/* Header text */}
        <div className="border-b border-stone/20 px-6 pb-4 pt-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">
            {fragment ? SOURCE_LABEL[fragment.sourceType] : ""} · {fragment ? formatMonthYear(fragment.date) : ""}
          </p>
          <h2 className="mt-1.5 font-display text-2xl leading-snug text-slate">
            {fragment?.title}
          </h2>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

          {/* Human story */}
          <div className="rounded-[1.3rem] border border-stone/25 bg-white px-5 py-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate/40">Human Story</p>
            <p className="font-display text-xl leading-relaxed text-slate">
              &ldquo;{fragment?.excerpt}&rdquo;
            </p>
            <p className="mt-3 text-xs text-slate/35">{fragment?.rawRef}</p>
          </div>

          {/* Regulatory mapping */}
          <div className="rounded-[1.3rem] border border-stone/25 bg-white px-5 py-5">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-slate/40">Regulatory Mapping</p>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-slate/50">FDA Category</span>
                <span className="text-right text-sm font-medium text-slate">{fda?.category}</span>
              </div>
              <div className="h-px bg-stone/15" />
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-slate/50">Metric</span>
                <span className="text-right text-sm font-medium text-slate">{fda?.metric}</span>
              </div>
              <div className="h-px bg-stone/15" />
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

          {/* Audit trail */}
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
              <div className="h-px bg-stone/15" />
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-slate/50">Raw Source</span>
                <span className="text-right text-xs text-slate/55">{fragment?.rawRef}</span>
              </div>
              <div className="h-px bg-stone/15" />
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-slate/50">Fragment ID</span>
                <span className="font-mono text-xs text-slate/40">{fragment?.id}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pb-4">
            {fragment?.tags.map(tag => (
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

// ── Generate button ───────────────────────────────────────────────────────────
type GenState = "idle" | "generating" | "done";

function GenerateButton() {
  const [state, setState] = useState<GenState>("idle");

  function handleClick() {
    if (state !== "idle") return;
    setState("generating");
    setTimeout(() => setState("done"), 2400);
    setTimeout(() => setState("idle"), 5500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative min-w-[220px] overflow-hidden rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 ${
        state === "done"
          ? "bg-sage text-white"
          : state === "generating"
            ? "cursor-wait bg-terracotta/80 text-white"
            : "bg-terracotta text-white hover:bg-oxidizedRose"
      }`}
    >
      {/* idle */}
      <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${state === "idle" ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 10L5 7L2 4M7 10L10 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Generate Sept 19th Package
      </span>
      {/* generating */}
      <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${state === "generating" ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
        <svg width="13" height="13" viewBox="0 0 14 14" className="animate-spin">
          <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" strokeDasharray="10 6" />
        </svg>
        Assembling pieces…
      </span>
      {/* done */}
      <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${state === "done" ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
        ✦ Package Ready
      </span>
    </button>
  );
}

// ── Filter toggle ─────────────────────────────────────────────────────────────
type FilterMode = "all" | SignalDomain;

// ── Countdown ─────────────────────────────────────────────────────────────────
const DAYS_TO_DEADLINE = Math.ceil(
  (new Date("2026-09-19").getTime() - Date.now()) / 86_400_000,
);

// ── Main ──────────────────────────────────────────────────────────────────────
export function DashboardShell({ bundle }: { bundle: CaseBundle }) {
  const [hoveredChartId, setHoveredChartId] = useState<string | null>(null);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [filterMode, setFilterMode]         = useState<FilterMode>("all");

  const selectedFragment = selectedId
    ? bundle.fragments.find(f => f.id === selectedId) ?? null
    : null;

  function selectPiece(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  const filtered = bundle.fragments.filter(f =>
    filterMode === "all" || f.signalDomain === filterMode
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at top left, rgba(249,192,187,0.2) 0%, transparent 50%), linear-gradient(160deg, #FBF6F1 0%, #EDE3D4 100%)" }}
    >
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-20 border-b border-stone/20 px-6 py-3"
        style={{ background: "rgba(251,246,241,0.92)", backdropFilter: "blur(14px)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl tracking-[-0.02em] text-slate">PiecesOfThem</span>
            <span className="h-3.5 w-px bg-stone/40" />
            <span className="hidden text-xs uppercase tracking-[0.2em] text-slate/40 sm:block">Evidence Workbench</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1.5 sm:flex">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
              <span className="text-xs font-medium text-terracotta">{DAYS_TO_DEADLINE}d to Sep 19</span>
            </div>
            <GenerateButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-8 px-6 py-8">

        {/* ── A: Hero quote ── */}
        <HeroQuote />

        {/* ── How to use ── */}
        <div className="flex items-center gap-3 rounded-[1rem] border border-sage/25 bg-sage/8 px-4 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/20 text-xs text-sage font-medium">→</span>
          <p className="text-sm text-slate/60">
            <span className="font-medium text-slate">How to use:</span> Hover the chart to see which parent stories support each point. Click any piece card to open its FDA translation.
          </p>
        </div>

        {/* ── Chart ── */}
        <RescueGapChart
          fragments={bundle.fragments}
          hoveredId={hoveredChartId}
          onHover={setHoveredChartId}
          onSelect={selectPiece}
        />

        {/* ── Pieces ── */}
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-slate">The Pieces</h2>
              <p className="mt-0.5 text-sm text-slate/45">
                {filtered.length} scraped fragments — each one a point on the chart above
              </p>
            </div>
            {/* Domain filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {(["all", "vocabulary", "recognition", "sleep", "behavior", "motor"] as FilterMode[]).map(mode => {
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
                        ? "border-transparent text-white shadow-sm"
                        : "border-stone/35 bg-white/70 text-slate/55 hover:border-stone/55"
                    }`}
                    style={active ? { background: dot ?? "#2C2930" } : undefined}
                  >
                    {dot && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: active ? "white" : dot, opacity: active ? 0.8 : 1 }}
                      />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* B: Photo card grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(fragment => (
              <PieceCard
                key={fragment.id}
                fragment={fragment}
                highlighted={hoveredChartId === fragment.id}
                selected={selectedId === fragment.id}
                onSelect={selectPiece}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ── Sidebar ── */}
      <EvidenceSidebar
        fragment={selectedFragment}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
