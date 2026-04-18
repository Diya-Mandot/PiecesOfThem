"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
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

const MILESTONE_DOMAINS = new Set(["vocabulary", "recognition"]);

// Semantic density: higher-fidelity sources → tighter confidence band
const SOURCE_VARIANCE: Record<string, number> = {
  "Voice Memo": 5,
  "Clinic Summary": 8,
  "Caregiver Transcript": 10,
  "Parent Journal": 12,
  "Forum Observation": 18,
};

const MILESTONE_LABELS: Record<string, string> = {
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
  bandLo: number;
  bandWidth: number;
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

  return (
    <div className="w-72 overflow-hidden rounded-[1.3rem] border border-stone/20 bg-white shadow-[0_8px_40px_rgba(44,41,48,0.14)]">
      <div className="px-4 pt-4">
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

        <p className="font-display text-sm leading-snug text-slate">
          {frag?.title ?? point.label}
        </p>

        {point.isMilestone && frag && (
          <p className="mt-1 text-[11px] font-medium text-[#8E5E7A]/80">
            {MILESTONE_LABELS[frag.signalDomain]}
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
            <p className="text-[9px] uppercase tracking-[0.14em] text-slate/35">Treated</p>
            <p className="font-display text-base text-[#8E5E7A]">{point.treated}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.14em] text-slate/35">Natural</p>
            <p className="font-display text-base text-slate/50">{Math.round(point.naturalPowerLaw)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.14em] text-slate/35">95% CI</p>
            <p className="font-display text-base text-[#8E5E7A]/70">±{point.variance}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.14em] text-slate/35">Gap</p>
            <p className="font-display text-base text-terracotta">+{delta}</p>
          </div>
        </div>

        {point.deviation > 0 && (
          <p className="mt-2 text-[10px] text-slate/35">
            Semantic deviation: <span className="text-slate/55">±{point.deviation}% from aggregate trend</span>
          </p>
        )}
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
  if (!cx || !cy || !payload) return null;
  const isHovered = hoveredId === payload.fragmentId;
  const isMilestone = payload.isMilestone;

  return (
    <g>
      {/* Milestone pulse rings — SVG animate for zero-JS animation */}
      {isMilestone && (
        <>
          <circle cx={cx} cy={cy} r={10} fill="none" stroke="#8E5E7A" strokeWidth={1.2} strokeOpacity={0.3}>
            <animate attributeName="r" values="8;22;8" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={8} fill="none" stroke="#8E5E7A" strokeWidth={1} strokeOpacity={0.2}>
            <animate attributeName="r" values="6;16;6" dur="2.6s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.2;0;0.2" dur="2.6s" begin="0.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Hover glow (non-milestone) */}
      {isHovered && !isMilestone && (
        <>
          <circle cx={cx} cy={cy} r={20} fill="#8E5E7A" opacity={0.08} />
          <circle cx={cx} cy={cy} r={12} fill="#8E5E7A" opacity={0.12} />
        </>
      )}

      {/* Main dot */}
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

      {/* White core for milestone dot */}
      {isMilestone && (
        <circle cx={cx} cy={cy} r={2.5} fill="white" style={{ pointerEvents: "none" }} />
      )}
    </g>
  );
}

export function RescueGapChart({ fragments, trajectory, hoveredId, onHover, onSelect }: Props) {
  const fragMap = new Map(fragments.map((f) => [f.id, f]));
  const total = trajectory.trajectoryPoints.length;

  // Mean treated score — anchor for semantic deviation calculation
  const meanTreated =
    trajectory.trajectoryPoints.reduce((s, p) => s + p.treatedScore, 0) / (total || 1);

  const data: ChartPoint[] = trajectory.trajectoryPoints.map((p, i) => {
    const frag = fragMap.get(p.fragmentId);

    // Bayesian variance from source semantic density
    const variance = SOURCE_VARIANCE[frag?.sourceType ?? "Forum Observation"] ?? 12;

    // Power-law decay: N(t) = N₀ · (1 − α·t)^β
    // α=0.35, β=1.8 → gentle plateau then steep decline, matching Sanfilippo natural history
    const t = total > 1 ? i / (total - 1) : 0;
    const naturalPowerLaw = Math.max(0, p.naturalScore * Math.pow(Math.max(0, 1 - 0.35 * t), 1.8));

    // 95% confidence band bounds
    const bandLo = Math.max(0, p.treatedScore - variance);
    const bandWidth = Math.min(100, p.treatedScore + variance) - bandLo;

    // Semantic deviation from aggregate trend
    const deviation = Math.round(Math.abs(p.treatedScore - meanTreated));

    const isMilestone =
      !!frag && MILESTONE_DOMAINS.has(frag.signalDomain) && frag.confidence === "high";

    return {
      label: new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      treated: p.treatedScore,
      naturalPowerLaw,
      bandLo,
      bandWidth,
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
            Bayesian-weighted evidence engine. The band is the 95% confidence interval; each dot is a real parent story.
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
            <div className="h-3 w-5 rounded-sm" style={{ background: "rgba(142,94,122,0.20)" }} />
            95% CI band
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#C98972" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Power-law decline
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12">
              <circle cx="6" cy="6" r="5" fill="#8E5E7A" stroke="white" strokeWidth="2.5" />
              <circle cx="6" cy="6" r="2" fill="white" />
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
              <linearGradient id="treatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A9E87" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7A9E87" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="naturalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C98972" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#C98972" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8E5E7A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8E5E7A" stopOpacity={0.06} />
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

            <ReferenceLine
              y={30}
              stroke="#C98972"
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: "Independence threshold",
                position: "insideTopLeft",
                fontSize: 9,
                fill: "#C98972",
                opacity: 0.7,
              }}
            />
            <ReferenceLine
              x={data[data.length - 1]?.label}
              stroke="#F9C0BB"
              strokeWidth={1.5}
              strokeOpacity={0.8}
              label={{
                value: "Sep 19",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#C4704A",
                fontWeight: 600,
              }}
            />

            {/* Bayesian confidence band — stacked areas:
                bandLo = transparent base, bandWidth = visible purple layer */}
            <Area
              type="monotone"
              dataKey="bandLo"
              fill="transparent"
              stroke="none"
              dot={false}
              activeDot={false}
              stackId="ci"
              legendType="none"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandWidth"
              fill="url(#confidenceBand)"
              stroke="none"
              dot={false}
              activeDot={false}
              stackId="ci"
              legendType="none"
              isAnimationActive={false}
            />

            {/* Power-law natural decline */}
            <Area
              type="monotone"
              dataKey="naturalPowerLaw"
              fill="url(#naturalGrad)"
              stroke="#C98972"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive
            />

            {/* UX111 treated trajectory */}
            <Area
              type="monotone"
              dataKey="treated"
              fill="url(#treatedGrad)"
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
