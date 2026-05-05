# Checklist de Testes

## Backend

- [ ] `GET /healthz` retorna `ok: true`.
- [ ] `GET /api/config` retorna configuracao da loja.
- [ ] `GET /api/products` retorna produtos ativos.
- [ ] `npm test` executa sem falhas dentro de `backend/`.

## Loja

- [ ] Abrir `http://localhost:3000/loja/index.html`.
- [ ] Produtos aparecem na vitrine.
- [ ] Pagina de produto abre corretamente.
- [ ] Carrinho adiciona e remove itens.
- [ ] Checkout em modo mock nao quebra a navegacao.

## Admin

- [ ] Abrir `http://localhost:3000/admin/index.html`.
- [ ] Login local funciona com `admin@bigsmoke.local` e `admin123`.
- [ ] Listagem de produtos carrega.
- [ ] Criar, editar e excluir produto funciona.
- [ ] Listagem de pedidos carrega.

## GitHub

- [ ] `git status` esta limpo antes do push.
- [ ] Branch `main` esta atualizada no remoto.
