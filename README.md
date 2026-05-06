# BigSmoke Project

Loja de streetwear BigSmoke — React.js + Vite (frontend-loja e frontend-admin) com Node.js/Express (backend).

## Estrutura

```text
bigsmoke-project/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── test/
│   └── src/
│       ├── app.js
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── data/
│       ├── scripts/
│       └── supabase/
├── frontend-loja/
│   ├── index.html
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── locales/
│       ├── pages/
│       ├── services/
│       └── styles/
├── frontend-admin/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── styles/
├── .gitignore
└── README.md
```

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Conta no Supabase (obrigatório em produção)
- Conta no Stripe (para pagamentos)

## Setup local de desenvolvimento

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações locais
npm run dev

# Frontend da loja
cd frontend-loja
npm install
cp .env.example .env
npm run dev

# Frontend admin
cd frontend-admin
npm install
cp .env.example .env
npm run dev
```

### URLs em desenvolvimento

| Serviço | URL |
|---------|-----|
| Loja | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3000 |

### Login local (desenvolvimento)

Quando não houver variáveis customizadas:

- **E-mail:** `admin@bigsmoke.local`
- **Senha:** defina `ADMIN_PASSWORD` no `.env` (mínimo 12 caracteres)

---

## ✅ Checklist de Deploy para Produção

Antes de subir em produção, confirme **todos** os itens abaixo:

### Segurança (obrigatório)

- [ ] `JWT_SECRET` com pelo menos 64 caracteres aleatórios
- [ ] `ADMIN_PASSWORD_HASH` gerado com bcrypt (não use `ADMIN_PASSWORD` em prod)
- [ ] `ADMIN_EMAIL` trocado para o e-mail real
- [ ] `ALLOWED_ORIGINS` com os domínios reais da loja e do admin
- [ ] `NODE_ENV=production` definido no servidor

### Stripe

- [ ] `STRIPE_SECRET_KEY` com chave live (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no dashboard Stripe
- [ ] Webhook do Stripe apontando para `https://seu-dominio.com/api/stripe/webhook`
- [ ] `STRIPE_MOCK=false`

### Banco de dados (obrigatório em produção)

- [ ] `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configurados
- [ ] Schema do Supabase aplicado (`backend/src/supabase/schema.sql`)
- [ ] Bucket `product-images` criado no Supabase Storage

### Frontend

- [ ] `VITE_API_URL` nas duas frontends apontando para a URL de produção do backend
- [ ] `sitemap.xml` com URLs reais (não localhost)
- [ ] `manifest.webmanifest` com URLs reais e ícones de PWA
- [ ] Logo convertida para WebP para melhor performance
- [ ] Arquivos legados removidos de `frontend-loja/src/`: `script.js`, `produto.js`, `*.html` (exceto `index.html` na raiz)
- [ ] Pastas duplicadas `src/imagens/` removidas (usar apenas `src/assets/`)

### Build e deploy

```bash
# Build dos frontends
cd frontend-loja && npm run build
cd frontend-admin && npm run build

# Backend (produção)
cd backend
npm install --omit=dev
npm start
```

---

## Geração de hash de senha (bcrypt)

```bash
node -e "require('bcryptjs').hash('SUA_SENHA_AQUI', 12).then(h => console.log(h))"
```

## Geração de JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Rodando os testes

```bash
cd backend
npm test
```
