import Link from "next/link";

const DAYS_TO_DEADLINE = Math.ceil(
  (new Date("2026-09-19").getTime() - Date.now()) / 86_400_000,
);

// Deterministic waveform bars (no hooks needed — static)
function Waveform() {
  const seed = "preview-voice-memo";
  const BARS = 32;
  const heights = Array.from({ length: BARS }, (_, i) => {
    const a = seed.charCodeAt(i % seed.length);
    const b = seed.charCodeAt((i * 3 + 2) % seed.length);
    return 10 + ((a * 13 + b * 7 + i * 19) % 54);
  });
  return (
    <svg viewBox={`0 0 ${BARS * 9} 80`} preserveAspectRatio="none" className="h-10 w-full">
      {heights.map((h, i) => (
        <rect key={i} x={i * 9 + 1.5} y={(80 - h) / 2} width={7} height={h} rx={3.5}
          fill="#F9C0BB" opacity={0.4 + (h / 64) * 0.55} />
      ))}
    </svg>
  );
}

// Static preview cards — display only, no interactivity
const CARDS = [
  {
    id: "c1",
    rotate: "-6deg", translateY: "0px", translateX: "-20px", zIndex: 1,
    audio: false,
    image: "https://picsum.photos/seed/FRG-2025-018/600/300",
    source: "Parent Journal", date: "Jan 2025",
    title: "Name recall after weekend visit",
    excerpt: "Recognized grandmother immediately and said her nickname before being prompted.",
    domain: "Memory", dot: "#9E6B6B",
  },
  {
    id: "c2",
    rotate: "3deg", translateY: "-30px", translateX: "10px", zIndex: 3,
    audio: true,
    image: null,
    source: "Voice Memo", date: "Nov 2025",
    title: "Morning greeting clip",
    excerpt: "Correct greeting of father and repetition of dog, car, and outside during morning routine.",
    domain: "Speech", dot: "#C4704A",
  },
  {
    id: "c3",
    rotate: "-2deg", translateY: "20px", translateX: "30px", zIndex: 2,
    audio: false,
    image: "https://picsum.photos/seed/FRG-2026-039/600/300",
    source: "Forum Post", date: "Feb 2026",
    title: "Night routine post",
    excerpt: "Two consecutive weeks with only brief waking and faster return to sleep.",
    domain: "Sleep", dot: "#C7B7A7",
  },
];

function PreviewCard({ card }: { card: typeof CARDS[number] }) {
  return (
    <div
      className="absolute w-64 overflow-hidden rounded-[1.3rem] border border-stone/25 bg-white shadow-paper"
      style={{
        transform: `rotate(${card.rotate}) translateY(${card.translateY}) translateX(${card.translateX})`,
        zIndex: card.zIndex,
      }}
    >
      {/* Image / waveform */}
      <div className="relative h-28 w-full overflow-hidden">
        {card.audio ? (
          <div className="flex h-full w-full items-center px-3"
            style={{ background: "linear-gradient(135deg, #F9C0BB 0%, #F3D8D2 70%, #FBF6F1 100%)" }}>
            <Waveform />
          </div>
        ) : (
          <>
            <img src={card.image!} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent" />
            <div className="absolute inset-0 opacity-20" style={{ background: card.dot }} />
          </>
        )}
        <div className="absolute right-2.5 top-2.5 rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] text-slate/50 backdrop-blur-sm">
          {card.date}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate/40">{card.source}</p>
        <p className="mt-1.5 font-display text-base leading-snug text-slate">{card.title}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate/50">{card.excerpt}</p>
        <div className="mt-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
            style={{ background: `${card.dot}18`, color: card.dot, border: `1px solid ${card.dot}35` }}
          >
            <span className="h-1 w-1 rounded-full" style={{ background: card.dot }} />
            {card.domain}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main
      className="relative flex min-h-screen overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top left, rgba(249,192,187,0.35) 0%, transparent 55%), linear-gradient(160deg, #FBF6F1 0%, #EDE3D4 100%)",
      }}
    >
      {/* ── Left: Hero ── */}
      <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-10 lg:px-16 lg:py-14">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <span className="font-display text-xl italic tracking-[-0.02em] text-slate">PiecesOfThem</span>
          <span className="h-3.5 w-px bg-stone/40" />
          <span className="font-sans text-xs uppercase tracking-[0.22em] text-slate/40">Evidence Workbench</span>
        </div>

        {/* Hero text */}
        <div className="max-w-xl py-16">
          {/* Countdown */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/8 px-4 py-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
            <span className="text-xs font-medium text-terracotta">{DAYS_TO_DEADLINE} days to Sep 19, 2026</span>
          </div>

          <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] text-slate lg:text-7xl">
            The stories the FDA isn&apos;t reading.
          </h1>

          <p className="font-newsreader mt-7 max-w-md text-lg leading-8 text-slate/60" style={{ fontStyle: "italic" }}>
            A child remembered her grandmother&apos;s voice. A father heard his son say his name
            again. These moments don&apos;t show up in clinical reports — but they should.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/case/demo-child-a"
              className="font-sans rounded-full bg-slate px-7 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-charcoal"
            >
              Open Workbench
            </Link>
            <Link
              href="/report/demo-child-a"
              className="font-sans rounded-full border border-stone/45 bg-white/60 px-7 py-3.5 text-sm text-slate/65 transition hover:border-stone/65 hover:bg-white/80 hover:text-slate"
            >
              View Evidence Brief
            </Link>
          </div>

          {/* Mini stats */}
          <div className="mt-12 flex gap-8 border-t border-stone/25 pt-8">
            {[
              { value: "13+", label: "Pieces collected" },
              { value: "5", label: "Signal domains" },
              { value: "+42%", label: "Retention delta" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-3xl text-slate">{value}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-slate/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs uppercase tracking-[0.22em] text-slate/30">
          Sanfilippo MPS IIIA · UX111 · FDA PDUFA Sep 19 2026
        </p>
      </div>

      {/* ── Right: Floating card preview ── */}
      <div className="relative hidden w-[45%] items-center justify-center lg:flex">
        {/* Glow behind cards */}
        <div
          className="absolute h-[420px] w-[420px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(249,192,187,0.8) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(196,112,74,0.6) 0%, transparent 70%)" }}
        />

        {/* Card stack */}
        <div className="relative h-[380px] w-[300px]">
          {CARDS.map(card => (
            <PreviewCard key={card.id} card={card} />
          ))}
        </div>

        {/* "FDA translation" label */}
        <div className="absolute bottom-14 right-12 flex items-center gap-2 rounded-full border border-sage/30 bg-white/70 px-4 py-2 shadow-whisper backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-sage" />
          <span className="text-xs text-slate/60">Each piece maps to an FDA metric</span>
        </div>
      </div>
    </main>
  );
}
