"use client";

import type { GetTrajectoryResponse } from "@shared/api";
import type { EvidenceFragment } from "@shared/types";

const width = 1000;
const height = 260;
const padding = { top: 20, right: 40, bottom: 44, left: 52 };
const innerWidth = width - padding.left - padding.right;
const innerHeight = height - padding.top - padding.bottom;
const yTicks = [25, 50, 75, 100];

type Props = {
  fragments: EvidenceFragment[];
  trajectory: GetTrajectoryResponse;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export function RescueGapChart({ fragments, trajectory, hoveredId, onHover, onSelect }: Props) {
  const startMs = new Date(trajectory.trajectoryPoints[0]?.date ?? "2024-03-08").getTime();
  const endMs = new Date("2026-09-19").getTime();
  const rangeMs = Math.max(endMs - startMs, 1);
  const fragMap = new Map(fragments.map((fragment) => [fragment.id, fragment]));

  const treated = trajectory.trajectoryPoints.map((point) => ({
    ...point,
    x: padding.left + ((new Date(point.date).getTime() - startMs) / rangeMs) * innerWidth,
    y: padding.top + (1 - point.treatedScore / 100) * innerHeight,
  }));

  const natural = trajectory.trajectoryPoints.map((point) => ({
    ...point,
    x: padding.left + ((new Date(point.date).getTime() - startMs) / rangeMs) * innerWidth,
    y: padding.top + (1 - point.naturalScore / 100) * innerHeight,
  }));

  const treatedPath = smoothPath(treated.map(({ x, y }) => ({ x, y })));
  const naturalPath = smoothPath(natural.map(({ x, y }) => ({ x, y })));

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone/25 bg-white/85 shadow-paper">
      <div className="flex items-start justify-between gap-6 border-b border-stone/15 px-7 py-5">
        <div>
          <h2 className="font-display text-2xl text-slate">Stability Gap</h2>
          <p className="mt-0.5 text-sm text-slate/45">
            Hover a point on the sage line to see which evidence piece supports it.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-6 pt-1 text-xs text-slate/50">
          <div className="flex items-center gap-2">
            <svg width="32" height="10">
              <line x1="0" y1="5" x2="32" y2="5" stroke="#7A9E87" strokeWidth="2.5" strokeDasharray="6 4" />
              <circle cx="16" cy="5" r="3" fill="white" stroke="#7A9E87" strokeWidth="2" />
            </svg>
            UX111 treated
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded-sm bg-slate opacity-30" />
            Untreated decline
          </div>
        </div>
      </div>

      <div className="px-2 py-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: 220 }}
          onMouseLeave={() => onHover(null)}
        >
          {yTicks.map((value) => {
            const y = padding.top + (1 - value / 100) * innerHeight;
            return (
              <g key={value}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#C7B7A7" strokeWidth="0.5" strokeDasharray="3 5" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#B0A090">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={naturalPath} fill="none" stroke="#8B8B8B" strokeWidth="1.5" opacity="0.35" />
          <path d={treatedPath} fill="none" stroke="#7A9E87" strokeWidth="2.5" strokeDasharray="8 5" />

          {treated.map((point) => {
            const isHovered = hoveredId === point.fragmentId;
            const fragment = fragMap.get(point.fragmentId);

            return (
              <g key={point.fragmentId} style={{ cursor: "pointer" }}>
                {isHovered ? <circle cx={point.x} cy={point.y} r={12} fill="#7A9E87" opacity="0.12" /> : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? "#7A9E87" : "white"}
                  stroke="#7A9E87"
                  strokeWidth="2.5"
                  onMouseEnter={() => onHover(point.fragmentId)}
                  onClick={() => (fragment ? onSelect(point.fragmentId) : null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 divide-x divide-stone/20 border-t border-stone/15">
        <MetricCell
          label="Retention Delta"
          value={trajectory.kpis.retentionDeltaDisplay}
          detail="vs. untreated trajectory"
          valueClassName="text-terracotta"
        />
        <MetricCell
          label="Statistical Significance"
          value={trajectory.kpis.pValue}
          detail={trajectory.kpis.pLabel}
          valueClassName="text-sage"
        />
        <MetricCell
          label="Observation Window"
          value={`${trajectory.kpis.observationMonths} mo`}
          detail={`${trajectory.trajectoryPoints[0]?.date ?? ""} – ${trajectory.trajectoryPoints.at(-1)?.date ?? ""}`}
          valueClassName="text-slate"
        />
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  detail,
  valueClassName,
}: {
  label: string;
  value: string;
  detail: string;
  valueClassName: string;
}) {
  return (
    <div className="px-6 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">{label}</p>
      <p className={`mt-1 font-display text-3xl ${valueClassName}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate/35">{detail}</p>
    </div>
  );
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const controlPoint = ((previous.x + current.x) / 2).toFixed(1);
    path += ` C ${controlPoint} ${previous.y.toFixed(1)}, ${controlPoint} ${current.y.toFixed(1)}, ${current.x.toFixed(1)} ${current.y.toFixed(1)}`;
  }

  return path;
}
