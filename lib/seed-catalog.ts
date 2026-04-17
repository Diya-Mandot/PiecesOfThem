// Keep data/seed-catalog.json in sync with this catalog for the local Python ingestion pipeline.
import { publicSourcePipelineNotes, publicSourceSeeds } from "@/lib/public-source-seeds";
import { trialParticipantSeedNotes, trialParticipantSeeds } from "@/lib/trial-participant-seeds";

export type SeedCatalogKind = "public-source" | "trial-participant";

export type SeedCatalogRisk = "low" | "medium" | "high";

export type SeedCatalogConfidence =
  | "confirmed"
  | "likely-anonymized"
  | "aggregate-only"
  | "public-source";

export type SeedCatalogDomain =
  | "diagnosis-journey"
  | "speech-language"
  | "memory-recognition"
  | "sleep"
  | "behavior"
  | "mobility"
  | "seizures"
  | "grief-bereavement"
  | "care-burden"
  | "treatment-advocacy";

export type SeedCatalogRecord = {
  id: string;
  kind: SeedCatalogKind;
  label: string;
  sourceUrls: string[];
  platform: string;
  access: "public";
  subjectLabel: string | null;
  childAgeSignal: "unknown" | "child";
  diseaseSubtype: "MPS IIIA" | "MPS IIIB" | "unknown";
  trialProgram: string | null;
  interventionClass: "gene-therapy" | "enzyme-replacement" | null;
  sourceConfidence: SeedCatalogConfidence;
  namedPublicly: boolean;
  confirmedParticipation: boolean;
  sourceType: string;
  authorRole: string;
  symptomDomains: SeedCatalogDomain[];
  temporalSignal: string;
  extractionValue: "high" | "medium";
  scrapeDifficulty: SeedCatalogRisk;
  consentRisk: SeedCatalogRisk;
  comparisonUse: "primary" | "secondary" | null;
  evidenceSummary: string;
  outcomeSignals: string[];
  notes: string;
};

export const seedCatalog: SeedCatalogRecord[] = [
  ...publicSourceSeeds.map<SeedCatalogRecord>((seed) => ({
    id: seed.id,
    kind: "public-source",
    label: seed.title,
    sourceUrls: [seed.sourceUrl],
    platform: seed.platform,
    access: seed.access,
    subjectLabel: null,
    childAgeSignal: seed.childAgeSignal,
    diseaseSubtype: "unknown",
    trialProgram: null,
    interventionClass: null,
    sourceConfidence: "public-source",
    namedPublicly: false,
    confirmedParticipation: false,
    sourceType: seed.sourceType,
    authorRole: seed.authorRole,
    symptomDomains: seed.symptomDomains,
    temporalSignal: seed.temporalSignal,
    extractionValue: seed.extractionValue,
    scrapeDifficulty: seed.scrapeDifficulty,
    consentRisk: seed.consentRisk,
    comparisonUse: null,
    evidenceSummary:
      "Publicly accessible caregiver, nonprofit, newsroom, or community source suitable for discovery and narrative-extraction prototyping.",
    outcomeSignals: [],
    notes: seed.notes,
  })),
  ...trialParticipantSeeds.map<SeedCatalogRecord>((seed) => ({
    id: seed.id,
    kind: "trial-participant",
    label: seed.childLabel,
    sourceUrls: seed.sourceUrls,
    platform: "multi-source",
    access: "public",
    subjectLabel: seed.namedPublicly ? seed.childLabel : null,
    childAgeSignal: "child",
    diseaseSubtype: seed.subtype,
    trialProgram: seed.trialProgram,
    interventionClass: seed.interventionClass,
    sourceConfidence: seed.sourceConfidence,
    namedPublicly: seed.namedPublicly,
    confirmedParticipation: seed.confirmedParticipation,
    sourceType: "trial-linked-public-story",
    authorRole: "mixed",
    symptomDomains: deriveDomains(seed.outcomeSignals),
    temporalSignal: "longitudinal",
    extractionValue: "high",
    scrapeDifficulty: "medium",
    consentRisk: seed.namedPublicly ? "medium" : "high",
    comparisonUse: seed.comparisonUse,
    evidenceSummary: seed.participationEvidence,
    outcomeSignals: seed.outcomeSignals,
    notes: seed.notes,
  })),
];

export const seedCatalogNotes = {
  intendedUse:
    "Single normalized ingestion schema for public discovery sources and trial-linked participant sources.",
  publicSourceNotes: publicSourcePipelineNotes,
  trialParticipantNotes: trialParticipantSeedNotes,
};

function deriveDomains(outcomeSignals: string[]): SeedCatalogDomain[] {
  const joined = outcomeSignals.join(" ").toLowerCase();
  const domains = new Set<SeedCatalogDomain>();

  if (
    joined.includes("read") ||
    joined.includes("speech") ||
    joined.includes("communication") ||
    joined.includes("non-verbal")
  ) {
    domains.add("speech-language");
  }

  if (joined.includes("sleep")) {
    domains.add("sleep");
  }

  if (
    joined.includes("peer") ||
    joined.includes("behavior") ||
    joined.includes("social") ||
    joined.includes("play")
  ) {
    domains.add("behavior");
  }

  if (
    joined.includes("survival") ||
    joined.includes("follow-up") ||
    joined.includes("diagnosis")
  ) {
    domains.add("diagnosis-journey");
  }

  if (
    joined.includes("fork") ||
    joined.includes("softball") ||
    joined.includes("walking") ||
    joined.includes("motor")
  ) {
    domains.add("mobility");
  }

  if (joined.includes("neurocognitive") || joined.includes("cognitive")) {
    domains.add("memory-recognition");
  }

  if (domains.size === 0) {
    domains.add("treatment-advocacy");
  }

  return Array.from(domains);
}
