import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/app.js";

test("GET /api/cases/:caseId projects canonical fragment data", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/cases/PSS-003",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.caseRecord.id, "PSS-003");
  assert.equal(payload.caseRecord.label, "Lindquist's Story");
  assert.ok(payload.metrics.fragmentCount > 0);
});

test("GET /api/cases/all-evidence projects the aggregate evidence archive", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/cases/all-evidence",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.caseRecord.id, "all-evidence");
  assert.equal(payload.caseRecord.label, "All Evidence Findings");
  assert.ok(payload.metrics.fragmentCount > 0);
});

test("GET /api/fragments returns canonical evidence fragments", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/fragments?caseId=PSS-003",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.ok(payload.fragments.length > 0);
  assert.ok(
    payload.fragments.some((fragment: { signalDomain: string }) => fragment.signalDomain === "vocabulary"),
  );
});

test("POST /api/claims returns canonical claims for an existing case", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/claims",
    payload: { caseId: "PSS-003" },
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.ok(Array.isArray(payload.claims));
});

test("GET /api/report/:caseId returns a report assembled from canonical claims and fragments", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/report/PSS-003",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.id, "PSS-003");
  assert.ok(payload.metrics.fragmentCount > 0);
});

test("GET /api/chart/trajectory/:caseId returns chart data from canonical fragments", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/chart/trajectory/PSS-003",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.ok(payload.trajectoryPoints.length > 0);
});

test("GET /api/ingestion/evidence-fragments returns canonical evidence records", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/ingestion/evidence-fragments",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.ok(payload.total_count > 0);
  assert.ok(Array.isArray(payload.evidence_fragments));
  assert.ok(payload.evidence_fragments.every((fragment: { external_id: string }) => fragment.external_id.startsWith("FRG-")));
});

test("GET /api/ingestion/evidence-fragments/:id returns a canonical evidence record with chunk lineage", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/ingestion/evidence-fragments",
  });

  const listPayload = listResponse.json();
  const firstFragmentId = listPayload.evidence_fragments[0].id;

  const response = await app.inject({
    method: "GET",
    url: `/api/ingestion/evidence-fragments/${firstFragmentId}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.evidence_fragment.id, firstFragmentId);
  assert.ok(Array.isArray(payload.evidence_fragment.chunk_ids));
});

test("GET /api/ingestion/evidence-fragments/:id returns 404 for an unknown canonical evidence record", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/ingestion/evidence-fragments/999999",
  });

  assert.equal(response.statusCode, 404);
});

test("GET /api/ingestion/claims returns canonical claim records with fragment lineage", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/ingestion/claims",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.ok(payload.total_count > 0);
  assert.ok(Array.isArray(payload.claims));
  assert.ok(Array.isArray(payload.claims[0].fragment_ids));
});

test("GET /api/ingestion/claims/:id returns a canonical claim record", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/ingestion/claims",
  });

  const listPayload = listResponse.json();
  const firstClaimId = listPayload.claims[0].id;

  const response = await app.inject({
    method: "GET",
    url: `/api/ingestion/claims/${firstClaimId}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.claim.id, firstClaimId);
  assert.ok(Array.isArray(payload.claim.fragment_ids));
});

test("GET /api/ingestion/claims/:id returns 404 for an unknown canonical claim record", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/ingestion/claims/999999",
  });

  assert.equal(response.statusCode, 404);
});
