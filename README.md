# billing-service

Quotes and payments service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

One of three independent microservices:

| Service | Responsibility |
|---|---|
| work-order-service | Customers, vehicles, service catalog, work order lifecycle, saga orchestration |
| **billing-service** (this repo) | Quotes and payments (Mercado Pago) |
| execution-service | Parts inventory, stock control, repair execution |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (driver adapter)
- RabbitMQ for asynchronous messaging (saga participant)
- Zod for environment validation, class-validator for HTTP DTOs
- Jest (unit + e2e), Swagger for API docs

## Role in the saga

This service is a **participant** of the work order saga orchestrated by `work-order-service`:

| Consumes (command) | Reacts by |
|---|---|
| `quote.generate` | Creating a quote and publishing `quote.generated` |
| `payment.confirm` | Charging via Mercado Pago and publishing `payment.confirmed` / `payment.failed` |
| `quote.cancel` | Cancelling the quote (compensation) |
| `payment.refund` | Refunding the payment (compensation) |

It also publishes `quote.approved` / `quote.rejected` from the approval webhook (the customer's external decision).

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

> **RabbitMQ dependency:** this service's `docker-compose.yml` starts **only PostgreSQL**. The RabbitMQ broker lives in `work-order-service`'s compose and is shared by all services — start it first. The full three-service saga walkthrough is in the `work-order-service` README.

### Mercado Pago

Payment integration sits behind a `PaymentGateway` port. Set `MERCADO_PAGO_ACCESS_TOKEN` in `.env` to use the real API; leave it empty to use a sandbox adapter that auto-approves, so the flow runs locally without credentials.

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |

## Docker

```bash
docker build -t billing-service .
docker run --env-file .env -p 3001:3001 billing-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
