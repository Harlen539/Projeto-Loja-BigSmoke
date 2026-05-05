# BigSmoke Organizado

Projeto da loja BigSmoke reorganizado em quatro partes: painel administrativo, loja publica, backend Node.js e area de developers para testes.

## Estrutura

```text
bigsmoke-organizado/
|-- backend/
|   |-- package.json
|   |-- test/
|   `-- src/
|       |-- data/
|       |-- scripts/
|       |-- supabase/
|       `-- server.js
|-- developers/
|   |-- README.md
|   |-- api-tests.http
|   |-- local.env.example
|   `-- test-checklist.md
|-- frontend-admin/
|   |-- package.json
|   `-- src/
|       |-- assets/
|       |-- imagens/
|       |-- index.html
|       |-- script.js
|       `-- style.css
|-- frontend-loja/
|   |-- package.json
|   `-- src/
|       |-- assets/
|       |-- imagens/
|       |-- index.html
|       |-- script.js
|       |-- Style.css
|       |-- manifest.webmanifest
|       |-- robots.txt
|       `-- sitemap.xml
`-- README.md
```

## Como rodar

Instale as dependencias e suba o backend:

```bash
cd backend
npm install
npm run dev
```

O backend sobe em `http://localhost:3000` por padrao e tambem serve:

- Loja: `http://localhost:3000/loja/index.html`
- Admin: `http://localhost:3000/admin/index.html`
- Health check: `http://localhost:3000/healthz`

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

## Area developers

A pasta `developers/` tem arquivos para testar o projeto:

- `developers/api-tests.http`: requests prontos para API.
- `developers/local.env.example`: variaveis locais de exemplo.
- `developers/test-checklist.md`: checklist manual de testes.

## Observacoes

O backend serve os arquivos estaticos a partir da estrutura organizada:

- `/loja/` aponta para `frontend-loja/src/`
- `/admin/` aponta para `frontend-admin/src/`
- `/assets/`, `/imagens/`, `Style.css`, `script.js`, `manifest.webmanifest`, `robots.txt` e `sitemap.xml` continuam disponiveis para manter as paginas originais funcionando.

Arquivos sensiveis e gerados localmente ficam fora do Git via `.gitignore`, incluindo `.env`, `node_modules/`, uploads e logs.
