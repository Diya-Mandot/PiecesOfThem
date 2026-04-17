# PiecesOfThem Branch Plan

This repo uses strict ownership. No one should work on another person's phase files.

## Main Rule

- `main` is the integration branch.
- Each person gets one long-lived working branch.
- Only the owner of a lane pushes to that lane's branch.
- Merge to `main` only after the owner verifies their lane is stable.

## Branches

### Frontend branch
- Branch name: `feat/frontend-ui`
- Owner: Frontend

Owns:
- `app/page.tsx`
- `components/landing-page.tsx`
- `app/case/demo-child-a/page.tsx`
- `components/dashboard-shell.tsx`
- `app/report/demo-child-a/page.tsx`
- `components/report-page.tsx`
- `app/globals.css`
- `tailwind.config.ts`

### AI / RAG branch
- Branch name: `feat/ai-rag-core`
- Owner: AI / RAG

Owns:
- `lib/types.ts`
- `lib/view-types.ts`
- `lib/data.ts`
- `lib/logic.ts`

### Backend branch
- Branch name: `feat/backend-delivery`
- Owner: Backend

Owns:
- `app/api/cases/[caseId]/route.ts`
- `app/api/fragments/route.ts`
- `app/api/claims/route.ts`
- `app/api/report/[caseId]/route.ts`
- `app/layout.tsx`
- `package.json`
- `README.md`

## Setup Commands

From `main` after pulling the latest code:

```bash
git checkout -b feat/frontend-ui
git checkout -b feat/ai-rag-core
git checkout -b feat/backend-delivery
```

Each person only creates and uses their own branch.

## Merge Order

1. `feat/ai-rag-core`
2. `feat/backend-delivery`
3. `feat/frontend-ui`

Reason:
- AI / RAG freezes the data contract first
- Backend exposes stable routes against that contract
- Frontend builds the final demo against stable shapes

## Merge Rules

- Do not merge directly from someone else's branch.
- Do not fix someone else's files inside your own branch.
- If a cross-lane issue appears, the owner of that lane makes the fix.
- Before merging to `main`, run:

```bash
npm run typecheck
npm run build
```

## Demo Release Branch

If you want a final polish pass without disturbing the lane branches, create:

- `release/demo-final`

Use it only after the three lane branches are merged into `main`.
