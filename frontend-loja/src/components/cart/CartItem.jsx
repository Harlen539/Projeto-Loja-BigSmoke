import logo from "../../assets/logo_sem_fundo.png";

export function CartItem({ item, onQuantity, onRemove }) {
  return (
    <li className="cart-item">
      <img src={item.image || logo} alt={item.name} onError={(event) => { event.currentTarget.src = logo; }} />
      <div>
        <strong>{item.name}</strong>
        <span>Tamanho {item.size}</span>
        <span>R$ {item.price.toFixed(2).replace(".", ",")}</span>
      </div>
      <div className="qty-controls">
        <button onClick={() => onQuantity(item.quantity - 1)} type="button">-</button>
        <span>{item.quantity}</span>
        <button onClick={() => onQuantity(item.quantity + 1)} type="button">+</button>
      </div>
      <button className="remove-item" onClick={onRemove} type="button">Remover</button>
    </li>
  );
}
