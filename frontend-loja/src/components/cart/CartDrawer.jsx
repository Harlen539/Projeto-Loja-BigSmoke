import { useEffect, useMemo, useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { apiFetch } from "../../services/api.js";
import { startPaymentCheckout } from "../../services/checkout.js";
import { CartItem } from "./CartItem.jsx";
import { CartSummary } from "./CartSummary.jsx";

export function CartDrawer() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");

  useEffect(() => {
    apiFetch("/api/coupons")
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]));
  }, []);

  const discountPreview = useMemo(() => {
    if (!appliedCoupon) return { productDiscount: 0, shippingDiscount: 0, totalDiscount: 0 };
    const subtotal = Number(cart.total || 0);
    const shipping = 0;
    const orderBase = subtotal + shipping;
    if (orderBase < Number(appliedCoupon.minOrderValue || 0)) {
      return { productDiscount: 0, shippingDiscount: 0, totalDiscount: 0 };
    }
    const target = appliedCoupon.target || "products";
    const productBase = target === "shipping" ? 0 : subtotal;
    const shippingBase = target === "products" ? 0 : shipping;
    const discountBase = productBase + shippingBase;
    const rawDiscount = appliedCoupon.type === "percent"
      ? discountBase * (Number(appliedCoupon.value || 0) / 100)
      : Number(appliedCoupon.value || 0);
    const totalDiscount = Math.min(discountBase, Math.max(0, rawDiscount));
    const productDiscount = discountBase > 0 ? Math.min(productBase, totalDiscount * (productBase / discountBase)) : 0;
    return {
      productDiscount,
      shippingDiscount: Math.max(0, totalDiscount - productDiscount),
      totalDiscount
    };
  }, [appliedCoupon, cart.total]);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const coupon = coupons.find((item) => item.code === code && item.active !== false);
    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("");
      return;
    }
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage("Cupom nao encontrado ou inativo.");
      return;
    }
    if (Number(cart.total || 0) < Number(coupon.minOrderValue || 0)) {
      setAppliedCoupon(null);
      setCouponMessage(`Pedido minimo de R$ ${Number(coupon.minOrderValue || 0).toFixed(2).replace(".", ",")}.`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponMessage("Cupom aplicado.");
  }

  async function goToPayment() {
    setLoading(true);
    try {
      await startPaymentCheckout(cart.items, appliedCoupon?.code || "", paymentMethod);
    } catch (error) {
      alert(error.message || "Nao foi possivel iniciar o pagamento.");
    } finally {
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
        <div className="coupon-box">
          <label>
            <span>Aplique o cupom de desconto</span>
            <div>
              <input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Ex: BIG10" />
              <button onClick={applyCoupon} type="button">Aplicar</button>
            </div>
          </label>
          {coupons.length ? (
            <div className="coupon-suggestions">
              {coupons.slice(0, 3).map((coupon) => (
                <button key={coupon.id} onClick={() => { setCouponInput(coupon.code); setAppliedCoupon(coupon); setCouponMessage("Cupom aplicado."); }} type="button">
                  {coupon.code}
                </button>
              ))}
            </div>
          ) : null}
          {couponMessage ? <small className={appliedCoupon ? "success" : "error"}>{couponMessage}</small> : null}
        </div>
        <CartSummary discount={discountPreview.totalDiscount} shippingDiscount={discountPreview.shippingDiscount} subtotal={cart.total} />
        <div className="payment-method-picker" aria-label="Forma de pagamento">
          <button className={paymentMethod === "pix" ? "active" : ""} onClick={() => setPaymentMethod("pix")} type="button">
            PIX
          </button>
          <button className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")} type="button">
            Cartao de credito
          </button>
        </div>
        <button className="btn btn-primary full-width" disabled={!cart.items.length || loading} onClick={goToPayment} type="button">
          {loading ? (paymentMethod === "card" ? "Abrindo cartao..." : "Gerando PIX...") : (paymentMethod === "card" ? "Pagar com cartao" : "Pagar com PIX")}
        </button>
      </aside>
    </>
  );
}
