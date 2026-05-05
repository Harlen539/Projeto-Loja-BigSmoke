# Area Developers

Esta pasta concentra arquivos para testar o projeto BigSmoke durante o desenvolvimento.

## Rodar local

No terminal:

```bash
cd backend
npm install
npm run dev
```

Depois acesse:

- Loja: http://localhost:3000/loja/index.html
- Admin: http://localhost:3000/admin/index.html
- Health check: http://localhost:3000/healthz

## Login admin local

Se nenhuma variavel de admin for configurada, o backend usa:

- E-mail: `admin@bigsmoke.local`
- Senha: `admin123`

Para o JWT funcionar em ambiente local, configure uma chave com pelo menos 32 caracteres:

```bash
JWT_SECRET=bigsmoke-local-secret-12345678901234567890
```

## Arquivos de teste

- `api-tests.http`: requests prontos para testar a API no VS Code com a extensao REST Client.
- `test-checklist.md`: checklist manual de loja, admin e API.
- `local.env.example`: exemplo de variaveis locais para desenvolvimento.

## Comandos uteis

```bash
cd backend
npm test
```

```bash
cd frontend-loja
npm run build
```

```bash
cd frontend-admin
npm run build
```
