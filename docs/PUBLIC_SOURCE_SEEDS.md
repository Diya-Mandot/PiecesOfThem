# Public Source Seeds

This file tracks publicly accessible Sanfilippo caregiver and family-story sources that can be used to prototype an automated discovery and extraction pipeline.

## Intent

- Support hackathon exploration only
- Keep exploratory public-source intake separate from the synthetic demo case bundle
- Favor consent-aware, de-identifiable sources with clear provenance

## Recommended order

1. Nonprofit family-story pages
2. Newsroom video transcripts
3. Caregiver-authored column archives
4. Social hubs for discovery only
5. Fundraiser and grief-forum content only with extra caution

## Risk notes

- Do not scrape private or login-gated groups.
- Public does not mean low-risk; caregiver stories often contain identifiable health details.
- Fundraisers, grief posts, and child-focused social accounts should be treated as high-risk discovery data, not clean evidence input.

## Data location

Typed seed entries live in [lib/public-source-seeds.ts](/D:/Repos/PiecesOfThem/lib/public-source-seeds.ts).
