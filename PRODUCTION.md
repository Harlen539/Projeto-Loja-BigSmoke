# BigSmoke production setup

Production targets:

- Storefront: Vercel project `bigsmokestyle`
- API: Render web service `bigsmokestyle-api`
- Database: Supabase Postgres, accessed by Prisma through `DATABASE_URL`
- Product image storage: Supabase Storage bucket `product-images`

## URLs

- Storefront: `https://bigsmokestyle.vercel.app`
- Admin: `https://bigsmokestyle-admin.vercel.app`
- API: `https://bigsmokestyle-api.onrender.com`
- Healthcheck: `https://bigsmokestyle-api.onrender.com/healthz`

If Render creates a different public URL, update these variables:

- Render: `BACKEND_URL`
- Render: `ALLOWED_ORIGINS`
- Vercel: `VITE_API_URL`
- `frontend-loja/.env.production.example`
- `frontend-admin/.env.production.example`

## Supabase

Use Supabase Postgres through Prisma in production. This avoids the local JSON fallback and keeps orders, products, and the order counter persistent.

1. Create or open the Supabase project.
2. Create a database user/password for Prisma.
3. Copy the Supavisor Session pooler URL on port `5432`.
4. Set Render `DATABASE_URL` with that URL.
5. Create a Storage bucket named `product-images`.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in Render.

Render runs migrations with:

```bash
npx prisma migrate deploy
```

## Render API service

Use the root `render.yaml` as a Blueprint.

- Root directory: `backend`
- Build command: `npm ci && npx prisma generate`
- Pre-deploy command: `npx prisma migrate deploy`
- Start command: `npm start`
- Healthcheck path: `/healthz`

Required secret variables in Render:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `GOOGLE_CLIENT_ID`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ABACATEPAY_API_KEY`
- `ABACATEPAY_WEBHOOK_SECRET`

Render generates `JWT_SECRET` from the Blueprint. If you create the service manually, generate it with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate the admin password hash with:

```bash
node -e "require('bcryptjs').hash('YOUR_PASSWORD', 12).then(console.log)"
```

## Vercel storefront

The storefront is deployed from `frontend-loja`.

Production environment variables:

- `VITE_API_URL=https://bigsmokestyle-api.onrender.com`
- `VITE_WHATSAPP_NUMBER=5583986494691`
- `VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com`

The build publishes:

- `/`
- `/src/produto.html`
- `/src/pedidos.html`
- `/src/perfil.html`
- `/src/politica.html`

Old `/loja/...` paths redirect to the root storefront paths.

## Admin frontend

The admin app is ready to deploy as a separate Vercel project from `frontend-admin`.

Production URL:

- `https://bigsmokestyle-admin.vercel.app`

Production environment variables:

- `VITE_API_URL=https://bigsmokestyle-api.onrender.com`
- `VITE_STORE_URL=https://bigsmokestyle.vercel.app`

## Payment callbacks

In Abacate Pay, configure webhook/callback URLs to the Render API:

- `https://bigsmokestyle-api.onrender.com/api/payments/abacatepay/webhook`

The storefront calls:

- `POST /api/payments/abacatepay/checkout`

For card checkout, the API returns the hosted payment URL. For Pix, the API returns QR Code data and copia-e-cola for the storefront modal.
