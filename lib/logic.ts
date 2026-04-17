import { demoCase } from "@/lib/data";
import type { Claim, EvidenceFragment, SignalDomain } from "@/lib/types";

const domainKeywords: Record<SignalDomain, string[]> = {
  vocabulary: ["vocabulary", "word", "noun", "phrase", "lexicon", "objects"],
  recognition: ["recognition", "voice", "family", "caregiver", "memory", "nickname"],
  sleep: ["sleep", "night", "waking", "bedtime", "routine"],
  behavior: ["behavior", "irritability", "calming", "routine"],
  motor: ["motor", "spoon", "fork", "cup", "sequencing"],
};

export function getCaseBundle(caseId: string) {
  if (caseId !== demoCase.caseRecord.id) {
    return null;
  }

  return demoCase;
}

export function getFragments(
  caseId: string,
  domain?: SignalDomain,
  year?: string,
  query?: string,
) {
  const bundle = getCaseBundle(caseId);

  if (!bundle) {
    return [];
  }

  const normalizedQuery = query?.toLowerCase().trim();

  return bundle.fragments
    .filter((fragment) => !domain || fragment.signalDomain === domain || fragment.tags.includes(domain))
    .filter((fragment) => !year || fragment.date.startsWith(year))
    .map((fragment) => ({
      fragment,
      score: scoreFragment(fragment, domain, normalizedQuery),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.fragment.date.localeCompare(b.fragment.date);
    })
    .map(({ fragment }) => fragment);
}

function scoreFragment(
  fragment: EvidenceFragment,
  domain?: SignalDomain,
  normalizedQuery?: string,
) {
  let score = 0;

  if (domain && (fragment.signalDomain === domain || fragment.tags.includes(domain))) {
    score += 5;
  }

  if (normalizedQuery) {
    const queryTerms = normalizedQuery.split(/\s+/);
    const haystack = `${fragment.title} ${fragment.excerpt} ${fragment.tags.join(" ")}`.toLowerCase();
    const termMatches = queryTerms.filter((term) => haystack.includes(term)).length;
    score += termMatches * 2;
  }

  const keywordBonus = domain
    ? domainKeywords[domain].filter((keyword) => {
        const haystack = `${fragment.excerpt} ${fragment.tags.join(" ")}`.toLowerCase();
        return haystack.includes(keyword);
      }).length
    : 0;

  score += keywordBonus;
  score += fragment.confidence === "high" ? 1 : 0;

  return score;
}

export function getClaims(caseId: string, domain?: SignalDomain): Claim[] {
  const bundle = getCaseBundle(caseId);

  if (!bundle) {
    return [];
  }

  if (!domain) {
    return bundle.claims;
  }

  return bundle.claims.filter((claim) => claim.domain === domain);
}

export function getReportPayload(caseId: string) {
  const bundle = getCaseBundle(caseId);

  if (!bundle) {
    return null;
  }

  const metrics = {
    fragmentCount: bundle.fragments.length,
    claimCount: bundle.claims.length,
    modalities: Array.from(new Set(bundle.fragments.map((fragment) => fragment.sourceType))).length,
    domains: Array.from(new Set(bundle.fragments.map((fragment) => fragment.signalDomain))).length,
  };

  return {
    ...bundle.caseRecord,
    metrics,
    claims: bundle.claims.map((claim) => ({
      ...claim,
      citations: bundle.fragments.filter((fragment) => claim.fragmentIds.includes(fragment.id)),
    })),
  };
}
