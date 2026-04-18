import type { GetReportResponse, GetTrajectoryResponse } from "@shared/api";
import type {
  CaseBundle,
  Claim,
  ClaimProvenance,
  EvidenceFragment,
  EvidenceProvenance,
  ReportReadiness,
} from "@shared/types";

import { kpis, trajectoryPoints } from "@/lib/chart-data";

type RawCaseRecord = Omit<CaseBundle["caseRecord"], "provenanceSummary" | "reportReadiness">;
type RawFragment = Omit<EvidenceFragment, "provenance">;
type RawClaim = Omit<Claim, "provenance">;
type RawCaseBundle = {
  caseRecord: RawCaseRecord;
  fragments: RawFragment[];
  claims: RawClaim[];
};

const rawDemoFallbackBundle: RawCaseBundle = {
  caseRecord: {
    id: "demo-child-a",
    label: "Case A-17",
    disease: "Sanfilippo Syndrome Type A",
    therapy: "UX111 observational evidence brief",
    observationStart: "2024-03-08",
    observationEnd: "2026-02-11",
    reviewWindow: "FDA resubmission accepted April 2, 2026. PDUFA date September 19, 2026.",
    summary:
      "A de-identified observational case assembled from caregiver-style fragments to demonstrate how lived experience can surface functional stability signals over time.",
    dataHandling:
      "Demo records are synthetic or de-identified and rendered locally to avoid restricted-data handling in the hackathon build.",
  },
  fragments: [
    {
      id: "FRG-2024-031",
      caseId: "demo-child-a",
      date: "2024-03-08",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Breakfast naming routine",
      excerpt:
        "Breakfast used to be quiet because we were never sure what words would still be there from one week to the next. This morning he pointed to the spoon, then the bowl, then the dog out the window and said each one clearly before I asked. He also asked for juice on his own. The only place he hesitated was his sister's name, and even then he got there after one soft prompt instead of losing the thread entirely.",
      tags: ["vocabulary", "objects", "family"],
      signalDomain: "vocabulary",
      deidentified: true,
      confidence: "high",
      rawRef: "Journal / March 2024 / Entry 03",
    },
    {
      id: "FRG-2024-067",
      caseId: "demo-child-a",
      date: "2024-05-18",
      sourceType: "Voice Memo",
      modality: "audio-transcript",
      title: "Playroom voice memo",
      excerpt:
        "Transcript records spontaneous use of four animal words and one two-word phrase during floor play.",
      tags: ["vocabulary", "play", "phrase length"],
      signalDomain: "vocabulary",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Voice memo transcript / May 2024",
    },
    {
      id: "FRG-2024-114",
      caseId: "demo-child-a",
      date: "2024-08-03",
      sourceType: "Clinic Summary",
      modality: "summary",
      title: "Neurodevelopment follow-up",
      excerpt:
        "Family reports recognition of primary caregivers remains intact. Child initiates eye contact and responds to own nickname consistently.",
      tags: ["recognition", "caregiver", "social"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Clinic summary / August 2024",
    },
    {
      id: "FRG-2024-162",
      caseId: "demo-child-a",
      date: "2024-11-27",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Sleep pattern update",
      excerpt:
        "For most of the year we were up almost every night and could never tell whether bedtime would become a full meltdown by 2 a.m. or 4 a.m. Over the last month we have started getting three full nights of sleep most weeks instead of one. Even on the harder nights, he settles faster and seems less disoriented when he wakes.",
      tags: ["sleep", "night waking", "routine"],
      signalDomain: "sleep",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Forum paraphrase / November 2024",
    },
    {
      id: "FRG-2025-018",
      caseId: "demo-child-a",
      date: "2025-01-20",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Name recall after weekend visit",
      excerpt:
        "Recognized grandmother immediately and said her nickname before being prompted.",
      tags: ["recognition", "family", "memory"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Journal / January 2025 / Entry 05",
    },
    {
      id: "FRG-2025-051",
      caseId: "demo-child-a",
      date: "2025-03-14",
      sourceType: "Caregiver Transcript",
      modality: "audio-transcript",
      title: "Bedtime conversation transcript",
      excerpt:
        "The transcript from bedtime is simple, but that is exactly why it matters. He still uses the small words that make up his routine: blanket, moon, book, mama, done. They come in the same order they used to, almost like he is following a path his brain still remembers even when other things feel less stable.",
      tags: ["vocabulary", "bedtime", "retained lexicon"],
      signalDomain: "vocabulary",
      deidentified: true,
      confidence: "high",
      rawRef: "Transcript / March 2025 / Segment 11",
    },
    {
      id: "FRG-2025-093",
      caseId: "demo-child-a",
      date: "2025-06-02",
      sourceType: "Clinic Summary",
      modality: "summary",
      title: "Behavioral snapshot",
      excerpt:
        "Irritability is present but family reports a stable calming routine and fewer prolonged overnight episodes.",
      tags: ["behavior", "sleep", "routine"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Clinic summary / June 2025",
    },
    {
      id: "FRG-2025-128",
      caseId: "demo-child-a",
      date: "2025-08-19",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Meal-time object use",
      excerpt:
        "Lunch is one of the places where the difference between losing a skill and holding onto it becomes very visible. He still reaches for the spoon and cup without confusion and recognizes both by name when we ask. The fork is harder now because the sequence is more complicated, but the object itself is still familiar to him, which feels important.",
      tags: ["vocabulary", "motor", "objects"],
      signalDomain: "motor",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Journal / August 2025 / Entry 22",
    },
    {
      id: "FRG-2025-171",
      caseId: "demo-child-a",
      date: "2025-11-06",
      sourceType: "Voice Memo",
      modality: "audio-transcript",
      title: "Morning greeting clip",
      excerpt:
        "Transcript captures correct greeting of father and repetition of dog, car, and outside during morning routine.",
      tags: ["vocabulary", "recognition", "daily routine"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Voice memo transcript / November 2025",
    },
    {
      id: "FRG-2025-188",
      caseId: "demo-child-a",
      date: "2025-12-14",
      sourceType: "Caregiver Transcript",
      modality: "audio-transcript",
      title: "Favorite song request",
      excerpt:
        "On the drive home he asked for his favorite song by name from the back seat, clearly and without anyone setting it up. We both went quiet because we had not heard a spontaneous song request in about eight months. It was such a small sentence, but it felt enormous because it meant the connection was still there: the song, the memory of it, and the language needed to ask for it.",
      tags: ["vocabulary", "music", "spontaneous speech"],
      signalDomain: "vocabulary",
      deidentified: true,
      confidence: "high",
      rawRef: "Transcript / December 2025 / Segment 09",
    },
    {
      id: "FRG-2026-013",
      caseId: "demo-child-a",
      date: "2026-01-12",
      sourceType: "Clinic Summary",
      modality: "summary",
      title: "Winter clinic review",
      excerpt:
        "Caregiver continues to report preserved recognition of primary family members and stable response to favorite songs.",
      tags: ["recognition", "music", "caregiver"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Clinic summary / January 2026",
    },
    {
      id: "FRG-2026-024",
      caseId: "demo-child-a",
      date: "2026-01-28",
      sourceType: "Caregiver Transcript",
      modality: "audio-transcript",
      title: "Kitchen transcript",
      excerpt:
        "Used six familiar nouns across a five-minute transcript with no observed reduction from last spring's home recordings.",
      tags: ["vocabulary", "noun count", "comparison"],
      signalDomain: "vocabulary",
      deidentified: true,
      confidence: "high",
      rawRef: "Transcript / January 2026 / Segment 02",
    },
    {
      id: "FRG-2026-031",
      caseId: "demo-child-a",
      date: "2026-02-02",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Photo-book recognition",
      excerpt:
        "We sat with the family photo book after dinner because that has become one of the gentlest ways to check what is still intact without turning it into a test. He moved through the pages and pointed to mom, dad, and grandma without prompting. He took longer with the older pictures and studied them more carefully, but he still landed on the right names in the end instead of drifting away from the memory.",
      tags: ["recognition", "family", "photo book"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Journal / February 2026 / Entry 02",
    },
    {
      id: "FRG-2026-039",
      caseId: "demo-child-a",
      date: "2026-02-11",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Night routine post",
      excerpt:
        "Reported two consecutive weeks with only brief waking and faster return to sleep after reassurance.",
      tags: ["sleep", "night waking", "stability"],
      signalDomain: "sleep",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Forum paraphrase / February 2026",
    },
    {
      id: "FRG-2026-041",
      caseId: "demo-child-a",
      date: "2026-02-11",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Recognition check during visit",
      excerpt:
        "Turned toward aunt's voice immediately and smiled when favorite stuffed dog was named.",
      tags: ["recognition", "voice", "objects"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Journal / February 2026 / Entry 04",
    },
    {
      id: "FRG-2026-053",
      caseId: "demo-child-a",
      date: "2026-02-24",
      sourceType: "Clinic Summary",
      modality: "summary",
      title: "Function preserved in routines",
      excerpt:
        "Compared with the prior quarter, the family is reporting fewer new losses than they were bracing for. He still anticipates the snack routine before it starts, turns when his name is called, and reaches for familiar objects on cue instead of staring past them. None of these things look dramatic in isolation, but taken together they make the family feel like the decline has at least slowed enough to be noticed in everyday life.",
      tags: ["behavior", "recognition", "routine stability"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "high",
      rawRef: "Clinic summary / February 2026",
    },
    {
      id: "FRG-2026-061",
      caseId: "demo-child-a",
      date: "2026-03-06",
      sourceType: "Voice Memo",
      modality: "audio-transcript",
      title: "Morning greeting sequence",
      excerpt:
        "The home recording from this morning captures a sequence we have seen enough times now that it no longer feels accidental. He says mama, points toward the dog, and repeats outside while moving to the door without any cueing. It is ordinary family life, but that is exactly the point. The routine is still organized inside him well enough to come out in the right order.",
      tags: ["vocabulary", "routine", "motor initiation"],
      signalDomain: "motor",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Voice memo transcript / March 2026",
    },
    {
      id: "FRG-2026-072",
      caseId: "demo-child-a",
      date: "2026-03-18",
      sourceType: "Parent Journal",
      modality: "text",
      title: "Recognized the old joke again",
      excerpt:
        "My husband did the same silly sneeze joke he has done for years and, for the first time in a while, our son laughed before the punchline finished. That reaction matters to us because it means he is not just hearing sound. He is anticipating the pattern, remembering what comes next, and meeting us there in real time.",
      tags: ["recognition", "memory", "family routine"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "Journal / March 2026 / Entry 11",
    },
    {
      id: "FRG-2026-084",
      caseId: "demo-child-a",
      date: "2026-04-02",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Public update after clinic week",
      excerpt:
        "I do not want to overstate anything, because every week still has hard parts, but this month felt different in a way I can actually describe. We had more moments where he seemed present inside the routine of the house instead of being carried through it. He reached for the right shoes when we said outside, found his blanket at bedtime, and answered to his nickname more than once in the same day.",
      tags: ["behavior", "routine", "recognition"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "moderate",
      rawRef: "Forum paraphrase / April 2026",
    },

    // ── Real-world source: curesanfilippofoundation.org / Aug 24 2020
    // "A Year After Going Public With Son's Sanfilippo Diagnosis" — Marisa Dobbyn (MPS IIIC)
    // Adapted as natural-history cross-subtype reference for the demo case.
    {
      id: "FRG-2020-EXT-001",
      caseId: "demo-child-a",
      date: "2020-08-24",
      sourceType: "Forum Observation",
      modality: "text",
      title: "One year after going public: mother's reflection",
      excerpt:
        "I needed time to process, to grieve, to mourn the loss of what I thought my life would look like before committing fully to the fight ahead. There was no roadmap for this. There was only the decision — every single day — to keep going, because he was still here and still needed us to.",
      tags: ["behavior", "caregiver grief", "advocacy", "1-year post-disclosure"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "high",
      rawRef: "curesanfilippofoundation.org / Aug 24 2020 / Marisa Dobbyn (MPS IIIC — cross-subtype natural history reference)",
    },
    {
      id: "FRG-2020-EXT-002",
      caseId: "demo-child-a",
      date: "2020-08-24",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Community mobilization: unexpected recognition",
      excerpt:
        "What I did not realize was how much Connor — and our family — had impacted so many people. I expected sympathy. What we got was mobilization. People who had never met him showed up. They raised money, they shared the story, they told us our son mattered to them. For a family sitting with an impossible diagnosis, that recognition is its own kind of medicine.",
      tags: ["recognition", "community", "advocacy", "caregiver", "social support"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "curesanfilippofoundation.org / Aug 24 2020 / Marisa Dobbyn (MPS IIIC — cross-subtype natural history reference)",
    },
    {
      id: "FRG-2020-EXT-003",
      caseId: "demo-child-a",
      date: "2020-08-24",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Clinical trial gap: $5M needed, COVID derailing timeline",
      excerpt:
        "We needed five million dollars for a clinical trial and COVID-19 erased the fundraising calendar overnight. Every month without treatment is a month the disease keeps moving. There is a window for gene therapy in Sanfilippo and it does not stay open. The pandemic did not pause the disease — it only paused our ability to fight it.",
      tags: ["behavior", "clinical trial", "funding gap", "COVID", "timeline urgency"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "high",
      rawRef: "curesanfilippofoundation.org / Aug 24 2020 / Marisa Dobbyn (MPS IIIC — cross-subtype natural history reference)",
    },

    // ── Real-world source: thecantoncitizen.com / June 14 2024
    // "Reflections of a Sanfilippo Dad: 5 Years Later" — Mike Dobbyn (MPS IIIC)
    // Adapted as natural-history cross-subtype reference for the demo case.
    {
      id: "FRG-2024-EXT-001",
      caseId: "demo-child-a",
      date: "2024-06-14",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Five-year milestone: still here at fifteen",
      excerpt:
        "We were told early to late teens when he was diagnosed at ten and a half. He is fifteen now and I still cannot say that out loud without something catching in my throat. He still knows our names. He still knows his dog. He still knows the shape of a day. I thought I would spend these years grieving on a schedule we were given, but instead I find myself writing past it — surprised every morning that there is still a morning.",
      tags: ["recognition", "prognosis", "milestone", "caregiver", "5-year"],
      signalDomain: "recognition",
      deidentified: true,
      confidence: "high",
      rawRef: "thecantoncitizen.com / Jun 14 2024 / Mike Dobbyn (MPS IIIC — cross-subtype natural history reference)",
    },
    {
      id: "FRG-2024-EXT-002",
      caseId: "demo-child-a",
      date: "2024-06-14",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Caregiver grief and recovery arc",
      excerpt:
        "The week after the diagnosis I lost fifteen pounds without trying. I stopped sleeping. I was reading research papers at two in the morning and the floor kept dropping out. For months I thought I was keeping it together, but I was mostly disappearing inside it. What pulled me back was not the grief getting smaller — it was finding other fathers who were carrying the same weight and still choosing to fight.",
      tags: ["behavior", "caregiver stress", "grief", "recovery", "peer support"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "high",
      rawRef: "thecantoncitizen.com / Jun 14 2024 / Mike Dobbyn (MPS IIIC — cross-subtype natural history reference)",
    },
    {
      id: "FRG-2024-EXT-003",
      caseId: "demo-child-a",
      date: "2024-06-14",
      sourceType: "Forum Observation",
      modality: "text",
      title: "Clinical trial pursuit — Phoenix Nest",
      excerpt:
        "A woman in Brooklyn had turned her son's diagnosis into a biotech company. I drove there the next day. She explained the gene therapy in plain words — the window, the timeline, what the data showed. I wrote it all down because I needed it to be real and not just something I had read at midnight. I drove home knowing more than I had that morning, and some of it was hard, and some of it finally had a forward direction.",
      tags: ["behavior", "clinical trial", "gene therapy", "advocacy", "UX111"],
      signalDomain: "behavior",
      deidentified: true,
      confidence: "moderate",
      rawRef: "thecantoncitizen.com / Jun 14 2024 / Mike Dobbyn (MPS IIIC — Phoenix Nest / cross-subtype reference)",
    },
  ],
  claims: [
    {
      id: "CLM-VOCAB-STABLE",
      caseId: "demo-child-a",
      statement:
        "Across the observed window, home-language evidence supports preservation of core expressive vocabulary, including spontaneous naming, retained routine words, and context-appropriate requests.",
      domain: "vocabulary",
      trend: "stable",
      confidence: "high",
      fragmentIds: ["FRG-2024-031", "FRG-2025-051", "FRG-2025-188", "FRG-2026-024"],
    },
    {
      id: "CLM-RECOGNITION-STABLE",
      caseId: "demo-child-a",
      statement:
        "Clinic and caregiver evidence consistently indicate preserved recognition of primary caregivers, familiar voices, and recurrent family cues.",
      domain: "recognition",
      trend: "stable",
      confidence: "high",
      fragmentIds: ["FRG-2024-114", "FRG-2025-018", "FRG-2026-013", "FRG-2026-041", "FRG-2026-031", "FRG-2026-072", "FRG-2024-EXT-001", "FRG-2020-EXT-002"],
    },
    {
      id: "CLM-SLEEP-IMPROVING",
      caseId: "demo-child-a",
      statement:
        "Caregiver reports support partial improvement in sleep stability, with more full-night sleep and shorter recovery after waking episodes.",
      domain: "sleep",
      trend: "improving",
      confidence: "moderate",
      fragmentIds: ["FRG-2024-162", "FRG-2025-093", "FRG-2026-039"],
    },
    {
      id: "CLM-ROUTINE-PRESERVED",
      caseId: "demo-child-a",
      statement:
        "Late-window observations support preservation of routine participation, including anticipatory behavior, object association, and guided transitions within familiar household sequences.",
      domain: "behavior",
      trend: "stable",
      confidence: "high",
      fragmentIds: ["FRG-2025-128", "FRG-2026-053", "FRG-2026-061", "FRG-2026-084", "FRG-2024-EXT-002", "FRG-2024-EXT-003", "FRG-2020-EXT-001", "FRG-2020-EXT-003"],
    },
  ],
};

export const demoFallbackBundle: CaseBundle = annotateDemoBundle(rawDemoFallbackBundle);

export const demoFallbackTrajectory: GetTrajectoryResponse = {
  trajectoryPoints,
  kpis,
};

export const demoFallbackReport: GetReportResponse = {
  ...demoFallbackBundle.caseRecord,
  metrics: {
    fragmentCount: demoFallbackBundle.fragments.length,
    claimCount: demoFallbackBundle.claims.length,
    modalities: Array.from(new Set(demoFallbackBundle.fragments.map((fragment) => fragment.sourceType))).length,
    domains: Array.from(new Set(demoFallbackBundle.fragments.map((fragment) => fragment.signalDomain))).length,
    realFragments: demoFallbackBundle.fragments.filter((fragment) => fragment.provenance === "real").length,
    syntheticFragments: demoFallbackBundle.fragments.filter((fragment) => fragment.provenance === "synthetic").length,
    mixedClaims: demoFallbackBundle.claims.filter((claim) => claim.provenance === "mixed").length,
  },
  claims: demoFallbackBundle.claims.map((claim) => ({
    ...claim,
    citations: demoFallbackBundle.fragments.filter((fragment) => claim.fragmentIds.includes(fragment.id)),
  })),
};

function annotateDemoBundle(bundle: RawCaseBundle): CaseBundle {
  const fragments = bundle.fragments.map((fragment) => ({
    ...fragment,
    provenance: deriveFragmentProvenance(fragment.id),
  }));

  const provenanceById = new Map(fragments.map((fragment) => [fragment.id, fragment.provenance]));
  const claims = bundle.claims.map((claim) => ({
    ...claim,
    provenance: deriveClaimProvenance(claim, provenanceById),
  }));
  const reportReadiness = deriveReportReadiness(fragments, claims);

  return {
    caseRecord: {
      ...bundle.caseRecord,
      provenanceSummary: buildProvenanceSummary(fragments, claims),
      reportReadiness,
    },
    fragments,
    claims,
  };
}

function deriveFragmentProvenance(id: string): EvidenceProvenance {
  return "synthetic";
}

function deriveClaimProvenance(
  claim: RawClaim,
  provenanceById: Map<string, EvidenceProvenance>,
): ClaimProvenance {
  const provenance = new Set(
    claim.fragmentIds
      .map((fragmentId) => provenanceById.get(fragmentId))
      .filter((value): value is EvidenceProvenance => Boolean(value)),
  );

  if (provenance.size === 1 && provenance.has("real")) {
    return "real";
  }

  if (provenance.size === 1 && provenance.has("synthetic")) {
    return "synthetic";
  }

  return "mixed";
}

function deriveReportReadiness(
  fragments: EvidenceFragment[],
  claims: Claim[],
): ReportReadiness {
  const fragmentProvenance = new Set<EvidenceProvenance>(fragments.map((fragment) => fragment.provenance));
  const claimProvenance = new Set<ClaimProvenance>(claims.map((claim) => claim.provenance));

  if (fragmentProvenance.size === 1 && fragmentProvenance.has("real") && !claimProvenance.has("mixed")) {
    return "review-ready";
  }

  if (fragmentProvenance.has("synthetic")) {
    return fragmentProvenance.has("real") ? "internal-review" : "demo-only";
  }

  return "internal-review";
}

function buildProvenanceSummary(fragments: EvidenceFragment[], claims: Claim[]) {
  const realFragments = fragments.filter((fragment) => fragment.provenance === "real").length;
  const syntheticFragments = fragments.filter((fragment) => fragment.provenance === "synthetic").length;
  const mixedClaims = claims.filter((claim) => claim.provenance === "mixed").length;

  return `${realFragments} real fragment${realFragments === 1 ? "" : "s"}, ${syntheticFragments} synthetic fragment${syntheticFragments === 1 ? "" : "s"}, ${mixedClaims} mixed claim${mixedClaims === 1 ? "" : "s"}.`;
}
