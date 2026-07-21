# billing-service

Microserviço de **Orçamento e Pagamento** do Tech Challenge FIAP (Fase 4) — sistema de oficina mecânica em microserviços. Requisitos completos em `../REQUISITOS.md` (fora deste repo).

## Responsabilidades

- **Orçamento (Quote)**: geração automática a partir do total recebido no evento de OS criada; aprovação/recusa via webhook
- **Pagamento (Payment)**: registro e verificação com **integração ao Mercado Pago**
- **Participante da Saga**: consome `quote.generate` / `quote.cancel` / `payment.confirm` / `payment.refund`; publica `quote.generated`, `quote.approved`/`quote.rejected` (do webhook de aprovação) e `payment.confirmed`/`payment.failed`

**Fora do escopo:** ciclo de vida da OS e orquestração (`work-order-service`); estoque/execução (`execution-service`). Nenhum serviço acessa o banco de outro — só via eventos RabbitMQ.

## Stack

- **NestJS 11** + TypeScript, **pnpm**
- **PostgreSQL** via **Prisma 7** (driver adapter; `moduleFormat = "cjs"` no generator)
- **RabbitMQ** via `RabbitMqBus` próprio (topic exchange `saga`, em `shared/messaging`) — NÃO usar o transporte RMQ nativo do Nest
- Zod para env, class-validator para DTOs HTTP
- Jest (unit + e2e), cobertura mínima **80%**, Swagger em `/docs`

## Convenções de portas e filas

- HTTP: **3001** | PostgreSQL: **5433** | Fila RabbitMQ: **billing_queue**
- RabbitMQ é **compartilhado** (sobe no compose do work-order-service); aqui só conectamos.

## Comandos

```bash
pnpm install
docker compose up -d          # PostgreSQL (5433)
npx prisma migrate dev
pnpm start:dev                # http://localhost:3001
pnpm test / test:cov / test:e2e / lint:check / build
```

Antes de concluir tarefa: `pnpm lint:check && pnpm test && pnpm build`.

## Arquitetura (Clean Architecture)

```
src/
├── modules/billing/
│   ├── domain/         # Quote, Payment, value objects, regras
│   ├── application/    # use cases + ports (QuoteRepository, PaymentRepository, PaymentGateway)
│   ├── presentation/   # controllers HTTP (webhook de aprovação), DTOs, saga subscriber
│   └── infra/          # repositórios Prisma, adapter Mercado Pago
└── shared/             # config, database, messaging, health
tests/                  # todos os testes, espelhando src/
```

Regra de dependência: `domain` → nada; `application` → domain (define ports); `presentation`/`infra` → application.

## Mercado Pago

Integração atrás de um **port** `PaymentGateway`. O adapter real usa `MERCADO_PAGO_ACCESS_TOKEN`; sem token, um adapter **sandbox** aprova automaticamente (para rodar/demonstrar local). Trocar por token real quando disponível.

## Convenções gerais

- Código, comentários e commits **em inglês**; código autoexplicativo, **sem comentários**.
- Prettier `semi: false`, printWidth 100, aspas simples.
- `main` protegida; PR com review do code owner. Nunca mencionar Claude em commits/PRs.
