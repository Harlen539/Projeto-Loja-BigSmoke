import logo from "../../assets/logo_sem_fundo.png";

export function CartItem({ item, onQuantity, onRemove }) {
  return (
    <li className="cart-item">
      <div className="cart-item-media">
        <img src={item.image || logo} alt={item.name} onError={(event) => { event.currentTarget.src = logo; }} />
      </div>
      <div className="cart-item-main">
        <strong>{item.name}</strong>
        <span>Tamanho {item.size}</span>
      </div>
      <div className="cart-item-controls">
        <div className="qty-controls">
          <button onClick={() => onQuantity(item.quantity - 1)} type="button">-</button>
          <span className="qty-value">{item.quantity}</span>
          <button onClick={() => onQuantity(item.quantity + 1)} type="button">+</button>
        </div>
        <button className="remove-item" onClick={onRemove} type="button" aria-label="Remover item">×</button>
        <span className="cart-item-price">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
      </div>
    </li>
  );
}
