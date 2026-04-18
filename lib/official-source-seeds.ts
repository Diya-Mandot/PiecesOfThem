export type OfficialSourceSeed = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType:
    | "fda-guidance"
    | "clinicaltrials-study"
    | "company-press-release"
    | "nonprofit-disease-page";
  organization: string;
  access: "public";
  extractionValue: "high" | "medium";
  risk: "low";
  focusAreas: Array<
    | "regulatory-framework"
    | "patient-experience"
    | "clinical-benefit"
    | "natural-history"
    | "biomarker-context"
    | "disease-background"
    | "trial-status"
  >;
  notes: string;
};

export const officialSourceSeeds: OfficialSourceSeed[] = [
  {
    id: "OSS-001",
    title: "CDER Patient-Focused Drug Development",
    sourceUrl: "https://www.fda.gov/drugs/development-approval-process-drugs/cder-patient-focused-drug-development",
    sourceType: "fda-guidance",
    organization: "U.S. Food and Drug Administration",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["regulatory-framework", "patient-experience", "clinical-benefit"],
    notes:
      "Primary FDA context for why caregiver and patient experience data matter in regulatory decision-making.",
  },
  {
    id: "OSS-002",
    title: "FDA Patient-Focused Drug Development Guidance Series",
    sourceUrl:
      "https://www.fda.gov/drugs/development-approval-process-drugs/fda-patient-focused-drug-development-guidance-series-enhancing-incorporation-patients-voice-medical",
    sourceType: "fda-guidance",
    organization: "U.S. Food and Drug Administration",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["regulatory-framework", "patient-experience", "clinical-benefit"],
    notes:
      "Useful for mapping app outputs to FDA language around caregiver input, fit-for-purpose outcome evidence, and review support.",
  },
  {
    id: "OSS-003",
    title: "PFDD Guidance 3: Fit-for-Purpose Clinical Outcome Assessments",
    sourceUrl:
      "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/patient-focused-drug-development-selecting-developing-or-modifying-fit-purpose-clinical-outcome",
    sourceType: "fda-guidance",
    organization: "U.S. Food and Drug Administration",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["regulatory-framework", "clinical-benefit", "patient-experience"],
    notes:
      "Best source for grounding claims about functional benefit, outcome assessment design, and caregiver-observed measures.",
  },
  {
    id: "OSS-004",
    title: "Natural History Study of Biomarkers and Clinical Outcomes in MPS IIIA",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05523206",
    sourceType: "clinicaltrials-study",
    organization: "ClinicalTrials.gov",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["natural-history", "clinical-benefit", "biomarker-context"],
    notes:
      "Useful for defining natural-history comparison language and linking biomarkers to clinical outcome assessments in Sanfilippo type A.",
  },
  {
    id: "OSS-005",
    title: "Ultragenyx Resubmits BLA for UX111 to U.S. FDA",
    sourceUrl: "https://ir.ultragenyx.com/node/18331/html",
    sourceType: "company-press-release",
    organization: "Ultragenyx",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["trial-status", "clinical-benefit", "biomarker-context"],
    notes:
      "Primary source for the January 30, 2026 UX111 resubmission and the company's framing of longer-term neurologic benefit evidence.",
  },
  {
    id: "OSS-006",
    title: "Ultragenyx FDA Acceptance of UX111 Resubmission",
    sourceUrl: "https://ir.ultragenyx.com/static-files/bd6ffc3c-fd43-4717-9a0a-4c778196ae9f",
    sourceType: "company-press-release",
    organization: "Ultragenyx",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["trial-status", "regulatory-framework", "clinical-benefit"],
    notes:
      "Primary source for the April 2, 2026 acceptance and the September 19, 2026 PDUFA date.",
  },
  {
    id: "OSS-007",
    title: "Ultragenyx UX111 2025 Multi-domain Clinical Function Update",
    sourceUrl:
      "https://ir.ultragenyx.com/news-releases/news-release-details/ultragenyx-announces-new-data-demonstrating-treatment-ux111-aav",
    sourceType: "company-press-release",
    organization: "Ultragenyx",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["clinical-benefit", "biomarker-context", "trial-status"],
    notes:
      "Useful for extracting language on cognition, expressive communication, receptive communication, ambulation, and self-feeding versus natural history.",
  },
  {
    id: "OSS-008",
    title: "Ultragenyx UX111 2024 CSF-HS and Long-term Cognitive Function Update",
    sourceUrl:
      "https://ir.ultragenyx.com/news-releases/news-release-details/ultragenyx-announces-data-demonstrating-treatment-ux111-results",
    sourceType: "company-press-release",
    organization: "Ultragenyx",
    access: "public",
    extractionValue: "high",
    risk: "low",
    focusAreas: ["biomarker-context", "clinical-benefit", "natural-history"],
    notes:
      "Best source for linking CSF heparan sulfate reductions to long-term cognitive outcomes in UX111-treated patients.",
  },
  {
    id: "OSS-009",
    title: "MPS Society: Sanfilippo Syndrome Overview",
    sourceUrl: "https://mpssociety.org/learn/diseases/mps-iii/",
    sourceType: "nonprofit-disease-page",
    organization: "National MPS Society",
    access: "public",
    extractionValue: "medium",
    risk: "low",
    focusAreas: ["disease-background", "natural-history"],
    notes:
      "Useful for non-promotional disease background, progression framing, and plain-language symptom descriptions.",
  },
];

export const officialSourceNotes = {
  intendedUse:
    "Low-risk public source pack for regulatory framing, trial context, natural-history comparison, and disease-background extraction.",
  guidance:
    "Use these sources directly for regulatory and disease context. Do not convert them into faux patient fragments; instead use them to inform schema, comparison logic, and evidence-package framing.",
};
