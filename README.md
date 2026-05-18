# BigSmoke Style

Loja virtual de streetwear desenvolvida com **React + Vite** no frontend e **Node.js + Express** no backend. O projeto possui vitrine para clientes, painel administrativo, gerenciamento de produtos e pedidos, integração com pagamentos via **AbacatePay**, autenticação de administrador, suporte a login com Google, persistência com **Prisma/PostgreSQL/Supabase** e configuração de deploy para **Vercel** e **Render**.

---

## Acesse o projeto

### Loja online

🔗 **Deploy da loja:**  
https://bigsmokestyle.vercel.app/

### Repositório

🔗 **GitHub:**  
https://github.com/Harlen539/Projeto_Loja_BigSmoke

---

## Tecnologias

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Sobre o projeto

O **BigSmoke Style** é uma aplicação full stack desenvolvida para uma loja online de roupas streetwear. O sistema foi dividido em três partes principais:

1. **Loja do cliente**  
   Interface pública onde o usuário pode visualizar produtos, adicionar itens ao carrinho, finalizar compras e acompanhar pedidos.

2. **Painel administrativo**  
   Área privada para gerenciamento da loja, produtos, pedidos, status de compra, configurações e análise de dados.

3. **Backend/API**  
   Camada responsável pela autenticação, persistência de dados, integração com pagamentos, upload de imagens, webhooks e regras de negócio.

O projeto foi preparado para rodar tanto em ambiente local de desenvolvimento quanto em produção, utilizando **Vercel**, **Render**, **Supabase** e **AbacatePay**.

---

## Funcionalidades

### Loja do cliente

- Vitrine de produtos.
- Página de detalhes do produto.
- Carrinho de compras.
- Checkout com endereço e método de pagamento.
- Integração com AbacatePay para pagamentos.
- Suporte a PIX e cartão, conforme configuração da conta.
- Área de perfil do cliente.
- Página de pedidos.
- Suporte a múltiplos idiomas por arquivos de locale.
- Layout responsivo para desktop e celular.
- Identidade visual própria da marca BigSmoke.

### Painel administrativo

- Login administrativo com autenticação JWT.
- Dashboard com indicadores da loja.
- Gerenciamento de produtos.
- Cadastro, edição e remoção de produtos.
- Upload de imagens.
- Gerenciamento de pedidos.
- Atualização de status dos pedidos.
- Criação de pedidos manuais.
- Tela de gráficos com Recharts.
- Configurações gerais da loja.

### Backend/API

- API REST com Express.
- Autenticação com JWT.
- Criptografia de senha com BcryptJS.
- Segurança com Helmet, CORS e rate limiting.
- Integração com Prisma ORM.
- Banco PostgreSQL/Supabase.
- Fallback local em JSON para desenvolvimento.
- Integração com AbacatePay.
- Recebimento de webhooks de pagamento.
- Login com Google preparado via `google-auth-library`.
- Upload e tratamento de imagens com Multer e Sharp.
- Integração opcional com Twilio/WhatsApp.
- Health checks para ambiente de produção.

---

## Stack do projeto

### Frontend da loja

- React 18
- Vite 7
- React Router DOM
- Context API
- Supabase Client
- CSS modular/arquivos de estilo próprios
- Componentização por páginas, hooks, contextos e serviços

### Frontend administrativo

- React 18
- Vite 7
- React Router DOM
- Context API
- Recharts
- Serviços de API
- Layout administrativo responsivo

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

- Vercel para os frontends.
- Render para o backend.
- Supabase para PostgreSQL e Storage.
- AbacatePay para pagamentos.
- Render Blueprint via `render.yaml`.

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
````

---

## Como rodar o projeto localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Harlen539/Projeto_Loja_BigSmoke.git
cd Projeto_Loja_BigSmoke
```

---

## Rodando o backend

### 1. Acesse a pasta do backend

```bash
cd backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` com base no arquivo `.env.example`.

Exemplo:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL="sua_url_do_banco_postgresql"

JWT_SECRET="sua_chave_jwt"
ADMIN_EMAIL="admin@bigsmoke.com"
ADMIN_PASSWORD_HASH="hash_da_senha_admin"

ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"

ABACATEPAY_API_KEY="sua_chave_abacatepay"
ABACATEPAY_WEBHOOK_SECRET="seu_webhook_secret"

GOOGLE_CLIENT_ID="seu_google_client_id"

SUPABASE_URL="sua_url_supabase"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
SUPABASE_BUCKET="seu_bucket"
```

### 4. Execute as migrations do Prisma

```bash
npx prisma migrate deploy
```

ou, em ambiente de desenvolvimento:

```bash
npx prisma migrate dev
```

### 5. Inicie o backend

```bash
npm run dev
```

O backend ficará disponível em:

```txt
http://localhost:3001
```

---

## Rodando a loja do cliente

### 1. Acesse a pasta do frontend da loja

