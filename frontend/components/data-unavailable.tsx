import Link from "next/link";

export function DataUnavailable({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="min-h-screen bg-parchment px-6 py-16 text-slate sm:px-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone/30 bg-white/80 p-8 shadow-paper">
        <p className="text-xs uppercase tracking-[0.28em] text-rosewood/75">
          PiecesOfThem / Data Pending
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.03em]">{title}</h1>
        <p className="mt-5 text-base leading-7 text-slate/72">{body}</p>
        <p className="mt-4 text-sm leading-7 text-slate/62">
          The ingestion database is populated, but the frontend-facing case projection is not
          available yet. This usually means extracted datapoints have not been written yet.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-full bg-slate px-6 py-3 text-sm font-medium text-white transition hover:bg-rosewood"
          >
            Back To Landing Page
          </Link>
        </div>
      </div>
    </main>
  );
}
