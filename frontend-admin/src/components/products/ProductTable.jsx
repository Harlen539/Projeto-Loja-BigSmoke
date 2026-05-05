export function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</td>
              <td>{product.stock ?? 0}</td>
              <td>{product.active === false ? "Inativo" : "Ativo"}</td>
              <td>
                <button onClick={() => onEdit(product)} type="button">Editar</button>
                <button className="danger" onClick={() => onDelete(product)} type="button">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
