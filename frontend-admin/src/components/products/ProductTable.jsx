import logo from "../../assets/logo_sem_fundo.png";

function productImage(product) {
  return product.image || product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || logo;
}

export function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preco</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <img src={productImage(product)} alt="" onError={(event) => { event.currentTarget.src = logo; }} />
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.id}</small>
                  </div>
                </div>
              </td>
              <td>{product.category}</td>
              <td>R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</td>
              <td>{product.stock ?? 0}</td>
              <td>
                <span className={`status-badge ${product.active === false ? "status-danger" : "status-success"}`}>
                  {product.active === false ? "Inativo" : "Ativo"}
                </span>
              </td>
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