```bash
cd frontend-loja
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o `.env`

Crie um arquivo `.env` com base no `.env.example`.

Exemplo:

```env
VITE_API_URL="http://localhost:3001"
VITE_SUPABASE_URL="sua_url_supabase"
VITE_SUPABASE_ANON_KEY="sua_anon_key"
VITE_GOOGLE_CLIENT_ID="seu_google_client_id"
```

### 4. Inicie o projeto

```bash
npm run dev
```

A loja ficará disponível em:

```txt
http://localhost:5173
```

---

## Rodando o painel administrativo

### 1. Acesse a pasta do frontend admin

```bash
cd frontend-admin
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o `.env`

Exemplo:

```env
VITE_API_URL="http://localhost:3001"
```

### 4. Inicie o painel

```bash
npm run dev
```

O painel ficará disponível em:

```txt
http://localhost:5174
```

---

## Variáveis de ambiente principais

### Backend

| Variável                    | Descrição                           |
| --------------------------- | ----------------------------------- |
| `NODE_ENV`                  | Ambiente da aplicação               |
| `PORT`                      | Porta do servidor                   |
| `DATABASE_URL`              | URL do banco PostgreSQL/Supabase    |
| `JWT_SECRET`                | Chave secreta para autenticação JWT |
| `ADMIN_EMAIL`               | E-mail do administrador             |
| `ADMIN_PASSWORD_HASH`       | Hash da senha do administrador      |
| `ALLOWED_ORIGINS`           | Domínios permitidos no CORS         |
| `ABACATEPAY_API_KEY`        | Chave da API da AbacatePay          |
| `ABACATEPAY_WEBHOOK_SECRET` | Segredo do webhook da AbacatePay    |
| `GOOGLE_CLIENT_ID`          | Client ID do Google OAuth           |
| `SUPABASE_URL`              | URL do projeto Supabase             |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role do Supabase      |
| `SUPABASE_BUCKET`           | Bucket usado para storage           |

### Frontend da loja

| Variável                 | Descrição                      |
| ------------------------ | ------------------------------ |
| `VITE_API_URL`           | URL pública do backend         |
| `VITE_SUPABASE_URL`      | URL do Supabase                |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon do Supabase |
| `VITE_GOOGLE_CLIENT_ID`  | Client ID do Google OAuth      |

### Frontend admin

| Variável       | Descrição              |
| -------------- | ---------------------- |
| `VITE_API_URL` | URL pública do backend |

---

## Deploy

### Frontend

Os frontends podem ser publicados na **Vercel**:

* `frontend-loja`
* `frontend-admin`

Cada aplicação deve ter suas próprias variáveis de ambiente configuradas no painel da Vercel.

### Backend

O backend pode ser publicado no **Render**, usando configuração manual ou o arquivo `render.yaml`.

Principais pontos para produção:

* Usar banco PostgreSQL real.
* Configurar `DATABASE_URL`.
* Configurar `JWT_SECRET`.
* Configurar `ALLOWED_ORIGINS` com os domínios da Vercel.
* Configurar chaves da AbacatePay.
* Configurar webhook de pagamento.
* Rodar migrations do Prisma.
* Usar HTTPS público para o backend.

---

## Pagamentos

A integração de pagamento é feita com a **AbacatePay**.

O fluxo esperado é:

1. Cliente adiciona produtos ao carrinho.
2. Cliente finaliza o pedido no checkout.
3. Backend cria a cobrança na AbacatePay.
4. Cliente é redirecionado ou recebe as informações de pagamento.
5. AbacatePay envia o webhook para o backend.
6. Backend atualiza o status do pedido.
7. Cliente consegue acompanhar o pedido na área de pedidos.

---

## Segurança

O backend conta com recursos básicos de proteção:

* Helmet para headers HTTP.
* CORS configurável.
* Rate limiting.
* JWT para autenticação.
* Senha administrativa com hash.
* Separação de variáveis sensíveis em `.env`.
* Webhook secret para validação de pagamentos.
* Configuração de produção separada do ambiente local.

---

## Status do projeto

O projeto está em desenvolvimento e possui estrutura preparada para produção.

Principais módulos implementados ou preparados:

* Loja do cliente.
* Painel administrativo.
* Backend/API.
* Banco com Prisma/PostgreSQL.
* Integração com Supabase.
* Integração com AbacatePay.
* Deploy na Vercel.
* Deploy do backend no Render.
* Webhooks de pagamento.
* Login administrativo.
* Login com Google preparado.

---

## Melhorias futuras

Algumas melhorias que podem ser adicionadas futuramente:

* Sistema completo de autenticação de cliente.
* Recuperação de senha.
* Histórico detalhado de pedidos.
* Cupons de desconto.
* Controle de estoque avançado.
* Dashboard financeiro.
* Filtros avançados de produtos.
* Avaliações de produtos.
* Notificações por WhatsApp/e-mail.
* Testes automatizados.
* Melhorias de SEO.
* Página institucional da marca.

---

## Autor

Desenvolvido por **Harlen Galdino**.

* GitHub: [https://github.com/Harlen539](https://github.com/Harlen539)
* LinkedIn: [https://www.linkedin.com/in/harlen-galdino-527ba9349](https://www.linkedin.com/in/harlen-galdino-527ba9349)
* E-mail: [harlengaldino3@gmail.com](mailto:harlengaldino3@gmail.com)

---


