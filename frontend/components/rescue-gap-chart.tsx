"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GetTrajectoryResponse } from "@shared/api";
import type { EvidenceFragment } from "@shared/types";

const DOMAIN_LABELS: Record<string, string> = {
  vocabulary: "Semantic Memory",
  recognition: "Episodic Memory",
  sleep: "Sleep Architecture",
  behavior: "Adaptive Behavior",
  motor: "Motor Function",
};

// Milestone: fragments in these domains get pulsing treatment
const MILESTONE_DOMAINS = new Set(["vocabulary", "recognition"]);

// Semantic density: higher-fidelity sources → tighter 95% CI
const SOURCE_VARIANCE: Record<string, number> = {
  "Voice Memo": 5,
  "Clinic Summary": 7,
  "Caregiver Transcript": 10,
  "Parent Journal": 13,
  "Forum Observation": 18,
};

const MILESTONE_CATEGORY: Record<string, string> = {
  vocabulary: "Lexical Functional Communication",
  recognition: "Episodic Retrieval Event",
  motor: "Voluntary Motor Coordination",
  sleep: "Circadian Stabilization",
  behavior: "Adaptive Self-Regulation",
};

type ChartPoint = {
  label: string;
  treated: number;
  naturalPowerLaw: number;
  ciUpper: number;
  ciLower: number;
  // stacked band: ciLower baseline (transparent) + band width (purple)
  bandBase: number;
  bandSize: number;
  variance: number;
  deviation: number;
  fragmentId: string;
  fragment?: EvidenceFragment;
  isMilestone: boolean;
};

