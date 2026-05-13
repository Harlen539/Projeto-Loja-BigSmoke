import logo from "../../assets/logo_sem_fundo.png";

function parseSizes(value, fallback) {
  const sizes = Array.isArray(value)
    ? value
    : String(value || "").split(",").map((size) => size.trim()).filter(Boolean);

  return Array.from(new Set([...(sizes.length ? sizes : []), fallback].filter(Boolean)));
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 4h6l1 2h4" />
      <path d="M4 6h16" />
      <path d="M18 6l-1 14H7L6 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export function CartItem({ item, onQuantity, onRemove, onSize }) {
  const sizes = parseSizes(item.sizes, item.size);

  return (
    <li className="cart-item">
      <div className="cart-item-media">
        <img src={item.image || logo} alt={item.name} onError={(event) => { event.currentTarget.src = logo; }} />
      </div>
      <div className="cart-item-main">
        <strong>{item.name}</strong>
        <span className="cart-item-category">{item.category || "Streetwear BigSmoke"}</span>
        <label className="cart-item-size-row">
          <span className="cart-item-size-label">Tamanho</span>
          <select
            aria-label={`Tamanho de ${item.name}`}
            className="cart-item-size-select"
            onChange={(event) => onSize(event.target.value)}
            value={item.size || sizes[0] || "Unico"}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="cart-item-controls">
        <div className="qty-controls">
          <button aria-label="Diminuir quantidade" onClick={() => onQuantity(item.quantity - 1)} type="button">-</button>
          <span className="qty-value">{item.quantity}</span>
          <button aria-label="Aumentar quantidade" onClick={() => onQuantity(item.quantity + 1)} type="button">+</button>
        </div>
        <button className="remove-item" onClick={onRemove} type="button" aria-label="Remover item">
          <TrashIcon />
        </button>
        <span className="cart-item-price">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
      </div>
    </li>
  );
}
