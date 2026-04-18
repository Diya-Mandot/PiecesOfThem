import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  if (!query.trim() || fragments.length === 0) {
    return NextResponse.json({ ranked: [] });
  }

  // Embed query + every fragment in one batch call
  const texts = [
    query,
    ...fragments.map(f => `${f.title}. ${f.excerpt}`),
  ];

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  // OpenAI returns embeddings in the same order as input
  const queryEmbedding = response.data[0].embedding;
  const fragmentEmbeddings = response.data.slice(1).map(d => d.embedding);

  const ranked = fragments
    .map((f, i) => ({
      id: f.id,
      score: cosineSimilarity(queryEmbedding, fragmentEmbeddings[i]),
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ ranked });
}
