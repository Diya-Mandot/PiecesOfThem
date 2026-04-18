"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { GetReportResponse } from "@shared/api";

import { formatDate } from "@/lib/format";

export function ReportPage({
  report,
  autoPrint = false,
}: {
  report: GetReportResponse;
  autoPrint?: boolean;
}) {
  const hasTriggeredPrint = useRef(false);
  const isReviewReady = report.reportReadiness === "review-ready";

  useEffect(() => {
    if (!autoPrint || !isReviewReady || hasTriggeredPrint.current) {
      return;
    }

    hasTriggeredPrint.current = true;
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [autoPrint, isReviewReady]);

  return (
    <main className="min-h-screen bg-ivory px-5 py-8 text-slate sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-[2.2rem] border border-stone/30 bg-white p-8 shadow-paper sm:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-stone/20 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-xl tracking-[-0.02em] text-slate transition hover:text-terracotta"
            >
              PiecesOfThem
            </Link>
            <span className="h-3.5 w-px bg-stone/35" />
            <span className="text-xs uppercase tracking-[0.22em] text-slate/42">Evidence Brief</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-stone/30 bg-white px-4 py-2 text-sm font-medium text-slate transition hover:border-stone/50"
            >
              Home
            </Link>
            <Link
              href="/case/all-evidence"
              className="rounded-full bg-slate px-4 py-2 text-sm font-medium text-white transition hover:bg-rosewood"
            >
              Back to Evidence Archive
            </Link>
            <button
              type="button"
              onClick={() => {
                if (isReviewReady) {
                  window.print();
                }
              }}
              disabled={!isReviewReady}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isReviewReady
                  ? "bg-terracotta text-white hover:bg-oxidizedRose"
                  : "cursor-not-allowed bg-stone/20 text-slate/45"
              }`}
            >
              {isReviewReady ? "Save as PDF" : "PDF disabled for mixed/demo evidence"}
            </button>
          </div>
        </div>

        <div
          className={`mb-8 rounded-[1.2rem] px-4 py-3 text-sm print:hidden ${
            report.reportReadiness === "review-ready"
              ? "border border-sage/35 bg-sage/10 text-sage"
              : report.reportReadiness === "internal-review"
                ? "border border-amber-500/35 bg-amber-500/10 text-amber-800"
                : "border border-petalPink/45 bg-petalPink/12 text-slate/70"
          }`}
        >
          <strong className="font-medium">{readinessTitle(report.reportReadiness)}.</strong>{" "}
          {readinessBody(report.reportReadiness)}
        </div>

        {autoPrint ? (
          <div className="mb-8 rounded-[1.2rem] border border-petalPink/45 bg-petalPink/12 px-4 py-3 text-sm text-slate/70 print:hidden">
            {isReviewReady
              ? "Package mode is active. Use your browser's print dialog to save the Sept 19th evidence package as a PDF."
              : "Package mode is disabled because this brief contains synthetic or mixed evidence."}
          </div>
        ) : null}

        <div className="flex flex-col gap-8 border-b border-stone/25 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">
              PiecesOfThem / Evidence brief
            </p>
            <h1 className="mt-4 font-display text-5xl tracking-[-0.03em]">
              {report.label}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate/72">{report.summary}</p>
          </div>
          <div className="rounded-[1.5rem] border border-stone/25 bg-parchment px-5 py-5 text-sm leading-6 text-slate/72">
            <div>{report.disease}</div>
            <div>{report.therapy}</div>
            <div>{formatDate(report.observationStart)} to {formatDate(report.observationEnd)}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Fragments" value={String(report.metrics.fragmentCount).padStart(2, "0")} />
          <MetricCard label="Claims" value={String(report.metrics.claimCount).padStart(2, "0")} />
          <MetricCard label="Modalities" value={String(report.metrics.modalities).padStart(2, "0")} />
          <MetricCard label="Domains" value={String(report.metrics.domains).padStart(2, "0")} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Real Fragments" value={String(report.metrics.realFragments).padStart(2, "0")} />
          <MetricCard label="Synthetic Fragments" value={String(report.metrics.syntheticFragments).padStart(2, "0")} />
          <MetricCard label="Mixed Claims" value={String(report.metrics.mixedClaims).padStart(2, "0")} />
        </div>

        <section className="mt-10 rounded-[1.8rem] border border-stone/25 bg-slate px-6 py-6 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-blush/75">Review context</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">{report.reviewWindow}</p>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">Claim set</p>
          <div className="mt-5 space-y-5">
            {report.claims.map((claim) => (
              <article
                key={claim.id}
                className="rounded-[1.8rem] border border-stone/25 bg-parchment/60 p-6"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate/55">
                  <span>{claim.id}</span>
                  <span>{claim.domain}</span>
                  <span>{claim.confidence} confidence</span>
                  <span>{claim.trend}</span>
                  <span>{claim.provenance}</span>
                </div>
                <h2 className="mt-4 font-display text-3xl leading-tight">{claim.statement}</h2>
                <div className="mt-5 grid gap-3">
                  {claim.citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="rounded-[1.25rem] border border-stone/25 bg-white px-4 py-4"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-slate/45">
                        {citation.id} / {formatDate(citation.date)} / {citation.sourceType} / {citation.provenance}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate/55">
                        <div>Source: {citation.sourceLabel ?? "Unknown source"}</div>
                        {citation.documentTitle ? <div>Document: {citation.documentTitle}</div> : null}
                        {citation.sourceUrl ? <div className="break-all">URL: {citation.sourceUrl}</div> : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate/78">{citation.excerpt}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-stone/25 pt-6 text-sm leading-7 text-slate/68">
          <p>{report.dataHandling}</p>
          <p className="mt-3">{report.provenanceSummary}</p>
          <p className="mt-3">
            Review-support prototype only. No diagnosis, treatment guidance, or approval
            recommendation is produced by this application.
          </p>
        </footer>
      </div>
    </main>
  );
}

function readinessTitle(readiness: GetReportResponse["reportReadiness"]) {
  if (readiness === "review-ready") {
    return "Review-ready evidence set";
  }

  if (readiness === "internal-review") {
    return "Internal-review-only evidence set";
  }

  return "Demo-only evidence set";
}

function readinessBody(readiness: GetReportResponse["reportReadiness"]) {
  if (readiness === "review-ready") {
    return "This brief contains only real, provenance-backed evidence and can be exported.";
  }

  if (readiness === "internal-review") {
    return "This brief mixes real and synthetic evidence. It stays useful for product review, but it is not exportable as a regulatory package.";
  }

  return "This brief contains synthetic demo evidence and must not be used as a regulatory artifact.";
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-stone/25 bg-parchment px-4 py-4">
      <div className="text-xs uppercase tracking-[0.24em] text-rosewood/70">{label}</div>
      <div className="mt-3 font-display text-3xl">{value}</div>
    </div>
  );
}
