import { useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { startStripeCheckout } from "../../services/checkout.js";
import { CartItem } from "./CartItem.jsx";
import { CartSummary } from "./CartSummary.jsx";

export function CartDrawer() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);

  async function goToStripe() {
    setLoading(true);
    try {
      await startStripeCheckout(cart.items);
    } catch (error) {
      alert(error.message || "Nao foi possivel abrir o Stripe Checkout.");
      setLoading(false);
    }
  }

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
        ) : <p className="empty-cart">Seu carrinho esta vazio.</p>}
        <CartSummary total={cart.total} />
        <button className="btn btn-primary full-width" disabled={!cart.items.length || loading} onClick={goToStripe} type="button">
          {loading ? "Abrindo Stripe..." : "Ir direto para o Stripe"}
        </button>
      </aside>
    </>
  );
}
