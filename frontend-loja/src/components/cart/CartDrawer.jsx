import { useEffect, useMemo, useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { apiFetch } from "../../services/api.js";
import { startPaymentCheckout } from "../../services/checkout.js";
import cardIcon from "../../assets/icone_cartao_credito.png";
import pixIcon from "../../assets/icone_Pix.png";
import { CartItem } from "./CartItem.jsx";
import { CartSummary } from "./CartSummary.jsx";

function CartHeader({ onClose }) {
  return (
    <header className="cart-drawer-header">
      <div>
        <span>PEDIDO</span>
        <h2>Carrinho</h2>
      </div>
      <button className="cart-close" onClick={onClose} type="button" aria-label="Fechar carrinho">x</button>
    </header>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Z" />
      <path d="M8.5 8.5h.01" />
    </svg>
  );
}

function CouponCard({ coupons, couponInput, couponMessage, hasAppliedCoupon, onApply, onInput, onPickCoupon }) {
  const suggestions = coupons.length ? coupons.slice(0, 3) : [{ code: "BIG10" }, { code: "STREET20" }];

  return (
    <section className="coupon-box" aria-label="Cupom de desconto">
      <label htmlFor="cart-coupon-code">
        <TagIcon />
        <span>Cupom de desconto</span>
      </label>
      <div className="coupon-input-row">
        <input
          autoComplete="off"
          id="cart-coupon-code"
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onApply();
          }}
          placeholder="EX: BIG10"
          value={couponInput}
        />
        <button onClick={onApply} type="button">Aplicar</button>
      </div>
      <div className="coupon-suggestions" aria-label="Cupons sugeridos">
        {suggestions.map((coupon) => (
          <button key={coupon.id || coupon.code} onClick={() => onPickCoupon(coupon)} type="button">
            {coupon.code}
          </button>
        ))}
      </div>
      {couponMessage ? <small className={hasAppliedCoupon ? "success" : "error"}>{couponMessage}</small> : null}
    </section>
  );
}

function PaymentMethodSelector({ paymentMethod, onSelect }) {
  return (
    <section className="payment-method-card" aria-label="Forma de pagamento">
      <h3>Forma de pagamento</h3>
      <div className="payment-method-picker">
        <button
          aria-pressed={paymentMethod === "card"}
          className={paymentMethod === "card" ? "active" : ""}
          data-payment-method="card"
          onClick={() => onSelect("card")}
          type="button"
        >
          <img className="payment-method-icon" src={cardIcon} alt="" aria-hidden="true" />
          <span>Cartao</span>
        </button>
        <button
          aria-pressed={paymentMethod === "pix"}
          className={paymentMethod === "pix" ? "active" : ""}
          data-payment-method="pix"
          onClick={() => onSelect("pix")}
          type="button"
        >
          <img className="payment-method-icon" src={pixIcon} alt="" aria-hidden="true" />
          <span>PIX</span>
        </button>
      </div>
    </section>
  );
}

function CheckoutActions({ disabled, loading, paymentMethod, whatsappUrl, onCheckout }) {
  return (
    <div className="checkout-actions">
      <button className="btn btn-primary full-width" disabled={disabled || loading} onClick={onCheckout} type="button">
        {loading ? (paymentMethod === "card" ? "Abrindo cartao..." : "Gerando PIX...") : <>FINALIZAR COMPRA <span aria-hidden="true">&gt;</span></>}
      </button>
      <a className="btn btn-outline full-width cart-secondary-link" href={whatsappUrl} target="_blank" rel="noreferrer">Comprar pelo WhatsApp</a>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentMessage, setPaymentMessage] = useState("");

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

  const orderTotal = Math.max(0, Number(cart.total || 0) - Number(discountPreview.totalDiscount || 0));
  const whatsappMessage = encodeURIComponent(`Ola BigSmoke, quero finalizar minha compra.\n${cart.items.map((item) => `- ${item.name} (Tam: ${item.size}) x${item.quantity}`).join("\n")}\nTotal: R$ ${orderTotal.toFixed(2).replace(".", ",")}`);
  const whatsappUrl = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || "5583986494691"}?text=${whatsappMessage}`;

  function applyCoupon(nextCoupon = null) {
    const code = (nextCoupon?.code || couponInput).trim().toUpperCase();
    const coupon = nextCoupon || coupons.find((item) => item.code === code && item.active !== false);
    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("");
      return;
    }
    if (!coupon || coupon.active === false || coupon.value === undefined) {
      setAppliedCoupon(null);
      setCouponInput(code);
      setCouponMessage("Cupom nao encontrado ou inativo.");
      return;
    }
    if (Number(cart.total || 0) < Number(coupon.minOrderValue || 0)) {
      setAppliedCoupon(null);
      setCouponMessage(`Pedido minimo de R$ ${Number(coupon.minOrderValue || 0).toFixed(2).replace(".", ",")}.`);
      return;
    }
    setCouponInput(code);
    setAppliedCoupon(coupon);
    setCouponMessage("Cupom aplicado.");
  }

  const paymentHint = paymentMethod === "pix"
    ? "PIX: ao finalizar, o QR Code e o codigo copia e cola aparecem aqui na loja."
    : "Cartao: ao finalizar, voce sera redirecionado para a pagina segura da Abacate Pay.";

  async function goToPayment() {
    if (!paymentMethod) {
      setPaymentMessage("Escolha PIX ou cartao de credito antes de finalizar.");
      return;
    }
    setPaymentMessage("");
    setLoading(true);
    try {
      await startPaymentCheckout(cart.items, appliedCoupon?.code || "", paymentMethod);
    } catch (error) {
      const message = error.message || "Nao foi possivel iniciar o pagamento.";
      setPaymentMessage(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className={`cart-overlay ${cart.open ? "open" : ""}`} onClick={() => cart.setOpen(false)} type="button" aria-label="Fechar carrinho" />
      <aside className={`cart-drawer ${cart.open ? "open" : ""}`} aria-hidden={!cart.open}>
        <CartHeader onClose={() => cart.setOpen(false)} />
        <div className="cart-drawer-content">
          {cart.items.length ? (
            <ul className="cart-list">
              {cart.items.map((item) => (
                <CartItem
                  item={item}
                  key={item.key}
                  onQuantity={(quantity) => cart.updateQuantity(item.key, quantity)}
                  onRemove={() => cart.remove(item.key)}
                  onSize={(size) => cart.updateSize(item.key, size)}
                />
              ))}
            </ul>
          ) : <p className="empty-cart">Seu carrinho esta vazio.</p>}
          <CouponCard
            couponInput={couponInput}
            couponMessage={couponMessage}
            coupons={coupons}
            hasAppliedCoupon={Boolean(appliedCoupon)}
            onApply={() => applyCoupon()}
            onInput={setCouponInput}
            onPickCoupon={(coupon) => applyCoupon(coupon)}
          />
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onSelect={(method) => {
              setPaymentMethod(method);
              setPaymentMessage("");
            }}
          />
          <CartSummary discount={discountPreview.totalDiscount} shippingDiscount={discountPreview.shippingDiscount} subtotal={cart.total} />
          <small className="payment-method-message">{paymentMessage || paymentHint}</small>
          <CheckoutActions
            disabled={!cart.items.length}
            loading={loading}
            onCheckout={goToPayment}
            paymentMethod={paymentMethod}
            whatsappUrl={whatsappUrl}
          />
        </div>
      </aside>

    </>
  );
}
