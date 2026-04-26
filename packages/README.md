# Shared Packages Preparation

This directory is reserved for shared code that can be reused by multiple KORYXA services without recreating hard dependencies between service internals.

## Planned packages

- `packages/shared-types/`
  - shared DTOs
  - event payload contracts
  - response envelopes

- `packages/auth-client/`
  - token/session verification client
  - identity introspection helpers
  - entitlement lookup helpers

- `packages/api-client/`
  - internal service clients
  - typed gateway client wrappers
  - retry / timeout defaults

- `packages/ui/`
  - shared design primitives
  - layout components
  - typography, forms, feedback patterns

- `packages/config/`
  - shared config schemas
  - env parsing helpers
  - runtime defaults reused across services

## Rules

1. Shared packages must stay generic.
2. No service-specific business logic should be placed here.
3. Services must depend on shared packages, not on each other's private folders.
4. Public contracts should be stable and versioned when needed.

## Migration note

At the start, these folders may contain only placeholders. They become useful when service extraction begins and repeated contracts or UI primitives appear across services.
