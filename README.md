# BigSmoke Project

Loja de streetwear BigSmoke refatorada para React.js + Vite nos dois frontends e Node.js/Express no backend.

## Estrutura

```text
bigsmoke-project/
|-- backend/
|   |-- server.js
|   |-- package.json
|   |-- test/
|   `-- src/
|       |-- app.js
|       |-- controllers/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       |-- data/
|       |-- scripts/
|       `-- supabase/
|-- frontend-loja/
|   |-- index.html
|   |-- vite.config.js
|   |-- public/
|   `-- src/
|       |-- components/
|       |-- context/
|       |-- hooks/
|       |-- locales/
|       |-- pages/
|       |-- services/
|       `-- styles/
|-- frontend-admin/
|   |-- index.html
|   |-- vite.config.js
|   `-- src/
|       |-- components/
|       |-- context/
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       `-- styles/
|-- .gitignore
`-- README.md
```

## Pré-requisitos

- Node.js >= 18
- npm >= 9

## Setup rápido

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

```bash
cd frontend-loja
npm install
cp .env.example .env
npm run dev
```

```bash
cd frontend-admin
npm install
cp .env.example .env
npm run dev
```

## URLs

- Loja: http://localhost:5173
- Admin: http://localhost:5174
- API: http://localhost:3000

## Login local do admin

Quando não houver variáveis customizadas no backend:

- E-mail: `admin@bigsmoke.local`
- Senha: `admin123`
