# Deploy do backend no Render

## Resumo

- Servico: `bigsmoke-backend`
- Tipo: `Web Service`
- Repositorio: `Harlen539/Projeto_Loja_BigSmoke`
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command: `npm start`
- Health Check Path: `/health`

## O backend real do projeto

O backend desta base esta em `backend/`.

Arquivos principais:

- `backend/package.json`
- `backend/src/server.js`
- `backend/src/app.js`
- `backend/prisma/schema.prisma`

## Configuracao no Render

Crie um `Web Service` com:

```text
Name: bigsmoke-backend
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: npm start
Health Check Path: /health
```

## Variaveis de ambiente no Render

Obrigatorias:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=URL_DO_SUPABASE_POOLER_OU_RENDER_POSTGRES
JWT_SECRET=GERAR_UM_SEGREDO_FORTE
ADMIN_EMAIL=EMAIL_DO_ADMIN
ALLOWED_ORIGINS=https://bigsmokestyle.vercel.app,https://bigsmokestyle-admin.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:3000
ABACATEPAY_API_KEY=CHAVE_REAL_DA_ABACATEPAY
ABACATEPAY_WEBHOOK_SECRET=SECRET_DO_WEBHOOK
FRONTEND_URL=https://bigsmokestyle.vercel.app
ADMIN_URL=https://bigsmokestyle-admin.vercel.app
PUBLIC_BACKEND_URL=https://URL_DO_BACKEND_NO_RENDER
```

Recomendadas:

```env
DIRECT_URL=URL_DIRETA_DO_SUPABASE
ADMIN_PASSWORD_HASH=HASH_BCRYPT_DA_SENHA
ABACATEPAY_WEBHOOK_PUBLIC_KEY=CHAVE_PUBLICA_DO_WEBHOOK_SE_USAR_ASSINATURA
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v1
ABACATEPAY_API_URL=https://api.abacatepay.com/v2
STORE_CITY=Joao Pessoa
STORE_STATE=PB
STORE_ORIGIN_CEP=CEP_DE_ORIGEM
WHATSAPP_NUMBER=5583986494691
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_SE_USAR_STORAGE
SUPABASE_BUCKET=product-images
```

Observacoes:

- `DIRECT_URL` e opcional, mas recomendado para migrations Prisma.
- Em producao o backend exige `DATABASE_URL` e nao usa fallback de `orders.json`.
- `ADMIN_PASSWORD_HASH` e preferivel a `ADMIN_PASSWORD`.
- `ABACATEPAY_API_KEY`, `DATABASE_URL` e `JWT_SECRET` ficam somente no backend.

## Prisma e banco

O projeto ja esta configurado para usar PostgreSQL via Prisma:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

No deploy o Render deve executar:

```bash
npx prisma generate
npx prisma migrate deploy
```

## Vercel das frontends

Loja (`frontend-loja`):

```env
VITE_API_URL=https://URL_DO_BACKEND_NO_RENDER
```

Admin (`frontend-admin`):

```env
VITE_API_URL=https://URL_DO_BACKEND_NO_RENDER
```

## Webhook da AbacatePay

Configure o webhook para apontar para:

```text
https://URL_DO_BACKEND_NO_RENDER/api/webhooks/abacatepay
```

O backend aceita:

- `x-webhook-secret: <ABACATEPAY_WEBHOOK_SECRET>`
- assinatura HMAC quando `ABACATEPAY_WEBHOOK_PUBLIC_KEY` estiver configurada

## Testes depois do deploy

1. Health:

```bash
curl https://URL_DO_BACKEND_NO_RENDER/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "bigsmoke-backend"
}
```

2. Diagnostics:

```bash
curl https://URL_DO_BACKEND_NO_RENDER/healthz
```

3. Fluxo funcional:

- criar/editar produto no admin
- criar pedido
- finalizar compra na loja
- gerar checkout ou PIX da AbacatePay
- enviar webhook e confirmar que o pedido muda para `paid`

## Comandos locais

```bash
cd backend
npm install
npm run prisma:generate
npm test
npm run dev
```
