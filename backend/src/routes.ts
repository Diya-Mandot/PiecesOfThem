import type { FastifyInstance } from "fastify";

import type {
  GetCaseResponse,
  GetFragmentsResponse,
  GetReportResponse,
  GetTrajectoryResponse,
  PostClaimsRequest,
  PostClaimsResponse,
} from "../../shared/api.js";

import type { EvidenceService } from "./service.js";
import { badRequest, notFound, validateSignalDomain, validateYear } from "./validation.js";

/** Register the product-facing workbench/report/chart routes consumed by the Next.js app. */
export async function registerRoutes(app: FastifyInstance, service: EvidenceService) {
  app.get<{ Params: { caseId: string } }>("/api/cases/:caseId", async (request, reply) => {
    const response = await service.getCaseResponse(request.params.caseId);

    if (!response) {
      return notFound(reply, "Case not found");
    }

    return reply.send(response satisfies GetCaseResponse);
  });

  app.get<{
    Querystring: {
      caseId?: string;
      domain?: string;
      year?: string;
      query?: string;
    };
  }>("/api/fragments", async (request, reply) => {
    const { caseId, query } = request.query;

    if (!caseId) {
      return badRequest(reply, "Missing caseId");
    }

    const domain = validateSignalDomain(request.query.domain);

    if (domain === "invalid") {
      return badRequest(reply, "Invalid domain");
    }

    const year = validateYear(request.query.year);

    if (year === "invalid") {
      return badRequest(reply, "Invalid year");
    }

    const response = await service.getFragmentsResponse(caseId, domain, year, query);

    if (!response) {
      return notFound(reply, "Case not found");
    }

    return reply.send(response satisfies GetFragmentsResponse);
  });

  app.post<{ Body: Partial<PostClaimsRequest> }>("/api/claims", async (request, reply) => {
    const body = (request.body ?? {}) as Partial<PostClaimsRequest>;

    if (!body.caseId) {
      return badRequest(reply, "Missing caseId");
    }

    const domain = validateSignalDomain(body.domain);

    if (domain === "invalid") {
      return badRequest(reply, "Invalid domain");
    }

    const response = await service.getClaimsResponse(body.caseId, domain);

    if (!response) {
      return notFound(reply, "Case not found");
    }

    return reply.send(response satisfies PostClaimsResponse);
  });

  app.get<{ Params: { caseId: string } }>("/api/report/:caseId", async (request, reply) => {
    const response = await service.getReportResponse(request.params.caseId);

    if (!response) {
      return notFound(reply, "Report not found");
    }

    return reply.send(response satisfies GetReportResponse);
  });

  app.get<{ Params: { caseId: string } }>("/api/chart/trajectory/:caseId", async (request, reply) => {
    const response = await service.getTrajectoryResponse(request.params.caseId);

    if (!response) {
      return notFound(reply, "Trajectory not found");
    }

    return reply.send(response satisfies GetTrajectoryResponse);
  });
}
