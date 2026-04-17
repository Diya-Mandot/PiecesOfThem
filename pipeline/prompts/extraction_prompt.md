# Extraction Prompt v2026-04-17-v1

You extract structured evidence from a single source chunk.

Return strict JSON only.
Do not wrap the JSON in markdown fences, commentary, or code blocks.

Use only facts that are explicitly present in the chunk.
Do not use outside knowledge.
Do not infer names, diagnoses, trial enrollment, or outcomes unless the chunk says them directly.
Prefer omission over speculation.

For every datapoint you emit:
- Keep `evidence_quote` verbatim from the chunk and never blank.
- Keep the quote short, but complete enough to support the datapoint.
- Do not use empty strings or whitespace-only strings.
- Use the smallest `value` object that fully captures the supported claim.
- If the chunk does not support a datapoint with direct evidence, omit it.

Allowed `datapoint_type` values:
- `child_identity`
- `caregiver_role`
- `disease_subtype`
- `trial_participation`
- `functional_signal`
- `temporal_marker`
- `outcome_claim`

Output shape:
{
  "datapoints": [
    {
      "datapoint_type": "trial_participation",
      "subject_label": "Eliza O'Neill",
      "disease_subtype": "MPS IIIA",
      "trial_program": "UX111-ABO-102",
      "confidence": "high",
      "evidence_quote": "exact quote from the chunk",
      "value": {
        "kind": "trial_participation",
        "participation_status": "confirmed",
        "named_publicly": true
      }
    }
  ]
}

`value.kind` must match `datapoint_type`.
`value` must use one of these exact shapes:
- `child_identity`: `{ "kind": "child_identity", "display_name": "...", "pronouns": "optional", "age_text": "optional" }`
- `caregiver_role`: `{ "kind": "caregiver_role", "relation": "...", "caregiver_name": "optional" }`
- `disease_subtype`: `{ "kind": "disease_subtype", "subtype": "..." }`
- `trial_participation`: `{ "kind": "trial_participation", "participation_status": "confirmed|mentioned|planned|completed", "named_publicly": true|false }`
- `functional_signal`: `{ "kind": "functional_signal", "signal": "...", "direction": "improved|worsened|stable|present|absent|unclear" }`
- `temporal_marker`: `{ "kind": "temporal_marker", "marker": "...", "marker_type": "age|date|duration|sequence|relative_time|other" }`
- `outcome_claim`: `{ "kind": "outcome_claim", "claim": "...", "direction": "improved|worsened|stable|mixed|unclear" }`

Only include `pronouns`, `age_text`, or `caregiver_name` when the chunk explicitly supports them.
Omit any optional field that is not directly supported.

If there are no supported datapoints, return:
{
  "datapoints": []
}
