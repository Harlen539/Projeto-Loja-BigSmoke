# BigSmoke Organizado

Este diretório reorganiza o projeto original em três partes: painel administrativo, loja pública e backend Node.js.

## Estrutura

```text
bigsmoke-organizado/
├── frontend-admin/
│   ├── package.json
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── assets/
│       ├── imagens/
│       ├── index.html
│       ├── script.js
│       └── style.css
├── frontend-loja/
│   ├── package.json
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── assets/
│       ├── imagens/
│       ├── loja/
│       ├── index.html
│       ├── script.js
│       ├── Style.css
│       ├── manifest.webmanifest
│       ├── robots.txt
│       └── sitemap.xml
├── backend/
│   ├── package.json
│   ├── test/
│   └── src/
│       ├── data/
│       ├── scripts/
│       ├── supabase/
│       └── server.js
└── README.md
```

Arquivos `.bak`, `*.err.log` e `*.out.log` foram ignorados. Os arquivos `.env.example` e `.env.local.example` foram copiados para `backend/`, `frontend-admin/` e `frontend-loja/`.

## Como rodar

Instale as dependências em cada parte:

```bash
cd backend
npm install
npm run dev
```

O backend sobe em `http://localhost:3000` por padrão e também serve a loja em `/loja/`, o admin em `/admin/`, os assets e as rotas de API.

Para abrir cada frontend separadamente com Vite:

```bash
cd frontend-loja
npm install
npm run dev
```

```bash
cd frontend-admin
npm install
npm run dev
```

## Observações

O backend foi ajustado para servir os arquivos estáticos a partir da nova estrutura:

- `/loja/` aponta para `frontend-loja/src/`
- `/admin/` aponta para `frontend-admin/src/`
- `/assets/`, `/imagens/`, `Style.css`, `script.js`, `manifest.webmanifest`, `robots.txt` e `sitemap.xml` continuam disponíveis para manter as páginas originais funcionando.

Os diretórios `pages/` e `components/` foram criados para futuras migrações React sem alterar a funcionalidade atual.
