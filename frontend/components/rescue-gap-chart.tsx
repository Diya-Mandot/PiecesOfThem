"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Dot,
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

type ChartPoint = {
  label: string;
  treated: number;
  natural: number;
  fragmentId: string;
  fragment?: EvidenceFragment;
};

type Props = {
  fragments: EvidenceFragment[];
  trajectory: GetTrajectoryResponse;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

// Custom tooltip — the audit trail moment
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
  const delta = Math.round(point.treated - point.natural);

  return (
    <div className="w-72 overflow-hidden rounded-[1.3rem] border border-stone/20 bg-white shadow-[0_8px_40px_rgba(44,41,48,0.14)]">
      <div className="px-4 pt-4">
        {/* Badges */}
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
        </div>

        {/* Title */}
        <p className="font-display text-sm leading-snug text-slate">
          {frag?.title ?? point.label}
        </p>

        {/* Quote — the narrative heart */}
        {frag?.excerpt && (
          <p
            className="mt-2 font-newsreader text-[13px] leading-[1.65] text-slate/65 line-clamp-4"
            style={{ fontStyle: "italic" }}
          >
            &ldquo;{frag.excerpt}&rdquo;
          </p>
        )}

        {/* Delta stats */}
        <div className="mt-3 flex items-center gap-3 border-t border-stone/12 pt-3">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate/35">Treated</p>
            <p className="font-display text-lg text-[#8E5E7A]">{point.treated}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate/35">Natural</p>
            <p className="font-display text-lg text-slate/50">{point.natural}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate/35">Rescue gap</p>
            <p className="font-display text-lg text-terracotta">+{delta}</p>
          </div>
        </div>
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

// Custom dot for treated line — highlights hovered fragment
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

  return (
    <g>
      {isHovered && (
        <>
          <circle cx={cx} cy={cy} r={20} fill="#8E5E7A" opacity={0.08} />
          <circle cx={cx} cy={cy} r={12} fill="#8E5E7A" opacity={0.12} />
        </>
      )}
      <circle
        cx={cx} cy={cy}
        r={isHovered ? 7 : 5}
        fill={isHovered ? "#8E5E7A" : "white"}
        stroke="#8E5E7A"
        strokeWidth={2.5}
        style={{ cursor: "pointer", transition: "r 0.15s" }}
        onMouseEnter={() => onHover(payload.fragmentId)}
        onMouseLeave={() => onHover(null)}
        onClick={() => payload.fragment && onSelect(payload.fragmentId)}
      />
    </g>
  );
}

export function RescueGapChart({ fragments, trajectory, hoveredId, onHover, onSelect }: Props) {
  const fragMap = new Map(fragments.map((f) => [f.id, f]));

  const data: ChartPoint[] = trajectory.trajectoryPoints.map((p) => ({
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    treated: p.treatedScore,
    natural: p.naturalScore,
    fragmentId: p.fragmentId,
    fragment: fragMap.get(p.fragmentId),
  }));

  const latestTreated = data[data.length - 1]?.treated ?? 0;
  const latestNatural = data[data.length - 1]?.natural ?? 0;
  const retentionDelta = Math.round(latestTreated - latestNatural);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone/25 bg-white/85 shadow-paper">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone/12 px-7 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/38">Stability Chart</p>
          <h2 className="mt-0.5 font-display text-3xl text-slate">The Rescue Gap</h2>
          <p className="mt-1 max-w-lg text-sm text-slate/45">
            The gap between what the brain was expected to lose and what it kept. Each point is a real parent story.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate/45">
          <div className="flex items-center gap-2">
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#8E5E7A" strokeWidth="2.5" />
              <circle cx="14" cy="5" r="3" fill="white" stroke="#8E5E7A" strokeWidth="2" />
            </svg>
            UX111 treated
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="10">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#B0A090" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Untreated decline
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-5 rounded-sm bg-sage/30" />
            Rescue gap
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
          <p className="mt-0.5 text-[11px] text-slate/35">vs. untreated natural history</p>
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
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <defs>
              {/* Sage gradient — treated area */}
              <linearGradient id="treatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A9E87" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7A9E87" stopOpacity={0.03} />
              </linearGradient>
              {/* Red gradient — natural decline area */}
              <linearGradient id="naturalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C7B7A7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#C7B7A7" stopOpacity={0.05} />
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

            {/* Decline threshold reference line */}
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

            {/* Sep 19 deadline reference line */}
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

            {/* Natural history — filled area */}
            <Area
              type="monotone"
              dataKey="natural"
              fill="url(#naturalGrad)"
              stroke="#B0A090"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive
            />

            {/* Treated — filled area + line */}
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

        {/* Gap annotation */}
        <p className="mt-1 text-center font-newsreader text-xs text-sage/60" style={{ fontStyle: "italic" }}>
          The space between the lines is the mind we are saving.
        </p>
      </div>
    </div>
  );
}
