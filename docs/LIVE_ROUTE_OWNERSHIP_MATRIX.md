# Live Route Ownership Matrix

This matrix tracks the current live route ownership across KORYXA backends.

Read this file together with:

- `docs/LIVE_SERVICE_OWNERSHIP.md`
- `infra/nginx/innovaplus.active.conf`
- `infra/nginx/innovaplus-api.active.conf`

## Status meanings

- `correct` = live route is owned by the intended service
- `legacy-duplicate` = live route exists in a second backend and should be cleaned later
- `to-migrate-to-chatlaya-service` = currently owned by core but should move to ChatLAYA service
- `internal-core` = intentionally owned by core for cross-service support

## Matrix

| Public route family | Live owner | Service codebase | Current status | Notes / next action |
| --- | --- | --- | --- | --- |
| `/health` | core | `apps/koryxa/backend` | `correct` | Core healthcheck on `127.0.0.1:8000`. |
| `/innova/health` | core | `apps/koryxa/backend` | `correct` | Core compatibility health route. |
| `/innova/api/auth/*` | core | `apps/koryxa/backend` | `correct` | Core auth ownership should stay in core. |
| `/innova/api/internal/core/*` | core | `apps/koryxa/backend` | `internal-core` | Intended for service-to-core summaries and entitlements. |
| `/innova/api/trajectoire/*` | core | `apps/koryxa/backend` | `correct` | Core product ownership. |
| `/innova/api/enterprise/*` | core | `apps/koryxa/backend` | `correct` | Core enterprise ownership. |
| `/innova/api/products/public` | core | `apps/koryxa/backend` | `correct` | Public core product registry. |
| `/innova/api/notifications*` | core | `apps/koryxa/backend` | `correct` | Keep in core unless notifications become a dedicated service later. |
| `/api/chatlaya/health` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Served by `chatlaya.service` on `127.0.0.1:8012`. |
| `/api/chatlaya/session` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Live ChatLAYA session route. |
| `/api/chatlaya/conversations*` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Live ChatLAYA conversation ownership. |
| `/api/chatlaya/messages` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Live ChatLAYA message listing. |
| `/api/chatlaya/message` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Live ChatLAYA reply generation. |
| `/api/chatlaya/problem-report-categories` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | ChatLAYA-owned collector categories endpoint. |
| `/api/chatlaya/problem-reports` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | ChatLAYA-owned collector write endpoint. |
| `/chatlaya/session` on `innovaplus.africa` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Site-domain proxy compatibility for frontend traffic. |
| `/chatlaya/conversations*` on `innovaplus.africa` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Site-domain proxy compatibility for frontend traffic. |
| `/chatlaya/messages` on `innovaplus.africa` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Site-domain proxy compatibility for frontend traffic. |
| `/chatlaya/message` on `innovaplus.africa` | ChatLAYA | `services/chatlaya-service/backend` | `correct` | Site-domain proxy compatibility for frontend traffic. |
| `/innova/api/chatlaya/session` | core | `apps/koryxa/backend` | `legacy-duplicate` | Duplicate ChatLAYA API still mounted in core. Should be deprecated after ChatLAYA service fully owns all ChatLAYA endpoints. |
| `/innova/api/chatlaya/conversations*` | core | `apps/koryxa/backend` | `legacy-duplicate` | Duplicate of live ChatLAYA service responsibility. |
| `/innova/api/chatlaya/messages` | core | `apps/koryxa/backend` | `legacy-duplicate` | Duplicate of live ChatLAYA service responsibility. |
| `/innova/api/chatlaya/message` | core | `apps/koryxa/backend` | `legacy-duplicate` | Duplicate of live ChatLAYA service responsibility. |
| `/innova/api/chatlaya/problem-report-categories` | core | `apps/koryxa/backend` | `legacy-duplicate` | Collector route now also exists in `chatlaya-service`. Remove from core after traffic cutoff. |
| `/innova/api/chatlaya/problem-reports` | core | `apps/koryxa/backend` | `legacy-duplicate` | Collector route now also exists in `chatlaya-service`. Remove from core after traffic cutoff. |

## Current conclusion

The main ownership disorder is not “too many backends”.

The main disorder is:

- ChatLAYA live traffic is correctly served by `chatlaya-service`;
- but core still exposes a second ChatLAYA router under `/innova/api/chatlaya/*`;
- and the new `problem_reports` endpoints were added to core even though their natural owner is ChatLAYA service.

## Recommended cleanup order

1. Switch all live problem collector traffic to the ChatLAYA-owned public prefix.
2. Verify DB writes and guest compatibility in `chatlaya-service`.
3. Deprecate `/innova/api/chatlaya/*` routes from core.
4. Remove duplicated ChatLAYA router ownership from `apps/koryxa/backend`.

## Rule for future changes

If a route starts with ChatLAYA responsibilities, it should not be added to core unless there is a documented temporary exception.
