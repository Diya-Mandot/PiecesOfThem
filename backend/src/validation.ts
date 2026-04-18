import type { FastifyReply } from "fastify";

import type { ErrorResponse } from "../../shared/api.js";
import type { SignalDomain } from "../../shared/types.js";

const signalDomains = new Set<SignalDomain>(["vocabulary", "recognition", "sleep", "behavior", "motor"]);

/** Type guard for the signal-domain literals exposed to the frontend filters. */
export function isSignalDomain(value: unknown): value is SignalDomain {
  return typeof value === "string" && signalDomains.has(value as SignalDomain);
}

/** Parse optional domain filters without throwing from the route layer. */
export function validateSignalDomain(value: unknown): SignalDomain | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  return isSignalDomain(value) ? value : "invalid";
}

/** Accept year-only filters used by the workbench timeline search. */
export function validateYear(value: unknown): string | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" && /^\d{4}$/.test(value) ? value : "invalid";
}

/** Parse optional boolean query parameters from Fastify's stringly request objects. */
export function validateBooleanFilter(value: unknown): boolean | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return "invalid";
}

/** Parse positive integer IDs from route/query params used by ingestion endpoints. */
export function validateIntegerFilter(value: unknown): number | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : "invalid";
}

/** Standard 400 payload helper so the API stays shape-stable across routes. */
export function badRequest(reply: FastifyReply, error: string) {
  return reply.status(400).send({ error } satisfies ErrorResponse);
}

/** Standard 404 payload helper so callers can distinguish missing resources from server errors. */
export function notFound(reply: FastifyReply, error: string) {
  return reply.status(404).send({ error } satisfies ErrorResponse);
}
