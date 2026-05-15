# BigSmoke Style

Loja virtual de streetwear desenvolvida com **React + Vite** no frontend e **Node.js + Express** no backend. O projeto possui vitrine para clientes, painel administrativo, gerenciamento de produtos e pedidos, integração com pagamentos via **AbacatePay**, autenticação de administrador, suporte a login com Google, persistência com **Prisma/PostgreSQL/Supabase** e configuração de deploy para **Vercel** e **Render**.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## Sobre o projeto

O **BigSmoke Style** é uma aplicação full stack para uma loja online de roupas/streetwear. A solução foi separada em três aplicações principais:

1. **Loja do cliente**: vitrine de produtos, carrinho, checkout, perfil e pedidos.
2. **Painel administrativo**: dashboard, produtos, pedidos, gráficos e configurações.
3. **Backend/API**: autenticação, produtos, pedidos, checkout, pagamentos, upload de imagens e webhooks.

O projeto foi preparado para funcionar localmente durante o desenvolvimento e também em produção com banco PostgreSQL, storage externo e backend público via HTTPS.

---

## Funcionalidades

### Loja do cliente

- Listagem de produtos.
- Página de detalhes do produto.
- Carrinho de compras.
- Checkout com endereço e método de pagamento.
- Integração com AbacatePay para PIX e cartão, conforme configuração da conta.
- Área de perfil do cliente.
- Página de pedidos.
- Suporte a múltiplos idiomas por arquivos de locale.
- Assets próprios da marca BigSmoke.

### Painel administrativo

- Login administrativo com JWT.
- Dashboard com indicadores.
- Gerenciamento de produtos.
- Upload de imagens de produtos.
- Gerenciamento de pedidos.
- Atualização de status dos pedidos.
- Pedidos manuais.
- Tela de gráficos com Recharts.
- Configurações da loja.

### Backend

- API REST com Express.
- Segurança com Helmet, CORS e rate limiting.
- Autenticação com JWT.
- Login com Google preparado via `google-auth-library`.
- Integração com Prisma/PostgreSQL.
- Suporte a Supabase para banco/storage.
- Fallback local em JSON para desenvolvimento.
- Integração com AbacatePay.
- Recebimento de webhooks de pagamento.
- Integração opcional com Twilio/WhatsApp.
- Health checks para produção.

---

## Tecnologias utilizadas

### Frontend

- React 18
- Vite 7
- React Router DOM
- Context API
- CSS modular/arquivos de estilo do projeto
- Recharts no painel admin
- Supabase Client no frontend da loja

### Backend

- Node.js 20+
- Express
- Prisma ORM
- PostgreSQL/Supabase
- JWT
- BcryptJS
- Helmet
- CORS
- Express Rate Limit
- Multer
- Sharp
- Google Auth Library
- Twilio

### Deploy e infraestrutura

- Vercel para os frontends
- Render para o backend
- Supabase para PostgreSQL e Storage
- AbacatePay para pagamentos
- Render Blueprint via `render.yaml`

---

## Estrutura do projeto

```txt
Projeto_Loja_BigSmoke/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── supabase/
│   ├── .env.example
│   ├── .env.production.example
│   └── package.json
│
├── frontend-loja/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── locales/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── .env.example
│   └── package.json
│
├── frontend-admin/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── .env.example
│   └── package.json
│
├── DEPLOY.md
├── DEPLOY_RENDER.md
├── PRODUCTION.md
├── render.yaml
└── README.md
