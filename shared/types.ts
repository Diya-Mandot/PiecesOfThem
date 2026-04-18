export type SignalDomain =
  | "vocabulary"
  | "recognition"
  | "sleep"
  | "behavior"
  | "motor";

export type SourceType =
  | "Parent Journal"
  | "Caregiver Transcript"
  | "Clinic Summary"
  | "Forum Observation"
  | "Voice Memo";

export type Trend = "stable" | "declining" | "improving" | "mixed";

export type EvidenceFragment = {
  id: string;
  caseId: string;
  date: string;
  sourceType: SourceType;
  modality: "text" | "audio-transcript" | "summary";
  title: string;
  excerpt: string;
  tags: string[];
  signalDomain: SignalDomain;
  deidentified: true;
  confidence: "high" | "moderate";
  rawRef: string;
};

export type Claim = {
  id: string;
  caseId: string;
  statement: string;
  domain: SignalDomain;
  trend: Trend;
  confidence: "high" | "moderate";
  fragmentIds: string[];
};

export type CaseRecord = {
  id: string;
  label: string;
  disease: string;
  therapy: string;
  observationStart: string;
  observationEnd: string;
  summary: string;
  dataHandling: string;
  reviewWindow: string;
};

export type CaseBundle = {
  caseRecord: CaseRecord;
  fragments: EvidenceFragment[];
  claims: Claim[];
};

export type TrajectoryPoint = {
  fragmentId: string;
  date: string;
  treatedScore: number;
  naturalScore: number;
};

export type TrajectoryKpis = {
  retentionDelta: number;
  retentionDeltaDisplay: string;
  pValue: string;
  pLabel: string;
  observationMonths: number;
};
