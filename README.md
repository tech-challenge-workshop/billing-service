# billing-service

[![ci](https://github.com/tech-challenge-workshop/billing-service/actions/workflows/ci.yml/badge.svg)](https://github.com/tech-challenge-workshop/billing-service/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=tech-challenge-workshop_billing-service&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=tech-challenge-workshop_billing-service)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=tech-challenge-workshop_billing-service&metric=coverage)](https://sonarcloud.io/component_measures?id=tech-challenge-workshop_billing-service&metric=coverage)

Quotes and payments service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

One of four independent services:

| Service | Responsibility |
|---|---|
| [work-order-service](https://github.com/tech-challenge-workshop/work-order-service) | Customers, vehicles, service catalog, work order lifecycle, saga orchestration |
| **billing-service** (this repo) | Quotes and payments (Mercado Pago) |
| [execution-service](https://github.com/tech-challenge-workshop/execution-service) | Parts inventory, stock control, repair execution |
| [auth-service](https://github.com/tech-challenge-workshop/auth-service) | Issues the JWTs this service validates |
| [tech-platform](https://github.com/tech-challenge-workshop/tech-platform) | Kong gateway, Datadog agent, Kubernetes manifests, OpenTofu |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (driver adapter)
- RabbitMQ for asynchronous messaging (saga participant)
- `@nestjs/jwt` for token verification, Zod for environment validation, class-validator for HTTP DTOs
- `dd-trace` for Datadog APM, with structured JSON logs correlated by trace id
- Jest (unit + e2e), Swagger for API docs

## Role in the saga

This service is a **participant** of the work order saga orchestrated by `work-order-service`:

| Consumes (command) | Reacts by |
|---|---|
| `quote.generate` | Creating a quote and publishing `quote.generated` |
| `payment.confirm` | Charging via Mercado Pago and publishing `payment.confirmed` / `payment.failed` |
| `quote.cancel` | Cancelling the quote (compensation) |
| `payment.refund` | Refunding the payment (compensation) |

It also publishes `quote.approved` / `quote.rejected` when the customer approves or rejects — the external decision that unblocks the saga.

The saga is **orchestrated**, not choreographed: this service reacts to commands
and replies with events, and never decides what happens next. The reasoning
behind that choice is documented in the
[work-order-service README](https://github.com/tech-challenge-workshop/work-order-service#why-the-saga-is-orchestrated),
where the orchestrator lives.

## Authentication

This service **validates** tokens, it never issues them — that is `auth-service`'s job. Both share the same HS256 `JWT_SECRET`.

Two guards are registered globally via `APP_GUARD`: `JwtAuthGuard` verifies the bearer token, then `RolesGuard` enforces `@Roles(...)`. A route marked `@Public()` skips both.

| Route | Role |
|---|---|
| `GET /quotes/:workOrderId` | `admin` |
| `POST /quotes/:workOrderId/approve` | `customer` |
| `POST /quotes/:workOrderId/reject` | `customer` |
| `GET /payments/:workOrderId` | `admin` |
| `GET /health` | **public** |

Approval and rejection are `customer`-only by design: accepting a quote is the customer's decision, and an admin must not be able to approve on their behalf. Reading the quote is `admin`-only because the workshop staff inspect it operationally.

## Business rules worth knowing

**Quote generation is automatic.** The saga sends `quote.generate` with the total computed from the work order's price snapshot. Billing never recalculates prices — it records what was quoted at the moment the order was opened, so a later catalog change cannot alter an existing quote.

**Approval unblocks the saga.** `POST /quotes/:workOrderId/approve` publishes `quote.approved`, which drives the orchestrator to confirm payment and start execution. Rejection publishes `quote.rejected` and the order is cancelled through compensation.

**Compensation is idempotent.** `quote.cancel` and `payment.refund` can be redelivered by RabbitMQ and must converge to the same state.

## Requirements

Node 24+, pnpm 10, Docker.

## Run this service

```bash
pnpm install
cp .env.example .env
docker compose up -d          # PostgreSQL (port 5433)
npx prisma migrate dev
pnpm start:dev                # http://localhost:3001
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/docs |
| Health check | http://localhost:3001/health |

> **RabbitMQ dependency:** this service's `docker-compose.yml` starts **only PostgreSQL**. The RabbitMQ broker lives in `work-order-service`'s compose and is shared by all services — start it first. The full four-service saga walkthrough, including how to obtain the admin and customer tokens every protected route requires, is in the `work-order-service` README.

### Mercado Pago

Payment integration sits behind a `PaymentGateway` port. Set `MERCADO_PAGO_ACCESS_TOKEN` in `.env` to use the real API; leave it empty to use a sandbox adapter that auto-approves, so the flow runs locally without credentials.

## Observability

`dd-trace` reports APM traces to the Datadog Agent that `tech-platform`'s compose provides on `localhost:8126`. Application logs are JSON and carry `dd.trace_id` / `dd.span_id`. Saga message handlers are wrapped in custom spans through `TracingPort.withSpan()`, so quote generation and payment confirmation appear inside the same distributed trace as the work order that triggered them.

## Deployment

Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`, `HPA`) live in [`tech-platform/k8s/billing-service`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/k8s/billing-service). The AWS infrastructure behind them — VPC, EKS, RDS, Amazon MQ — is OpenTofu in [`tech-platform/terraform`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/terraform).

**Why the manifests are not in this repository.** The four services are always
deployed to the same cluster, behind the same Kong gateway, by the same
pipeline. Keeping a `k8s/` directory per repository would duplicate the
namespace, the `Gateway`, the `HTTPRoute` set, the Kong plugins and the Datadog
values four times over, and those copies would drift the first time a route
changed. Centralising them keeps one kustomize tree that renders the whole
platform and is validated by `kubeconform` on every pull request. The trade-off
is deliberate: this repository owns its application and its image, the platform
repository owns how the platform is assembled.

CI builds and pushes the image to `ghcr.io/tech-challenge-workshop/billing-service` on every push to `main`.

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm test:ci` | Combined unit + e2e coverage — the gate CI enforces |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |

## Test coverage

The badges at the top are live: they come from the SonarCloud analysis CI runs
on every push to `main`. Full report, file by file:
**[sonarcloud.io › billing-service](https://sonarcloud.io/component_measures?id=tech-challenge-workshop_billing-service&metric=coverage)**

`pnpm test:ci` merges unit and e2e runs into a single report and **fails the
build below 80%** on statements, branches, functions and lines.

To reproduce:

```bash
docker compose up -d
pnpm test:ci        # prints the coverage summary, writes coverage/lcov.info
```

## Docker

```bash
docker build -t billing-service .
docker run --env-file .env -p 3001:3001 billing-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
