import type { FastifyInstance } from "fastify";

import type {
  GetDocumentChunkResponse,
  GetExtractedDatapointResponse,
  GetExtractionIssueResponse,
  GetExtractionRunResponse,
  GetSeedSourceResponse,
  GetSourceDocumentResponse,
  ListDocumentChunksQuery,
  ListDocumentChunksResponse,
  ListExtractedDatapointsQuery,
  ListExtractedDatapointsResponse,
  ListExtractionIssuesQuery,
  ListExtractionIssuesResponse,
  ListExtractionRunsQuery,
  ListExtractionRunsResponse,
  ListSeedSourcesQuery,
  ListSeedSourcesResponse,
  ListSourceDocumentsQuery,
  ListSourceDocumentsResponse,
} from "../../../shared/ingestion-api.js";

import { badRequest, notFound, validateBooleanFilter, validateIntegerFilter } from "../validation.js";
import type { IngestionService } from "./service.js";

export async function registerIngestionRoutes(app: FastifyInstance, service: IngestionService) {
  app.get<{ Querystring: ListSeedSourcesQuery }>("/api/ingestion/seed-sources", async (request, reply) => {
    const namedPublicly = validateBooleanFilter(request.query.named_publicly);
    const confirmedParticipation = validateBooleanFilter(request.query.confirmed_participation);

    if (namedPublicly === "invalid" || confirmedParticipation === "invalid") {
      return badRequest(reply, "Invalid boolean filter");
    }

    const response = await service.listSeedSources({
      kind: request.query.kind,
      disease_subtype: request.query.disease_subtype,
      trial_program: request.query.trial_program,
      comparison_use: request.query.comparison_use,
      named_publicly: namedPublicly,
      confirmed_participation: confirmedParticipation,
    });

    return reply.send(response satisfies ListSeedSourcesResponse);
  });

  app.get<{ Params: { seedId: string } }>("/api/ingestion/seed-sources/:seedId", async (request, reply) => {
    const seedSource = await service.getSeedSource(request.params.seedId);

    if (!seedSource) {
      return notFound(reply, "Seed source not found");
    }

    return reply.send({ seed_source: seedSource } satisfies GetSeedSourceResponse);
  });

  app.get<{ Querystring: ListSourceDocumentsQuery }>("/api/ingestion/source-documents", async (request, reply) => {
    const seedSourceId = validateIntegerFilter(request.query.seed_source_id);

    if (seedSourceId === "invalid") {
      return badRequest(reply, "Invalid seed_source_id");
    }

    const response = await service.listSourceDocuments({
      seed_source_id: seedSourceId,
      fetch_status: request.query.fetch_status,
      content_type: request.query.content_type,
    });

    return reply.send(response satisfies ListSourceDocumentsResponse);
  });

  app.get<{ Params: { id: string } }>("/api/ingestion/source-documents/:id", async (request, reply) => {
    const id = validateIntegerFilter(request.params.id);

    if (id === "invalid" || id === undefined) {
      return badRequest(reply, "Invalid source document id");
    }

    const sourceDocument = await service.getSourceDocument(id);

    if (!sourceDocument) {
      return notFound(reply, "Source document not found");
    }

    return reply.send({ source_document: sourceDocument } satisfies GetSourceDocumentResponse);
  });

  app.get<{ Querystring: ListDocumentChunksQuery }>("/api/ingestion/document-chunks", async (request, reply) => {
    const sourceDocumentId = validateIntegerFilter(request.query.source_document_id);

    if (sourceDocumentId === "invalid") {
      return badRequest(reply, "Invalid source_document_id");
    }

    const response = await service.listDocumentChunks({ source_document_id: sourceDocumentId });
    return reply.send(response satisfies ListDocumentChunksResponse);
  });

  app.get<{ Params: { id: string } }>("/api/ingestion/document-chunks/:id", async (request, reply) => {
    const id = validateIntegerFilter(request.params.id);

    if (id === "invalid" || id === undefined) {
      return badRequest(reply, "Invalid document chunk id");
    }

    const documentChunk = await service.getDocumentChunk(id);

    if (!documentChunk) {
      return notFound(reply, "Document chunk not found");
    }

    return reply.send({ document_chunk: documentChunk } satisfies GetDocumentChunkResponse);
  });

  app.get<{ Querystring: ListExtractionRunsQuery }>("/api/ingestion/extraction-runs", async (request, reply) => {
    const sourceDocumentId = validateIntegerFilter(request.query.source_document_id);

    if (sourceDocumentId === "invalid") {
      return badRequest(reply, "Invalid source_document_id");
    }

    const response = await service.listExtractionRuns({
      source_document_id: sourceDocumentId,
      status: request.query.status,
      extractor_name: request.query.extractor_name,
      model_name: request.query.model_name,
    });

    return reply.send(response satisfies ListExtractionRunsResponse);
  });

  app.get<{ Params: { id: string } }>("/api/ingestion/extraction-runs/:id", async (request, reply) => {
    const id = validateIntegerFilter(request.params.id);

    if (id === "invalid" || id === undefined) {
      return badRequest(reply, "Invalid extraction run id");
    }

    const extractionRun = await service.getExtractionRun(id);

    if (!extractionRun) {
      return notFound(reply, "Extraction run not found");
    }

    return reply.send({ extraction_run: extractionRun } satisfies GetExtractionRunResponse);
  });

  app.get<{ Querystring: ListExtractedDatapointsQuery }>(
    "/api/ingestion/extracted-datapoints",
    async (request, reply) => {
      const sourceDocumentId = validateIntegerFilter(request.query.source_document_id);
      const chunkId = validateIntegerFilter(request.query.chunk_id);

      if (sourceDocumentId === "invalid" || chunkId === "invalid") {
        return badRequest(reply, "Invalid integer filter");
      }

      const response = await service.listExtractedDatapoints({
        source_document_id: sourceDocumentId,
        chunk_id: chunkId,
        datapoint_type: request.query.datapoint_type,
        disease_subtype: request.query.disease_subtype,
        trial_program: request.query.trial_program,
        confidence: request.query.confidence,
      });

      return reply.send(response satisfies ListExtractedDatapointsResponse);
    },
  );

  app.get<{ Params: { id: string } }>("/api/ingestion/extracted-datapoints/:id", async (request, reply) => {
    const id = validateIntegerFilter(request.params.id);

    if (id === "invalid" || id === undefined) {
      return badRequest(reply, "Invalid extracted datapoint id");
    }

    const extractedDatapoint = await service.getExtractedDatapoint(id);

    if (!extractedDatapoint) {
      return notFound(reply, "Extracted datapoint not found");
    }

    return reply.send({ extracted_datapoint: extractedDatapoint } satisfies GetExtractedDatapointResponse);
  });

  app.get<{ Querystring: ListExtractionIssuesQuery }>("/api/ingestion/extraction-issues", async (request, reply) => {
    const sourceDocumentId = validateIntegerFilter(request.query.source_document_id);
    const chunkId = validateIntegerFilter(request.query.chunk_id);

    if (sourceDocumentId === "invalid" || chunkId === "invalid") {
      return badRequest(reply, "Invalid integer filter");
    }

    const response = await service.listExtractionIssues({
      source_document_id: sourceDocumentId,
      chunk_id: chunkId,
      issue_type: request.query.issue_type,
    });

    return reply.send(response satisfies ListExtractionIssuesResponse);
  });

  app.get<{ Params: { id: string } }>("/api/ingestion/extraction-issues/:id", async (request, reply) => {
    const id = validateIntegerFilter(request.params.id);

    if (id === "invalid" || id === undefined) {
      return badRequest(reply, "Invalid extraction issue id");
    }

    const extractionIssue = await service.getExtractionIssue(id);

    if (!extractionIssue) {
      return notFound(reply, "Extraction issue not found");
    }

    return reply.send({ extraction_issue: extractionIssue } satisfies GetExtractionIssueResponse);
  });
}
