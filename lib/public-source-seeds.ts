export type PublicSourceSeed = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType:
    | "nonprofit-family-story"
    | "caregiver-column"
    | "fundraiser"
    | "social-link-hub"
    | "news-video"
    | "reddit-post";
  authorRole: "parent" | "caregiver" | "family-foundation" | "newsroom";
  platform: string;
  access: "public";
  childAgeSignal: "unknown" | "child";
  symptomDomains: Array<
    | "diagnosis-journey"
    | "speech-language"
    | "memory-recognition"
    | "sleep"
    | "behavior"
    | "mobility"
    | "seizures"
    | "grief-bereavement"
    | "care-burden"
    | "treatment-advocacy"
  >;
  temporalSignal:
    | "longitudinal"
    | "snapshot"
    | "retrospective"
    | "post-loss-reflection";
  scrapeDifficulty: "low" | "medium" | "high";
  consentRisk: "low" | "medium" | "high";
  extractionValue: "high" | "medium";
  notes: string;
};

export const publicSourceSeeds: PublicSourceSeed[] = [
  {
    id: "PSS-001",
    title: "Every Family Has a Story",
    sourceUrl:
      "https://curesanfilippofoundation.org/meet-the-families/every-family-has-a-story/",
    sourceType: "nonprofit-family-story",
    authorRole: "family-foundation",
    platform: "Cure Sanfilippo Foundation",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "treatment-advocacy", "care-burden"],
    temporalSignal: "longitudinal",
    scrapeDifficulty: "low",
    consentRisk: "medium",
    extractionValue: "high",
    notes:
      "Best used as a discovery hub for named family stories and linked campaigns; likely contains repeated advocacy language plus parent-authored milestones.",
  },
  {
    id: "PSS-002",
    title: "Team Sanfilippo community stories hub",
    sourceUrl: "https://teamsanfilippo.org/",
    sourceType: "nonprofit-family-story",
    authorRole: "family-foundation",
    platform: "Team Sanfilippo",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "speech-language", "behavior", "sleep"],
    temporalSignal: "longitudinal",
    scrapeDifficulty: "medium",
    consentRisk: "medium",
    extractionValue: "high",
    notes:
      "Useful for collecting family narratives with disease progression and treatment advocacy references; likely needs page-level parsing rather than a single scrape.",
  },
  {
    id: "PSS-003",
    title: "Lindquist's Story",
    sourceUrl: "https://teamsanfilippo.org/community-news/lindquists-story/",
    sourceType: "nonprofit-family-story",
    authorRole: "parent",
    platform: "Team Sanfilippo",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "behavior", "sleep", "seizures", "care-burden"],
    temporalSignal: "retrospective",
    scrapeDifficulty: "low",
    consentRisk: "medium",
    extractionValue: "high",
    notes:
      "Rich long-form narrative with progression clues and event chronology; a good benchmark page for extraction prompts and milestone tagging.",
  },
  {
    id: "PSS-004",
    title: "Saving Liv columnist archive",
    sourceUrl: "https://sanfilipponews.com/saving-liv-erin-stoop/",
    sourceType: "caregiver-column",
    authorRole: "parent",
    platform: "Sanfilippo News",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: [
      "speech-language",
      "memory-recognition",
      "behavior",
      "care-burden",
      "treatment-advocacy",
    ],
    temporalSignal: "longitudinal",
    scrapeDifficulty: "medium",
    consentRisk: "medium",
    extractionValue: "high",
    notes:
      "High-value caregiver-authored archive with repeated updates over time; likely strong for baseline-vs-current comparisons and extracting parent phrasing.",
  },
  {
    id: "PSS-005",
    title: "Saving Liv fundraiser",
    sourceUrl: "https://www.gofundme.com/f/pvzfz-saving-liv",
    sourceType: "fundraiser",
    authorRole: "parent",
    platform: "GoFundMe",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "treatment-advocacy", "care-burden"],
    temporalSignal: "snapshot",
    scrapeDifficulty: "medium",
    consentRisk: "high",
    extractionValue: "medium",
    notes:
      "Good for account discovery and advocacy framing, but fundraiser pages can contain highly identifiable family details and should stay outside any production evidence set.",
  },
  {
    id: "PSS-006",
    title: "Cure Sanfilippo Foundation Saving Liv page",
    sourceUrl: "https://curesanfilippofoundation.org/savingliv/",
    sourceType: "nonprofit-family-story",
    authorRole: "family-foundation",
    platform: "Cure Sanfilippo Foundation",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "treatment-advocacy", "care-burden"],
    temporalSignal: "snapshot",
    scrapeDifficulty: "low",
    consentRisk: "medium",
    extractionValue: "medium",
    notes:
      "A structured advocacy page that can anchor family identity resolution across linked public sources without needing direct social scraping first.",
  },
  {
    id: "PSS-007",
    title: "Haidyn's Hope link hub",
    sourceUrl: "https://linktr.ee/HaidynsHope",
    sourceType: "social-link-hub",
    authorRole: "parent",
    platform: "Linktree",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["treatment-advocacy", "care-burden"],
    temporalSignal: "snapshot",
    scrapeDifficulty: "low",
    consentRisk: "high",
    extractionValue: "medium",
    notes:
      "Useful as a public pointer set to discover official family-controlled accounts, but downstream platform scraping should be treated as fragile and higher-risk.",
  },
  {
    id: "PSS-008",
    title: "Abby's Alliance link hub",
    sourceUrl: "https://linktr.ee/abbysalliance",
    sourceType: "social-link-hub",
    authorRole: "parent",
    platform: "Linktree",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["treatment-advocacy", "care-burden"],
    temporalSignal: "snapshot",
    scrapeDifficulty: "low",
    consentRisk: "high",
    extractionValue: "medium",
    notes:
      "Another discovery seed for public account mapping; valuable for exploration, but not ideal as direct evidence because the hub itself has limited narrative depth.",
  },
  {
    id: "PSS-009",
    title: "WXYZ family story video",
    sourceUrl: "https://www.youtube.com/watch?v=rpdnGknhDds",
    sourceType: "news-video",
    authorRole: "newsroom",
    platform: "YouTube",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["diagnosis-journey", "speech-language", "memory-recognition", "treatment-advocacy"],
    temporalSignal: "snapshot",
    scrapeDifficulty: "medium",
    consentRisk: "medium",
    extractionValue: "high",
    notes:
      "A strong prototype source for transcript ingestion, quote alignment, and multimodal lineage because newsroom videos often have clearer metadata and machine-readable captions.",
  },
  {
    id: "PSS-010",
    title: "Reddit caregiver loss post in daddit",
    sourceUrl:
      "https://www.reddit.com/r/daddit/comments/uecpgj/one_year_anniversary_of_the_loss_of_my_son/",
    sourceType: "reddit-post",
    authorRole: "parent",
    platform: "Reddit",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["grief-bereavement", "care-burden", "diagnosis-journey"],
    temporalSignal: "post-loss-reflection",
    scrapeDifficulty: "medium",
    consentRisk: "high",
    extractionValue: "medium",
    notes:
      "Useful for testing parent-voice extraction and support-community language, but grief content and direct identifiers make it unsuitable for anything beyond tightly controlled prototyping.",
  },
  {
    id: "PSS-011",
    title: "Reddit caregiver grief post in GriefSupport",
    sourceUrl:
      "https://www.reddit.com/r/GriefSupport/comments/1r4jhf9/i_took_a_job_at_a_school_to_be_more_available_to/",
    sourceType: "reddit-post",
    authorRole: "parent",
    platform: "Reddit",
    access: "public",
    childAgeSignal: "child",
    symptomDomains: ["grief-bereavement", "care-burden", "diagnosis-journey"],
    temporalSignal: "post-loss-reflection",
    scrapeDifficulty: "medium",
    consentRisk: "high",
    extractionValue: "medium",
    notes:
      "Another public parent-voice example for classifier and taxonomy testing, with strong caution around sensitive bereavement language and re-identification risk.",
  },
];

export const publicSourcePipelineNotes = {
  intendedUse:
    "Seed list for hackathon exploration of consent-aware source discovery and narrative-to-evidence extraction.",
  doNotUseFor:
    "Private groups, login-gated forums, or production evidence generation without explicit consent review and de-identification.",
  recommendedStart:
    [
      "Prioritize nonprofit story pages and newsroom transcripts first.",
      "Use social hubs only for account discovery, not as evidence.",
      "Treat fundraiser and grief-community content as high-risk sources.",
    ] as const,
};