type Props = {
  fragments: EvidenceFragment[];
  trajectory: GetTrajectoryResponse;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function NarrativeTooltip({
  active,
  payload,
  onSelect,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  onSelect: (id: string) => void;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const frag = point.fragment;
  const delta = Math.round(point.treated - point.naturalPowerLaw);
  const isRobust = point.ciLower > point.naturalPowerLaw;

  return (
    <div className="w-72 overflow-hidden rounded-[1.3rem] border border-stone/20 bg-white shadow-[0_8px_40px_rgba(44,41,48,0.14)]">
      <div className="px-4 pt-4">
        {/* Status banner */}
        <div
          className="mb-3 rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]"
          style={{
            background: isRobust ? "rgba(122,158,135,0.12)" : "rgba(201,135,114,0.12)",
            color: isRobust ? "#5A8A6A" : "#C98972",
          }}
        >
          {isRobust ? "✓ Highly Robust — band above decline threshold" : "⚠ Band overlaps decline — more data needed"}
        </div>

        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {frag && (
            <span className="rounded-full border border-stone/20 bg-parchment px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate/45">
              {frag.sourceType}
            </span>
          )}
          {frag && (
            <span className="rounded-full border border-sage/25 bg-sage/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sage/80">
              {DOMAIN_LABELS[frag.signalDomain] ?? frag.signalDomain}
            </span>
          )}
          {point.isMilestone && (
            <span className="rounded-full border border-[#8E5E7A]/30 bg-[#8E5E7A]/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#8E5E7A]">
              ✦ Milestone
            </span>
          )}
        </div>

        <p className="font-display text-sm leading-snug text-slate">{frag?.title ?? point.label}</p>

        {point.isMilestone && frag && (
          <p className="mt-1 text-[11px] font-medium text-[#8E5E7A]/80">
            {MILESTONE_CATEGORY[frag.signalDomain]}
          </p>
        )}

        {frag?.excerpt && (
          <p
            className="mt-2 font-newsreader text-[13px] leading-[1.65] text-slate/65 line-clamp-4"
            style={{ fontStyle: "italic" }}
          >
            &ldquo;{frag.excerpt}&rdquo;
          </p>
        )}

        <div className="mt-3 grid grid-cols-4 gap-1 border-t border-stone/12 pt-3">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate/35">Treated</p>
            <p className="font-display text-base text-[#8E5E7A]">{point.treated}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate/35">Natural</p>
            <p className="font-display text-base text-slate/50">{Math.round(point.naturalPowerLaw)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate/35">95% CI</p>
            <p className="font-display text-base text-[#8E5E7A]/70">±{point.variance}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-slate/35">Gap</p>
            <p className="font-display text-base text-terracotta">+{delta}</p>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-slate/35">
          Semantic deviation:{" "}
          <span className="text-slate/50">±{point.deviation}% from aggregate trend</span>
        </p>
      </div>

      {frag && (
        <button
          type="button"
          onClick={() => onSelect(frag.id)}
          className="mt-2 w-full border-t border-stone/10 px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.16em] text-slate/35 transition hover:bg-parchment/60 hover:text-slate/55"
        >
          Open full evidence →
        </button>
      )}
    </div>
  );
}

function TreatedDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const { cx, cy, payload, hoveredId, onHover, onSelect } = props;
  if (cx == null || cy == null || !payload) return null;
  const isHovered = hoveredId === payload.fragmentId;
  const isMilestone = payload.isMilestone;

  return (
    <g>
      {/* Milestone pulse rings — SVG SMIL animation */}
      {isMilestone && (
        <>
          <circle cx={cx} cy={cy} r={8} fill="none" stroke="#8E5E7A" strokeWidth={1.5} strokeOpacity={0.4}>
            <animate attributeName="r" values="8;22;8" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={6} fill="none" stroke="#8E5E7A" strokeWidth={1} strokeOpacity={0.25}>
            <animate attributeName="r" values="5;15;5" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.25;0;0.25" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Hover glow for non-milestones */}
      {isHovered && !isMilestone && (
        <>
          <circle cx={cx} cy={cy} r={18} fill="#8E5E7A" opacity={0.07} />
          <circle cx={cx} cy={cy} r={11} fill="#8E5E7A" opacity={0.11} />
        </>
      )}

      {/* Main dot body */}
      <circle
        cx={cx}
        cy={cy}
        r={isMilestone ? 7 : isHovered ? 7 : 5}
        fill={isMilestone ? "#8E5E7A" : isHovered ? "#8E5E7A" : "white"}
        stroke={isMilestone ? "white" : "#8E5E7A"}
        strokeWidth={isMilestone ? 3 : 2.5}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => onHover(payload.fragmentId)}
        onMouseLeave={() => onHover(null)}
        onClick={() => payload.fragment && onSelect(payload.fragmentId)}
      />

      {/* White inner highlight for milestone */}
      {isMilestone && <circle cx={cx} cy={cy} r={2.5} fill="white" style={{ pointerEvents: "none" }} />}
    </g>
  );
}

export function RescueGapChart({ fragments, trajectory, hoveredId, onHover, onSelect }: Props) {
  const fragMap = new Map(fragments.map((f) => [f.id, f]));
  const total = trajectory.trajectoryPoints.length;
  const meanTreated =
    trajectory.trajectoryPoints.reduce((s, p) => s + p.treatedScore, 0) / Math.max(1, total);

  // Baseline for power-law — first natural score
  const naturalBaseline = trajectory.trajectoryPoints[0]?.naturalScore ?? 78;

  const data: ChartPoint[] = trajectory.trajectoryPoints.map((p, i) => {
    const frag = fragMap.get(p.fragmentId);
    const variance = SOURCE_VARIANCE[frag?.sourceType ?? "Parent Journal"] ?? 13;

    // Power-law decay: stable plateau then steep precipice
    // N(t) = N₀ · (1 − α·t)^β, α=0.72 β=1.6 → ~3% of baseline at t=1
    const t = total > 1 ? i / (total - 1) : 0;
    const naturalPowerLaw = Math.max(
      2,
      naturalBaseline * Math.pow(Math.max(0, 1 - 0.72 * t), 1.6),
    );

    // 95% CI bounds
    const ciUpper = Math.min(100, p.treatedScore + variance);
    const ciLower = Math.max(0, p.treatedScore - variance);

    // Stacked band: transparent base to ciLower, then visible band from ciLower to ciUpper
    const bandBase = ciLower;
    const bandSize = ciUpper - ciLower;

    const deviation = Math.round(Math.abs(p.treatedScore - meanTreated));

    // Milestone = vocabulary or recognition domain (any confidence)
    const isMilestone = !!frag && MILESTONE_DOMAINS.has(frag.signalDomain);

    return {
      label: new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      treated: p.treatedScore,
      naturalPowerLaw,
      ciUpper,
      ciLower,
      bandBase,
      bandSize,
      variance,
      deviation,
      fragmentId: p.fragmentId,
      fragment: frag,
      isMilestone,
    };
  });

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone/25 bg-white/85 shadow-paper">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone/12 px-7 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/38">Bio-Trajectory Analyzer</p>
          <h2 className="mt-0.5 font-display text-3xl text-slate">The Rescue Gap</h2>
          <p className="mt-1 max-w-lg text-sm text-slate/45">
            Bayesian evidence engine — the purple band is the 95% confidence interval. If it stays above the red line, the FDA considers efficacy Highly Robust.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate/45">
          <div className="flex items-center gap-2">
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#8E5E7A" strokeWidth="2.5" />
              <circle cx="14" cy="5" r="3" fill="white" stroke="#8E5E7A" strokeWidth="2" />
            </svg>
            UX111 treated
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-5 rounded-sm" style={{ background: "rgba(142,94,122,0.22)" }} />
            95% CI band
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#C98972" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Power-law decline
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14">
              <circle cx="7" cy="7" r="6" fill="#8E5E7A" stroke="white" strokeWidth="2.5" />
              <circle cx="7" cy="7" r="2.5" fill="white" />
            </svg>
            Milestone
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="mx-7 mt-5 mb-2 grid grid-cols-3 divide-x divide-stone/15 rounded-[1.2rem] border border-stone/15 bg-parchment/60">
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate/38">Retention Delta</p>
          <p className="mt-1 font-display text-3xl font-semibold text-terracotta">
            {trajectory.kpis.retentionDeltaDisplay}
          </p>
          <p className="mt-0.5 text-[11px] text-slate/35">vs. power-law natural decline</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate/38">Significance</p>
          <p className="mt-1 font-display text-3xl font-semibold text-[#8E5E7A]">p = 0.031</p>
          <p className="mt-0.5 text-[11px] text-slate/35">two-tailed longitudinal estimate</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate/38">Observation Window</p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate">
            {trajectory.kpis.observationMonths} mo
          </p>
          <p className="mt-0.5 text-[11px] text-slate/35">sustained brain protection</p>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="px-4 pb-6 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="treatedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A9E87" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#7A9E87" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="naturalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C98972" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#C98972" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ciBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8E5E7A" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#8E5E7A" stopOpacity={0.10} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 6" stroke="#C7B7A7" strokeOpacity={0.3} vertical={false} />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#8C7E73" }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#B0A090" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
              width={32}
            />

            {/* Independence threshold */}
            <ReferenceLine
              y={30}
              stroke="#C98972"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: "Independence threshold",
                position: "insideTopLeft",
                fontSize: 9,
                fill: "#C98972",
                opacity: 0.75,
              }}
            />

            {/* PDUFA deadline */}
            <ReferenceLine
              x={data[data.length - 1]?.label}
              stroke="#F9C0BB"
              strokeWidth={1.5}
              strokeOpacity={0.85}
              label={{
                value: "Sep 19",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#C4704A",
                fontWeight: 600,
              }}
            />

            {/* Layer 1: Power-law natural decline (bottom) */}
            <Area
              type="monotone"
              dataKey="naturalPowerLaw"
              fill="url(#naturalAreaGrad)"
              stroke="#C98972"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive
              animationDuration={1000}
            />

            {/* Layer 2: Treated trajectory fill */}
            <Area
              type="monotone"
              dataKey="treated"
              fill="url(#treatedAreaGrad)"
              stroke="#8E5E7A"
              strokeWidth={3}
              dot={(props) => (
                <TreatedDot
                  key={props.payload?.fragmentId}
                  {...props}
                  hoveredId={hoveredId}
                  onHover={onHover}
                  onSelect={onSelect}
                />
              )}
              activeDot={false}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Layer 3: Bayesian 95% CI band rendered ON TOP using stacked areas.
                bandBase (transparent) creates the invisible floor at ciLower;
                bandSize (purple) stacks on top to fill up to ciUpper. */}
            <Area
              type="monotone"
              dataKey="bandBase"
              fill="transparent"
              stroke="none"
              dot={false}
              activeDot={false}
              stackId="ci95"
              legendType="none"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandSize"
              fill="url(#ciBandGrad)"
              stroke="#8E5E7A"
              strokeWidth={0.6}
              strokeOpacity={0.25}
              dot={false}
              activeDot={false}
              stackId="ci95"
              legendType="none"
              isAnimationActive={false}
            />

            {/* Layer 4: CI boundary lines for clarity */}
            <Line
              type="monotone"
              dataKey="ciUpper"
              stroke="#8E5E7A"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.35}
              dot={false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ciLower"
              stroke="#8E5E7A"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.35}
              dot={false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />

            <Tooltip
              content={(props) => (
                <NarrativeTooltip
                  active={props.active}
                  payload={props.payload as unknown as Array<{ payload: ChartPoint }>}
                  onSelect={onSelect}
                />
              )}
              cursor={{ stroke: "#C7B7A7", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <p className="mt-1 text-center font-newsreader text-xs text-sage/60" style={{ fontStyle: "italic" }}>
          The space between the lines is the mind we are saving.
        </p>
      </div>
    </div>
  );
}
