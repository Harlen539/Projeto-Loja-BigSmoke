# Deploy BigSmoke

## Supabase
1. Crie um projeto PostgreSQL no Supabase.
2. Em `Project Settings > Database`, copie:
   - `DATABASE_URL`: use a URL de pooling/connection string para a aplicação.
   - `DIRECT_URL`: use a URL direta para migrations.
3. No diretório `backend`, configure um `.env` local com essas variáveis.
4. Rode:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev
   ```
5. Em produção, o Render deve executar:
   ```bash
   npx prisma migrate deploy
   ```

## Render
1. Crie um `Web Service` apontando para o repositório GitHub.
2. Use `backend` como `Root Directory`.
3. Configure:
   - `Build Command`: `npm install && npx prisma generate && npx prisma migrate deploy`
   - `Start Command`: `npm start`
4. Cadastre as variáveis do backend:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD_HASH`
   - `ALLOWED_ORIGINS=https://bigsmokestyle.vercel.app,https://bigsmokestyle-admin.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:3000`
   - `ABACATEPAY_API_KEY`
   - `ABACATEPAY_WEBHOOK_SECRET`
   - `ABACATEPAY_BASE_URL=https://api.abacatepay.com/v1`
   - `ABACATEPAY_API_URL=https://api.abacatepay.com/v2`
   - `FRONTEND_URL=https://bigsmokestyle.vercel.app`
   - `ADMIN_URL=https://bigsmokestyle-admin.vercel.app`
   - `BACKEND_URL=https://SUA-API-DO-RENDER.onrender.com`
   - `SITE_URL=https://bigsmokestyle.vercel.app`
   - `STORE_URL=https://bigsmokestyle.vercel.app`
   - `STORE_CITY`
   - `STORE_STATE`
   - `STORE_ORIGIN_CEP`
   - `WHATSAPP_NUMBER`
5. Faça o deploy e teste:
   - `GET https://SUA-API-DO-RENDER.onrender.com/health`
   - `GET https://SUA-API-DO-RENDER.onrender.com/api/config`

## Vercel
1. Loja (`frontend-loja`):
   - `VITE_API_URL=https://SUA-API-DO-RENDER.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID` se usar login Google
2. Admin (`frontend-admin`):
   - `VITE_API_URL=https://SUA-API-DO-RENDER.onrender.com`
3. Faça redeploy dos dois projetos na Vercel.
4. Teste:
   - catálogo carregando produtos
   - checkout PIX/cartão
   - painel admin carregando produtos e pedidos

## AbacatePay
1. Cadastre `ABACATEPAY_API_KEY` no Render.
2. Cadastre `ABACATEPAY_WEBHOOK_SECRET` no Render.
3. Configure o webhook da AbacatePay para:
   - `https://SUA-API-DO-RENDER.onrender.com/api/webhooks/abacatepay`
4. Depois do deploy, valide um pagamento PIX real ou sandbox e confirme se o pedido muda para pago no admin.
