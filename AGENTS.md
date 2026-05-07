## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## live-service-ownership

KORYXA is in a progressive microservice transition. Do not assume every backend change belongs in `apps/koryxa/backend`.

Rules:
- Before changing any backend route, first identify the live owner through Nginx and systemd.
- Read `docs/LIVE_SERVICE_OWNERSHIP.md` before changing routing, API ownership, or ChatLAYA behavior.
- `services/chatlaya-service/backend` owns live ChatLAYA traffic exposed under `/api/chatlaya/*`.
- `apps/koryxa/backend` owns the live core API exposed under `/innova/*` and `/innova/api/*`.
- Do not move a route from one service to another without an explicit migration decision.
- Do not “fix” ChatLAYA in the core backend if the live route is served by `chatlaya.service`.
