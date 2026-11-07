# 🥕 Despensa Inteligente

App mobile para controle de validade de alimentos e redução de desperdício.

**Stack:** React Native (Expo + Expo Router) · NestJS · Prisma · PostgreSQL · Redis + BullMQ · Expo Push

```
despensa-inteligente/
├── apps/
│   ├── api/        # NestJS (REST /api/v1) + Prisma + cron + fila de push
│   └── mobile/     # Expo (React Native, TypeScript)
├── packages/
│   └── shared-types/   # Tipos TypeScript compartilhados
├── docker-compose.yml  # Postgres 16 + Redis 7
└── .github/workflows/ci.yml
```

## Pré-requisitos

- Node.js 20+ e [pnpm](https://pnpm.io) 9 (`corepack enable`)
- Docker (para Postgres e Redis)
- Celular com o app **Expo Go** (ou um emulador). Push notifications exigem **aparelho físico**.

## Primeiros passos (do zero ao primeiro teste)

```bash
# 1. Dependências do monorepo
pnpm install

# 2. Infra local (Postgres + Redis)
pnpm infra:up

# 3. Configurar a API
cp apps/api/.env.example apps/api/.env
pnpm --filter @despensa/api prisma:generate

# 4. Criar o banco e a primeira migration (commite a pasta prisma/migrations gerada)
pnpm --filter @despensa/api exec prisma migrate dev --name init

# 5. Popular categorias padrão e receitas
pnpm --filter @despensa/api prisma:seed

# 6. Subir a API (http://localhost:3000/api/v1/health)
pnpm api:dev
```

Mobile (em outro terminal):

```bash
cp apps/mobile/.env.example apps/mobile/.env     # ajuste EXPO_PUBLIC_API_URL com o IP da sua máquina
cd apps/mobile
npx expo install --fix                            # alinha as versões das libs ao SDK do Expo instalado
pnpm start                                        # escaneie o QR code com o Expo Go
```

> Para push funcionar, crie um projeto no EAS (`npx eas init`) e coloque o `projectId` em `apps/mobile/app.json` → `extra.eas.projectId`.

## ✅ Primeiro teste ponta a ponta (validade → push)

1. Crie uma conta no app e aceite a permissão de notificações (aparelho físico).
2. Cadastre um produto com validade **amanhã**.
3. Force a verificação (ignora o horário configurado):
   ```bash
   curl -X POST http://localhost:3000/api/v1/notifications/run \
        -H "Authorization: Bearer <accessToken>"
   ```
   Resposta: `{ "usersChecked":1, "usersNotified":1, "alertsCreated":1, "jobsEnqueued":1 }` e o push chega no celular.
4. Rodar de novo retorna `alertsCreated: 0` — a idempotência está funcionando.

Esse endpoint só existe fora de produção.

## Testes

```bash
pnpm api:test                               # unitários (não precisam de banco)
pnpm --filter @despensa/api test:e2e        # e2e (precisa de Postgres + Redis rodando e DB migrado)
```

## Endpoints (`/api/v1`)

| Módulo | Método | Rota |
|---|---|---|
| Health | GET | `/health` (público) |
| Auth | POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` (públicos) |
| Usuário | GET/PATCH | `/users/me` |
| | POST / DELETE | `/users/me/devices`, `/users/me/devices/:token` |
| Produtos | GET | `/products?status=&category=&location=&expiringIn=&search=&sort=&order=&page=&limit=` |
| | POST | `/products` |
| | GET/PATCH/DELETE | `/products/:id` |
| | PATCH | `/products/:id/status` (`active` \| `consumed` \| `discarded`) |
| | GET | `/products/barcode/:ean` (Open Food Facts) |
| Categorias | GET/POST | `/categories` |
| | PATCH/DELETE | `/categories/:id` (somente as do usuário) |
| Alertas | GET | `/alerts?unread=true` |
| | PATCH | `/alerts/:id/read` |
| Receitas | GET | `/recipes/suggestions` |
| | GET/POST/PATCH/DELETE | `/recipes`, `/recipes/:id` |
| Métricas | GET | `/stats/waste?days=30` |
| Dev | POST | `/notifications/run` (desabilitado em produção) |

## Como funciona o cron de validade

- `NotificationsService` roda **a cada hora cheia** (`@nestjs/schedule`) e só processa usuários cuja **hora local** (no fuso salvo) é igual a `notifyHour`.
- Para cada usuário: busca produtos `active` que vencem em até `notifyDaysBefore` dias e os já vencidos, cria `alerts` com `createMany({ skipDuplicates })` (UNIQUE `productId + type + scheduledFor`) e enfileira **um único push agrupado** na fila BullMQ `push`.
- `jobId = push-<userId>-<yyyy-mm-dd>` impede push duplicado no mesmo dia mesmo se o cron rodar duas vezes.
- `PushProcessor` envia via Expo Push, remove tokens `DeviceNotRegistered`, marca `alerts.sentAt` e faz retry exponencial em falhas transitórias.
- **Em produção:** rode a API com `RUN_SCHEDULER=false` (várias réplicas) e **um** worker com `RUN_SCHEDULER=true` (`pnpm --filter @despensa/api start:worker`).

## Deploy (sugestão)

- **API + worker:** Railway/Render usando `apps/api/Dockerfile` (dois serviços; só o worker com `RUN_SCHEDULER=true`).
- **Postgres:** Neon / Supabase / Railway. **Redis:** Upstash.
- **App:** `eas build` + TestFlight / Play Internal Testing.

## Roadmap pós-MVP

- Receitas externas (Spoonacular) via `SPOONACULAR_API_KEY`
- Lista de compras automática a partir de itens consumidos
- Upload de foto do produto (S3/R2)
- Compartilhar despensa entre membros da casa
- Telas de histórico de alertas (a API já expõe `/alerts`)
