"use client";

import { trajectoryPoints, kpis } from "@/lib/chart-data";
import type { EvidenceFragment } from "@/lib/types";

// ── SVG layout ────────────────────────────────────────────────────────────────
const W = 1000;
const H = 260;
const PAD = { top: 20, right: 40, bottom: 44, left: 52 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

const START_MS = new Date("2024-03-08").getTime();
const END_MS   = new Date("2026-09-19").getTime(); // extend to deadline
const RANGE_MS = END_MS - START_MS;

function dateToX(date: string) {
  return PAD.left + ((new Date(date).getTime() - START_MS) / RANGE_MS) * IW;
}
function scoreToY(score: number) {
  return PAD.top + (1 - score / 100) * IH;
}

// Smooth cubic-bezier path
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cp = ((p.x + c.x) / 2).toFixed(1);
    d += ` C ${cp} ${p.y.toFixed(1)}, ${cp} ${c.y.toFixed(1)}, ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  return d;
}

// Pre-compute
const treatedXY  = trajectoryPoints.map(p => ({ x: dateToX(p.date), y: scoreToY(p.treatedScore), point: p }));
const naturalXY  = trajectoryPoints.map(p => ({ x: dateToX(p.date), y: scoreToY(p.naturalScore) }));
const treatedPath = smoothPath(treatedXY);
const naturalPath = smoothPath(naturalXY);

// Natural history filled shadow (area under the curve)
const naturalFill =
  naturalPath +
  ` L ${naturalXY[naturalXY.length - 1].x.toFixed(1)} ${(H - PAD.bottom).toFixed(1)}` +
  ` L ${naturalXY[0].x.toFixed(1)} ${(H - PAD.bottom).toFixed(1)} Z`;

// Gap fill between the two lines
const gapFill =
  treatedPath +
  ` L ${naturalXY[naturalXY.length - 1].x.toFixed(1)} ${naturalXY[naturalXY.length - 1].y.toFixed(1)}` +
  " " + smoothPath([...naturalXY].reverse()).replace(/^M[^C]*/, `L `) + " Z";

const Y_TICKS = [25, 50, 75, 100];
const X_YEARS = ["2024", "2025", "2026"].map(y => ({ label: y, x: dateToX(`${y}-01-01`) }));
const DEADLINE_X = dateToX("2026-09-19");

type Props = {
  fragments: EvidenceFragment[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export function RescueGapChart({ fragments, hoveredId, onHover, onSelect }: Props) {
  const fragMap = new Map(fragments.map(f => [f.id, f]));

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone/25 bg-white/85 shadow-paper">
      {/* Chart top bar */}
      <div className="flex items-start justify-between gap-6 border-b border-stone/15 px-7 py-5">
        <div>
          <h2 className="font-display text-2xl text-slate">Stability Gap</h2>
          <p className="mt-0.5 text-sm text-slate/45">
            Hover a point on the sage line to see the parent story behind it
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0 text-xs text-slate/50 pt-1">
          <div className="flex items-center gap-2">
            <svg width="32" height="10">
              <line x1="0" y1="5" x2="32" y2="5" stroke="#7A9E87" strokeWidth="2.5" strokeDasharray="6 4" />
              <circle cx="16" cy="5" r="3" fill="white" stroke="#7A9E87" strokeWidth="2" />
            </svg>
            UX111 treated
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded-sm opacity-30 bg-slate" />
            Untreated decline
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, rgba(122,158,135,0.3), rgba(122,158,135,0.05))" }} />
            Rescue gap
          </div>
        </div>
      </div>

      {/* SVG */}
      <div className="px-2 py-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: 220 }}
          onMouseLeave={() => onHover(null)}
        >
          <defs>
            <linearGradient id="naturalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B8B8B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B8B8B" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7A9E87" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7A9E87" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {Y_TICKS.map(v => (
            <g key={v}>
              <line x1={PAD.left} y1={scoreToY(v)} x2={W - PAD.right} y2={scoreToY(v)}
                stroke="#C7B7A7" strokeWidth="0.5" strokeDasharray="3 5" />
              <text x={PAD.left - 8} y={scoreToY(v) + 4} textAnchor="end" fontSize="10" fill="#B0A090">{v}</text>
            </g>
          ))}

          {/* X labels */}
          {X_YEARS.map(({ label, x }) => (
            <text key={label} x={x} y={H - 6} textAnchor="middle" fontSize="11" fill="#B0A090">{label}</text>
          ))}

          {/* Deadline marker */}
          <line x1={DEADLINE_X} y1={PAD.top} x2={DEADLINE_X} y2={H - PAD.bottom}
            stroke="#C4704A" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x={DEADLINE_X + 5} y={PAD.top + 13} fontSize="9" fill="#C4704A" opacity="0.7">Sep 19 deadline</text>

          {/* Natural history shadow */}
          <path d={naturalFill} fill="url(#naturalGrad)" />
          <path d={naturalPath} fill="none" stroke="#8B8B8B" strokeWidth="1.5" opacity="0.35" />

          {/* Gap fill */}
          <path d={gapFill} fill="url(#gapGrad)" />

          {/* Treated dashed sage line */}
          <path d={treatedPath} fill="none" stroke="#7A9E87" strokeWidth="2.5" strokeDasharray="8 5" />

          {/* Treated dots */}
          {treatedXY.map(({ x, y, point }) => {
            const isHovered = hoveredId === point.fragmentId;
            const frag = fragMap.get(point.fragmentId);
            return (
              <g key={point.fragmentId} style={{ cursor: "pointer" }}>
                {isHovered && (
                  <>
                    <circle cx={x} cy={y} r={18} fill="#7A9E87" opacity="0.1" />
                    <circle cx={x} cy={y} r={10} fill="#7A9E87" opacity="0.18" />
                  </>
                )}
                <circle
                  cx={x} cy={y}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? "#7A9E87" : "white"}
                  stroke="#7A9E87"
                  strokeWidth="2.5"
                  onMouseEnter={() => onHover(point.fragmentId)}
                  onClick={() => frag && onSelect(point.fragmentId)}
                  style={{ transition: "r 0.15s" }}
                />
                {isHovered && (
                  <text x={x} y={y - 14} textAnchor="middle" fontSize="10" fill="#617368" fontWeight="600">
                    {point.treatedScore}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 divide-x divide-stone/20 border-t border-stone/15">
        <div className="px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">Retention Delta</p>
          <p className="mt-1 font-instrument text-3xl font-semibold text-terracotta">{kpis.retentionDeltaDisplay}</p>
          <p className="mt-0.5 text-xs text-slate/35">vs. untreated trajectory</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">Statistical Significance</p>
          <p className="mt-1 font-instrument text-3xl font-semibold text-sage">{kpis.pValue}</p>
          <p className="mt-0.5 text-xs text-slate/35">{kpis.pLabel}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate/40">Observation Window</p>
          <p className="mt-1 font-instrument text-3xl font-semibold text-slate">{kpis.observationMonths} mo</p>
          <p className="mt-0.5 text-xs text-slate/35">Mar 2024 – Feb 2026</p>
        </div>
      </div>
    </div>
  );
}
