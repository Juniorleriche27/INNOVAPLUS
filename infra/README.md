# Infra Preparation

This directory is the target location for infrastructure templates used by the future KORYXA microservices architecture.

It is not wired to live production automatically.

## Purpose of each subdirectory

- `infra/nginx/` -> gateway and reverse proxy templates
- `infra/systemd/` -> service unit templates per microservice
- `infra/docker/` -> local container and image build templates
- `infra/scripts/` -> operational helper scripts
- `infra/monitoring/` -> metrics, dashboards, alerts, probes
- `infra/logs/` -> log path conventions and rotation templates

## Important guardrail

Nothing in `infra/` changes the current Hetzner runtime by itself.

The live stack currently continues to rely on the existing active deployment outside this preparation work.

## Target gateway routing

Planned public API mapping:

- `/api/v1/core/*` -> `127.0.0.1:8000`
- `/api/v1/chatlaya/*` -> `127.0.0.1:8010`
- `/api/v1/datalaya/*` -> `127.0.0.1:8020`
- `/api/v1/myplanning/*` -> `127.0.0.1:8030`
- `/api/v1/playwork/*` -> `127.0.0.1:8040`
- `/api/v1/notifications/*` -> `127.0.0.1:8050`
- `/api/v1/billing/*` -> `127.0.0.1:8060`
- `/api/v1/analytics/*` -> `127.0.0.1:8070`

## systemd target model

Planned service units:

- `koryxa-core-service.service`
- `chatlaya-service.service`
- `datalaya-service.service`
- `myplanning-service.service`
- `playwork-service.service`
- `notification-service.service`
- `billing-service.service`
- `analytics-service.service`

Each unit should own:

- its own env file
- its own working directory
- its own logs
- its own restart policy
- its own health verification workflow

## Logging target model

Recommended structure:

- `/var/log/koryxa/koryxa-core-service/`
- `/var/log/koryxa/chatlaya-service/`
- `/var/log/koryxa/datalaya-service/`
- `/var/log/koryxa/myplanning-service/`
- `/var/log/koryxa/playwork-service/`
- `/var/log/koryxa/notification-service/`
- `/var/log/koryxa/billing-service/`
- `/var/log/koryxa/analytics-service/`

## Monitoring target model

Each service should later expose:

- liveness probe
- readiness probe
- service-level metrics
- error rate visibility
- latency visibility

## Migration note

When live infrastructure changes begin, update templates here first, validate them in staging or a dry-run environment, then promote them to real hosts. Do not edit production configuration as the first step.
