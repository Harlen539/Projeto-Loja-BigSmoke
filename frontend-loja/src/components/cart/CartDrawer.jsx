import { useCart } from "../../hooks/useCart.js";
import { CheckoutForm } from "../checkout/CheckoutForm.jsx";
import { CartItem } from "./CartItem.jsx";
import { CartSummary } from "./CartSummary.jsx";

export function CartDrawer() {
  const cart = useCart();
  return (
    <>
      <button className={`cart-overlay ${cart.open ? "open" : ""}`} onClick={() => cart.setOpen(false)} type="button" aria-label="Fechar carrinho" />
      <aside className={`cart-drawer ${cart.open ? "open" : ""}`} aria-hidden={!cart.open}>
        <header>
          <div>
            <span>Carrinho BigSmoke</span>
            <h2>{cart.count} item(ns)</h2>
          </div>
          <button onClick={() => cart.setOpen(false)} type="button">Fechar</button>
        </header>
        {cart.items.length ? (
          <ul className="cart-list">
            {cart.items.map((item) => (
              <CartItem
                item={item}
                key={item.key}
                onQuantity={(quantity) => cart.updateQuantity(item.key, quantity)}
                onRemove={() => cart.remove(item.key)}
              />
            ))}
          </ul>
        ) : <p className="empty-cart">Seu carrinho está vazio.</p>}
        <CartSummary total={cart.total} />
        <CheckoutForm />
      </aside>
    </>
  );
}
