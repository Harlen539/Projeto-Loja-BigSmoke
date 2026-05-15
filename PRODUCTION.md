# BigSmoke production setup

Production targets:

- Storefront: Vercel project `bigsmokestyle`
- API: Render web service `bigsmokestyle-api`
- Database/storage: Supabase through backend-only credentials
- Payments: AbacatePay through backend-only credentials

## URLs

- Storefront: `https://bigsmokestyle.vercel.app`
- API: `https://bigsmokestyle-api.onrender.com`
- Healthcheck: `https://bigsmokestyle-api.onrender.com/healthz`
- Webhook: `https://bigsmokestyle-api.onrender.com/api/webhooks/abacatepay`

## Render API service

Use the root `render.yaml` as a Blueprint, or configure the service manually:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Healthcheck path: `/healthz`

Required backend variables are listed in `backend/.env.production.example`.
Keep AbacatePay, Supabase, JWT, and admin secrets only in Render.

## Vercel storefront

The storefront is deployed from `frontend-loja`.

Production environment variable:

```env
VITE_API_URL=https://bigsmokestyle-api.onrender.com
```

Do not add payment or database secrets to Vercel.

## Payment callbacks

In AbacatePay, configure the webhook endpoint as:

```text
https://bigsmokestyle-api.onrender.com/api/webhooks/abacatepay
```

Subscribe to payment events:

- `transparent.completed`
- `checkout.completed`
- `transparent.refunded`
- `checkout.refunded`
- `transparent.lost`
- `checkout.lost`

The storefront calls `POST /api/checkout/session`. PIX returns QR Code/copia-e-cola. Card returns the hosted checkout URL when the AbacatePay account/API allows card payments.
