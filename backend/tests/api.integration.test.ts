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
  assert.equal(payload.metrics.fragmentCount, 2);
});

test("GET /api/cases/demo-child-a resolves to the first canonical case for the frontend demo route", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/cases/demo-child-a",
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.caseRecord.label, "Lindquist's Story");
  assert.equal(payload.metrics.fragmentCount, 2);
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
  assert.equal(payload.fragments.length, 2);
  assert.ok(payload.fragments.every((fragment: { sourceType: string }) => fragment.sourceType === "Parent Journal"));
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
  assert.equal(payload.metrics.fragmentCount, 2);
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
  assert.equal(payload.trajectoryPoints.length, 2);
});
