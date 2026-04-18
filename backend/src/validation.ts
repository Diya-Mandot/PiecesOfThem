import type { FastifyReply } from "fastify";

import type { ErrorResponse } from "../../shared/api.js";
import type { SignalDomain } from "../../shared/types.js";

const signalDomains = new Set<SignalDomain>(["vocabulary", "recognition", "sleep", "behavior", "motor"]);

export function isSignalDomain(value: unknown): value is SignalDomain {
  return typeof value === "string" && signalDomains.has(value as SignalDomain);
}

export function validateSignalDomain(value: unknown): SignalDomain | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  return isSignalDomain(value) ? value : "invalid";
}

export function validateYear(value: unknown): string | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" && /^\d{4}$/.test(value) ? value : "invalid";
}

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

export function validateIntegerFilter(value: unknown): number | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : "invalid";
}

export function badRequest(reply: FastifyReply, error: string) {
  return reply.status(400).send({ error } satisfies ErrorResponse);
}

export function notFound(reply: FastifyReply, error: string) {
  return reply.status(404).send({ error } satisfies ErrorResponse);
}
