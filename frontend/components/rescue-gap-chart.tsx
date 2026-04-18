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
  const gapPath = buildGapPath(treated, natural);
  const activePoint =
    treated.find((point) => point.fragmentId === hoveredId) ?? treated[treated.length - 1] ?? null;
  const activeFragment = activePoint ? fragMap.get(activePoint.fragmentId) ?? null : null;
  const activeDelta = activePoint ? Math.round(activePoint.treatedScore - activePoint.naturalScore) : 0;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone/25 bg-white/85 shadow-paper">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-stone/15 px-7 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-rosewood/55">Trajectory Analyzer</p>
          <h2 className="mt-1 font-display text-3xl text-slate">The Rescue Gap</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate/52">
            The untreated natural-history curve continues downward. The observed trajectory shows
            the functional capacity that appears to have been retained instead of lost.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-6 pt-1 text-xs text-slate/50">
          <div className="flex items-center gap-2">
            <svg width="32" height="10">
              <line x1="0" y1="5" x2="32" y2="5" stroke="#8E5E7A" strokeWidth="2.5" />
              <circle cx="16" cy="5" r="3" fill="white" stroke="#8E5E7A" strokeWidth="2" />
            </svg>
            Observed functional retention
          </div>
          <div className="flex items-center gap-2">
            <svg width="32" height="10">
              <line x1="0" y1="5" x2="32" y2="5" stroke="#4A4850" strokeWidth="1.6" strokeDasharray="4 4" opacity="0.65" />
            </svg>
            Natural history decline
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded-sm bg-[#CFAAB8]/55" />
            Rescue gap
          </div>
        </div>
      </div>

      <div className="px-3 py-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: 240 }}
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

          {trajectory.trajectoryPoints.map((point, index) => {
            const x = padding.left + ((new Date(point.date).getTime() - startMs) / rangeMs) * innerWidth;
            const label = new Date(point.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

            return (
              <text
                key={`${point.fragmentId}-label`}
                x={x}
                y={height - 18}
                textAnchor={index === 0 ? "start" : index === trajectory.trajectoryPoints.length - 1 ? "end" : "middle"}
                fontSize="10"
                fill="#8C7E73"
              >
                {label}
              </text>
            );
          })}

          <path d={gapPath} fill="#CFAAB8" opacity="0.28" />
          <path d={naturalPath} fill="none" stroke="#4A4850" strokeWidth="1.7" strokeDasharray="5 5" opacity="0.72" />
          <path d={treatedPath} fill="none" stroke="#8E5E7A" strokeWidth="2.8" />

          {treated.map((point) => {
            const isHovered = hoveredId === point.fragmentId;
            const fragment = fragMap.get(point.fragmentId);

            return (
              <g key={point.fragmentId} style={{ cursor: "pointer" }}>
                {isHovered ? <circle cx={point.x} cy={point.y} r={13} fill="#8E5E7A" opacity="0.14" /> : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? "#8E5E7A" : "white"}
                  stroke="#8E5E7A"
                  strokeWidth="2.5"
                  onMouseEnter={() => onHover(point.fragmentId)}
                  onClick={() => (fragment ? onSelect(point.fragmentId) : null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-0 border-t border-stone/15 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-3 divide-x divide-stone/20">
          <MetricCell
            label="Retention Delta"
            value={trajectory.kpis.retentionDeltaDisplay}
            detail="functional retention vs. untreated path"
            valueClassName="text-terracotta"
          />
          <MetricCell
            label="P-Value Estimation"
            value={trajectory.kpis.pValue}
            detail={trajectory.kpis.pLabel}
            valueClassName="text-[#8E5E7A]"
          />
          <MetricCell
            label="Observation Window"
            value={`${trajectory.kpis.observationMonths} mo`}
            detail={`${trajectory.trajectoryPoints[0]?.date ?? ""} – ${trajectory.trajectoryPoints.at(-1)?.date ?? ""}`}
            valueClassName="text-slate"
          />
        </div>

        <div className="border-t border-stone/15 bg-parchment/55 px-6 py-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-rosewood/55">Audit Trail</p>
          <h3 className="mt-2 font-display text-2xl leading-tight text-slate">
            {activeFragment?.title ?? "Hover a point to inspect its source"}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate/45">
            <span>{activeFragment?.sourceType ?? "No source selected"}</span>
            {activeFragment ? <span>{formatShortDate(activeFragment.date)}</span> : null}
            {activeFragment ? <span>{activeFragment.signalDomain}</span> : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate/72">
            {activeFragment?.excerpt ??
              "The hovered point will reveal the parent-reported segment and the metadata that supports this trajectory position."}
          </p>
          {activeFragment ? (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <AuditStat label="Observed score" value={String(activePoint?.treatedScore ?? "--")} />
              <AuditStat label="Natural-history score" value={String(activePoint?.naturalScore ?? "--")} />
              <AuditStat label="Rescue gap" value={`${activeDelta >= 0 ? "+" : ""}${activeDelta}`} />
              <AuditStat label="Source ref" value={activeFragment.rawRef} />
            </div>
          ) : null}
        </div>
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

function buildGapPath(
  treated: Array<{ x: number; y: number }>,
  natural: Array<{ x: number; y: number }>,
) {
  if (treated.length < 2 || natural.length < 2) {
    return "";
  }

  const upper = smoothPath(treated.map(({ x, y }) => ({ x, y })));
  const lowerPoints = [...natural].reverse().map(({ x, y }) => ({ x, y }));
  const lower = smoothPath(lowerPoints).replace(/^M[^C]*/, "");

  return `${upper} L ${lowerPoints[0].x.toFixed(1)} ${lowerPoints[0].y.toFixed(1)}${lower} Z`;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function AuditStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-stone/20 bg-white/75 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate/42">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate/72">{value}</p>
    </div>
  );
}
