import { NextRequest, NextResponse } from "next/server";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function POST(req: NextRequest) {
  const { query, fragments } = await req.json() as {
    query: string;
    fragments: { id: string; title: string; excerpt: string }[];
  };
  const apiKey = process.env.OPENAI_API_KEY;

  if (!query.trim() || fragments.length === 0) {
    return NextResponse.json({ ranked: [] });
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  // Embed query + every fragment in one batch call
  const texts = [
    query,
    ...fragments.map(f => `${f.title}. ${f.excerpt}`),
  ];

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `Embedding request failed: ${errorText}` },
      { status: response.status },
    );
  }

  const payload = await response.json() as {
    data: Array<{ embedding: number[] }>;
  };

  // OpenAI returns embeddings in the same order as input
  const queryEmbedding = payload.data[0]?.embedding ?? [];
  const fragmentEmbeddings = payload.data.slice(1).map((datum) => datum.embedding);

  const ranked = fragments
    .map((f, i) => ({
      id: f.id,
      score: cosineSimilarity(queryEmbedding, fragmentEmbeddings[i]),
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ ranked });
}
