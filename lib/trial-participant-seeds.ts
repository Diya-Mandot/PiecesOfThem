export type TrialProgram =
  | "UX111-ABO-102"
  | "LYS-SAF302"
  | "OTL-201"
  | "Type-B-ERT-Minnesota"
  | "Type-B-Gene-Therapy-Paris";

export type TrialParticipantSeed = {
  id: string;
  childLabel: string;
  subtype: "MPS IIIA" | "MPS IIIB";
  trialProgram: TrialProgram;
  interventionClass: "gene-therapy" | "enzyme-replacement";
  confirmedParticipation: boolean;
  namedPublicly: boolean;
  sourceConfidence: "confirmed" | "likely-anonymized" | "aggregate-only";
  participationEvidence: string;
  outcomeSignals: string[];
  comparisonUse: "primary" | "secondary";
  sourceUrls: string[];
  notes: string;
};

export const trialParticipantSeeds: TrialParticipantSeed[] = [
  {
    id: "TPS-001",
    childLabel: "Eliza O'Neill",
    subtype: "MPS IIIA",
    trialProgram: "UX111-ABO-102",
    interventionClass: "gene-therapy",
    confirmedParticipation: true,
    namedPublicly: true,
    sourceConfidence: "confirmed",
    participationEvidence:
      "Public sources explicitly identify Eliza O'Neill as the first child treated in the Phase 1/2 Abeona trial that became ABO-102 and later UX111.",
    outcomeSignals: [
      "sleeping through the night",
      "non-verbal communication gains",
      "fork use for eating",
      "survival beyond typical natural-history expectations",
    ],
    comparisonUse: "primary",
    sourceUrls: [
      "https://dnascience.plos.org/2016/05/19/eliza-gets-her-gene-therapy/",
      "https://abcnews.go.com/Health/family-isolated-years-hoping-qualify-daughters-experimental-treatment/story?id=41394212",
      "https://curesanfilippofoundation.org/2024/04/saving-eliza-launched-10-years-ago-eventually-raising-record-setting-2-million-to-cure-sanfilippo-syndrome/",
    ],
    notes:
      "Best named public UX111-linked child for narrative extraction, longitudinal milestone mapping, and baseline-versus-follow-up comparisons.",
  },
  {
    id: "TPS-002",
    childLabel: "Unnamed age-2 higher-dose UX111 child",
    subtype: "MPS IIIA",
    trialProgram: "UX111-ABO-102",
    interventionClass: "gene-therapy",
    confirmedParticipation: true,
    namedPublicly: false,
    sourceConfidence: "likely-anonymized",
    participationEvidence:
      "Public retellings describe another child treated with a higher dose of UX111 at age 2 and report later functional gains, but do not identify the child by name.",
    outcomeSignals: ["reading", "softball participation", "peer social activity"],
    comparisonUse: "primary",
    sourceUrls: [
      "https://dnascience.plos.org/2025/10/23/an-avalanche-of-advances-in-human-genetics/",
      "https://curesanfilippofoundation.org/2025/08/foundations-dr-oneill-publishes-op-ed-in-the-hill-urging-fda-to-act/",
    ],
    notes:
      "High-value UX111 efficacy pattern for comparison logic, but identity is intentionally not public in the source trail I could verify.",
  },
  {
    id: "TPS-003",
    childLabel: "Ornella Aiach",
    subtype: "MPS IIIA",
    trialProgram: "LYS-SAF302",
    interventionClass: "gene-therapy",
    confirmedParticipation: true,
    namedPublicly: true,
    sourceConfidence: "confirmed",
    participationEvidence:
      "Public interviews and articles state that Ornella Aiach received Lysogene's Sanfilippo type A gene therapy in France.",
    outcomeSignals: ["behavioral calming after treatment"],
    comparisonUse: "secondary",
    sourceUrls: [
      "https://psmag.com/news/how-a-former-financial-consultant-built-a-company-to-cure-rare-diseases/",
      "https://dnascience.plos.org/2016/08/18/3-gene-therapy-trials-report-good-news/",
      "https://curesanfilippofoundation.org/2020/03/lys-saf302-gene-therapy/",
    ],
    notes:
      "Strong named non-UX111 gene-therapy comparator for cross-program narrative alignment and early-versus-late treatment framing.",
  },
  {
    id: "TPS-004",
    childLabel: "Will Byers",
    subtype: "MPS IIIB",
    trialProgram: "Type-B-ERT-Minnesota",
    interventionClass: "enzyme-replacement",
    confirmedParticipation: true,
    namedPublicly: true,
    sourceConfidence: "confirmed",
    participationEvidence:
      "A public feature says Will entered a Minnesota Sanfilippo type B clinical trial and received the final enrollment slot for an enzyme replacement study.",
    outcomeSignals: ["early diagnosis leading to trial entry"],
    comparisonUse: "secondary",
    sourceUrls: ["https://dnascience.plos.org/2015/07/16/saving-eliza-campaign-helps-another-child/"],
    notes:
      "Useful non-gene-therapy comparator for distinguishing trial-participation narratives from actual post-treatment functional retention signals.",
  },
  {
    id: "TPS-005",
    childLabel: "Four-child Paris gene-therapy cohort",
    subtype: "MPS IIIB",
    trialProgram: "Type-B-Gene-Therapy-Paris",
    interventionClass: "gene-therapy",
    confirmedParticipation: true,
    namedPublicly: false,
    sourceConfidence: "aggregate-only",
    participationEvidence:
      "Official press materials describe four treated children in a Paris Sanfilippo type B gene-therapy study, but do not publicly name them.",
    outcomeSignals: ["neurocognitive benefit", "30-month follow-up", "treatment tolerability"],
    comparisonUse: "secondary",
    sourceUrls: [
      "https://presse.inserm.fr/en/clinical-trial-launched-to-treat-sanfilippo-b-syndrome-using-gene-therapy/52364/",
      "https://presse.inserm.fr/en/gene-therapy-first-results-in-children-with-sanfilippo-b-syndrome/57645/",
    ],
    notes:
      "Aggregate-only reference set for trial-language parsing and outcome-category mapping when named patient stories are unavailable.",
  },
  {
    id: "TPS-006",
    childLabel: "Five-patient OTL-201 proof-of-concept cohort",
    subtype: "MPS IIIA",
    trialProgram: "OTL-201",
    interventionClass: "gene-therapy",
    confirmedParticipation: true,
    namedPublicly: false,
    sourceConfidence: "aggregate-only",
    participationEvidence:
      "Sponsor and hospital sources describe an early treated cohort for OTL-201 with age-at-dosing and functional outcomes, but not child identities.",
    outcomeSignals: [
      "cognitive gains in line with healthy development",
      "normal speech acquisition in some children",
      "complex play",
    ],
    comparisonUse: "secondary",
    sourceUrls: [
      "https://ir.orchard-tx.com/news-releases/news-release-details/orchard-therapeutics-announces-first-patient-dosed-otl-201-gene",
      "https://mft.nhs.uk/2023/02/24/early-results-of-gene-therapy-trial-for-childhood-dementia-show-promise/",
    ],
    notes:
      "Helpful for broadening cross-trial comparisons around early dosing and preserved development without overstating named-patient provenance.",
  },
];

export const trialParticipantSeedNotes = {
  intendedUse:
    "Structured seed set for hackathon comparison logic between publicly discussed trial participants, anonymized trial cases, and synthetic natural-history baselines.",
  ranking:
    [
      "Use Eliza O'Neill as the primary named UX111-linked anchor.",
      "Use the unnamed higher-dose UX111 child as a secondary efficacy pattern, but never as a named identity.",
      "Treat aggregate cohorts as reference evidence patterns rather than individual patient narratives.",
    ] as const,
  caution:
    "Public stories and press summaries should not be treated as complete trial records; keep provenance, ambiguity, and identity exposure explicit in downstream outputs.",
};
