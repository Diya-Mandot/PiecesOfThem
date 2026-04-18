import type {
  CaseRecord,
  Claim,
  EvidenceFragment,
  SignalDomain,
  SourceType,
  TrajectoryKpis,
  TrajectoryPoint
} from "./types";

export type ErrorResponse = {
  error: string;
};

export type GetCaseResponse = {
  caseRecord: CaseRecord;
  metrics: {
    fragmentCount: number;
    claimCount: number;
    sourceTypes: SourceType[];
  };
};

export type GetFragmentsQuery = {
  caseId: string;
  domain?: SignalDomain;
  year?: string;
  query?: string;
};

export type GetFragmentsResponse = {
  fragments: EvidenceFragment[];
};

export type PostClaimsRequest = {
  caseId: string;
  domain?: SignalDomain;
};

export type PostClaimsResponse = {
  claims: Claim[];
};

export type GetReportResponse = CaseRecord & {
  metrics: {
    fragmentCount: number;
    claimCount: number;
    modalities: number;
    domains: number;
  };
  claims: Array<
    Claim & {
      citations: EvidenceFragment[];
    }
  >;
};

export type GetTrajectoryResponse = {
  trajectoryPoints: TrajectoryPoint[];
  kpis: TrajectoryKpis;
};
