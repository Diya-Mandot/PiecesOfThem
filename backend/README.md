# Backend Workspace

This directory is reserved for backend code if the project is split beyond the current Next.js runtime.

Current state:
- the active application runtime lives in `../frontend/`
- the current API delivery layer is implemented in `../frontend/app/api/`
- this directory can later hold extracted services, worker code, adapters, or deployment-specific backend logic

Until that split happens, run the app from `frontend/`.
