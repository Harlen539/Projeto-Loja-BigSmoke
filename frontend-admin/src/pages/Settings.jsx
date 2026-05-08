import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../context/AuthContext.jsx";
import { apiFetch } from "../services/api.js";
import { getCoupons, getSettings, saveCoupons, saveSettings } from "../services/settingsStorage.js";

const tabs = ["Geral", "Loja", "Pagamentos", "Entrega", "Notificações", "Checkout", "Segurança"];
const emptyCoupon = { id: "", code: "", type: "percent", target: "products", value: "", active: true, minOrderValue: "", usageLimit: "" };
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const icons = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>,
  store: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10h16l-1-6H5l-1 6Z" /><path d="M6 10v10h12V10M9 20v-6h6v6" /><path d="M4 10c0 1.2 1 2 2 2s2-.8 2-2m0 0c0 1.2 1 2 2 2s2-.8 2-2m0 0c0 1.2 1 2 2 2s2-.8 2-2m0 0c0 1.2 1 2 2 2s2-.8 2-2" /></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h5" /></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6" /></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></svg>,
  ticket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /><path d="M9 9h.01M15 15h.01M15 9l-6 6" /></svg>,
};

function StatusBadge({ status, onClick }) {
  const normalized = String(status).toLowerCase();
  const content = <span className={`settings-status ${normalized === "ativo" ? "active" : "pending"}`}>{status}</span>;
  return onClick ? <button className="settings-badge-button" onClick={onClick} type="button">{content}</button> : content;
}

function ToggleSwitch({ checked, disabled = false, onChange }) {
  return (
    <button className={`settings-toggle ${checked ? "on" : ""}`} disabled={disabled} onClick={onChange} type="button" aria-pressed={checked}>
      <i />
    </button>
  );
}

function SettingsTabs({ activeTab, onSelect }) {
  return (
    <nav className="settings-tabs" aria-label="Seções de configurações">
      {tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => onSelect(tab)} type="button">{tab}</button>)}
    </nav>
  );
}

function SettingsCard({ action, children, description, icon, id, onAction, title }) {
  return (
    <article className="settings-card" id={id}>
      <header className="settings-card-head">
        <span className="settings-card-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      <div className="settings-card-body">{children}</div>
      {action ? <button className="settings-action" onClick={onAction} type="button">{action}</button> : null}
    </article>
  );
}

function SettingsRow({ action, children, label, onAction, onClick, value }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`settings-clean-row ${onClick ? "clickable" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <span>{label}</span>
      <div className="settings-row-value">
        {children || <strong>{value}</strong>}
        {action ? <button className="settings-mini-action" onClick={(event) => { event.stopPropagation(); onAction?.(); }} type="button">{action}</button> : null}
      </div>
    </Tag>
  );
}

function Modal({ children, description, onClose, title, wide = false }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="settings-modal-backdrop" onMouseDown={onClose}>
      <section className={`settings-modal ${wide ? "wide" : ""}`} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="settings-modal-head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="settings-modal-close" onClick={onClose} type="button" aria-label="Fechar">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Field({ error, label, ...props }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input {...props} />
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

function SelectField({ children, label, ...props }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

function ModalActions({ busy, children, onCancel, onSave, saveLabel = "Salvar alterações" }) {
  return (
    <footer className="settings-modal-actions">
      {children}
      <button className="settings-secondary-action" disabled={busy} onClick={onCancel} type="button">Cancelar</button>
      <button className="settings-primary-action" disabled={busy} onClick={onSave} type="button">{busy ? "Salvando..." : saveLabel}</button>
    </footer>
  );
}

function ConfirmDialog({ message, onCancel, onConfirm, title }) {
  return (
    <div className="settings-modal-backdrop confirm-backdrop" onMouseDown={onCancel}>
      <section className="settings-confirm" onMouseDown={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="settings-modal-actions">
          <button className="settings-secondary-action" onClick={onCancel} type="button">Cancelar</button>
          <button className="settings-primary-action" onClick={onConfirm} type="button">Confirmar</button>
        </div>
      </section>
    </div>
  );
}

export function Settings() {
  const auth = useContext(AuthContext);
  const [settings, setSettings] = useState(() => getSettings());
  const [coupons, setCoupons] = useState(() => getCoupons());
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [activeTab, setActiveTab] = useState("Geral");
  const toastTimer = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (!auth?.token) return;
    apiFetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${auth.token}` } })
      .then((data) => {
        if (Array.isArray(data)) {
          setCoupons(data);
          saveCoupons(data);
          updateSettingsSection("coupons", { activeCoupons: data.filter((coupon) => coupon.active).length });
        }
      })
      .catch(() => {});
  }, [auth?.token]);

  function showToast(message, type = "success") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function persistSettings(next, message) {
    setSettings(next);
    saveSettings(next);
    if (message) showToast(message);
  }

  function updateSettingsSection(section, data, message) {
    persistSettings({ ...settings, [section]: { ...settings[section], ...data } }, message);
  }

  function openModal(type, initial = {}) {
    const modalForm = initial.form || getInitialForm(type);
    setModal({ type, title: initial.title || "", description: initial.description || "", wide: initial.wide });
    setForm(modalForm);
    setFormErrors({});
  }

  function closeModal() {
    setModal(null);
    setForm({});
    setFormErrors({});
    setSaving(false);
  }

  function requestConfirm(title, message, onConfirm) {
    setConfirmDialog({ title, message, onConfirm });
  }

  async function persistCouponsToApi(next) {
    if (!auth?.token) return next;
    const headers = { Authorization: `Bearer ${auth.token}` };
    const current = await apiFetch("/api/admin/coupons", { headers });
    const currentIds = new Set(current.map((coupon) => coupon.id));
    const nextIds = new Set(next.map((coupon) => coupon.id));

    await Promise.all(current.filter((coupon) => !nextIds.has(coupon.id)).map((coupon) => (
      apiFetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`, { method: "DELETE", headers })
    )));

    const saved = [];
    for (const coupon of next) {
      const payload = JSON.stringify(coupon);
      const result = currentIds.has(coupon.id)
        ? await apiFetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`, { method: "PUT", headers, body: payload })
        : await apiFetch("/api/admin/coupons", { method: "POST", headers, body: payload });
      saved.push(result);
    }
    return saved;
  }

  async function saveCouponsState(next, message) {
    setCoupons(next);
    saveCoupons(next);
    updateSettingsSection("coupons", { activeCoupons: next.filter((coupon) => coupon.active).length }, message);
    try {
      const saved = await persistCouponsToApi(next);
      setCoupons(saved);
      saveCoupons(saved);
      updateSettingsSection("coupons", { activeCoupons: saved.filter((coupon) => coupon.active).length });
    } catch (error) {
      showToast(error.message || "Não foi possível sincronizar cupons com a API.", "error");
    }
  }

  function selectTab(tab) {
    setActiveTab(tab);
    sectionRefs.current[tab]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getInitialForm(type) {
    const { payments, delivery, notifications, checkout, security, store, coupons: couponSettings } = settings;
    const map = {
      password: { currentPassword: "", newPassword: "", confirmPassword: "" },
      store: { ...store },
      stripe: { ...payments.stripeConfig },
      pix: { ...payments.pixConfig },
      boleto: { ...payments.boletoConfig },
      cash: { ...payments.cashConfig },
      payments: { stripe: payments.stripe, pix: payments.pix, boleto: payments.boleto, cashOnDelivery: payments.cashOnDelivery },
      correios: { ...delivery.correiosConfig, result: "" },
      localDelivery: { ...delivery.localConfig },
      pickup: { ...delivery.pickupConfig },
      delivery: { freeShippingValue: delivery.freeShippingValue, regions: delivery.regions },
      notifications: { ...notifications },
      checkout: { ...checkout },
      security: { twoFactorEnabled: security.twoFactorEnabled, sessions: security.sessions },
      accessHistory: {},
      coupons: { coupon: emptyCoupon, editingId: "", activePromotions: couponSettings.activePromotions, pixDiscount: couponSettings.pixDiscount, freeShippingValue: couponSettings.freeShippingValue },
    };
    return map[type] || {};
  }

  function validatePassword() {
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = "Informe a senha atual.";
    if (!form.newPassword) errors.newPassword = "Informe a nova senha.";
    if (form.newPassword && form.newPassword.length < 6) errors.newPassword = "Use no mínimo 6 caracteres.";
    if (form.newPassword !== form.confirmPassword) errors.confirmPassword = "As senhas precisam ser iguais.";
    return errors;
  }

  function savePassword() {
    const errors = validatePassword();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showToast("Erro: preencha os campos obrigatórios", "error");
      return;
    }
    simulateSave(() => {
      showToast("Senha alterada com sucesso");
      closeModal();
    });
  }

  function saveStore() {
    const errors = {};
    if (!form.name?.trim()) errors.name = "Nome da loja obrigatório.";
    if (!form.whatsapp?.trim()) errors.whatsapp = "WhatsApp obrigatório.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || "")) errors.email = "Informe um e-mail válido.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showToast("Erro: preencha os campos obrigatórios", "error");
      return;
    }
    const nextInstagram = form.instagram?.startsWith("@") ? form.instagram : `@${form.instagram || ""}`;
    simulateSave(() => {
      updateSettingsSection("store", { ...form, instagram: nextInstagram }, "Dados da loja atualizados com sucesso");
      closeModal();
    });
  }

  function savePaymentConfig(type) {
    const key = `${type}Config`;
    simulateSave(() => {
      updateSettingsSection("payments", { [type === "cash" ? "cashOnDelivery" : type]: true, [key]: form }, "Pagamento salvo com sucesso");
      closeModal();
    });
  }

  function activatePayment(key, label) {
    updateSettingsSection("payments", { [key]: true }, `${label} ativado com sucesso`);
  }

  function savePaymentManager() {
    simulateSave(() => {
      updateSettingsSection("payments", form, "Métodos de pagamento atualizados");
      closeModal();
    });
  }

  function testStripeConnection() {
    const ok = form.publicKey && form.secretKey && form.webhookSecret;
    showToast(ok ? "Conexão Stripe simulada com sucesso" : "Erro: preencha as chaves da Stripe", ok ? "success" : "error");
  }

  function saveDeliveryConfig(type) {
    const configKey = type === "correios" ? "correiosConfig" : type === "localDelivery" ? "localConfig" : "pickupConfig";
    const activeKey = type === "pickup" ? "storePickup" : type;
    simulateSave(() => {
      updateSettingsSection("delivery", { [activeKey]: true, [configKey]: form }, "Entrega atualizada com sucesso");
      closeModal();
    });
  }

  function saveDeliveryManager() {
    simulateSave(() => {
      updateSettingsSection("delivery", { freeShippingValue: Number(form.freeShippingValue || 0), regions: form.regions }, "Entregas atualizadas com sucesso");
      closeModal();
    });
  }

  function testShipping() {
    showToast(form.testCep ? "Frete simulado: PAC R$ 24,90 / SEDEX R$ 39,90" : "Erro: informe o CEP de destino", form.testCep ? "success" : "error");
  }

  function toggleNotification(key) {
    const enabled = !settings.notifications[key];
    updateSettingsSection("notifications", { [key]: enabled }, enabled ? "Notificação ativada" : "Notificação desativada");
  }

  function saveNotifications() {
    simulateSave(() => {
      updateSettingsSection("notifications", form, "Notificações atualizadas com sucesso");
      closeModal();
    });
  }

  function saveCheckout() {
    simulateSave(() => {
      updateSettingsSection("checkout", form, "Checkout atualizado com sucesso");
      closeModal();
    });
  }

  function quickToggleCheckout(key) {
    updateSettingsSection("checkout", { [key]: !settings.checkout[key] }, "Checkout atualizado");
  }

  function saveSecurity() {
    simulateSave(() => {
      const sessions = form.sessions || [];
      updateSettingsSection("security", { twoFactorEnabled: form.twoFactorEnabled, sessions, activeSessions: sessions.length }, "Segurança atualizada com sucesso");
      closeModal();
    });
  }

  function endSession(id) {
    requestConfirm("Encerrar sessão", "Deseja encerrar esta sessão ativa?", () => {
      const nextSessions = settings.security.sessions.filter((session) => session.id !== id);
      updateSettingsSection("security", { sessions: nextSessions, activeSessions: nextSessions.length }, "Sessão encerrada");
      if (modal?.type === "security") setForm((current) => ({ ...current, sessions: nextSessions }));
      setConfirmDialog(null);
    });
  }

  function endOtherSessions() {
    requestConfirm("Encerrar outras sessões", "Todas as outras sessões serão removidas da lista.", () => {
      const nextSessions = settings.security.sessions.slice(0, 1);
      updateSettingsSection("security", { sessions: nextSessions, activeSessions: nextSessions.length }, "Outras sessões encerradas");
      if (modal?.type === "security") setForm((current) => ({ ...current, sessions: nextSessions }));
      setConfirmDialog(null);
    });
  }

  function saveCoupon() {
    const coupon = form.coupon || emptyCoupon;
    const errors = {};
    if (!coupon.code?.trim()) errors.code = "Código obrigatório.";
    if (!Number(coupon.value)) errors.value = "Valor obrigatório.";
    if (Number(coupon.value) <= 0) errors.value = "Valor precisa ser maior que zero.";
    if (coupon.type === "percent" && Number(coupon.value) > 100) errors.value = "Porcentagem máxima é 100.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      showToast("Erro: revise os dados do cupom", "error");
      return;
    }
    const normalized = {
      ...coupon,
      id: coupon.id || crypto.randomUUID(),
      code: coupon.code.toUpperCase(),
      type: coupon.type || "percent",
      target: coupon.target || "products",
      value: Number(coupon.value),
      minOrderValue: Number(coupon.minOrderValue || 0),
      usageLimit: Number(coupon.usageLimit || 0),
    };
    const next = form.editingId ? coupons.map((item) => (item.id === form.editingId ? normalized : item)) : [normalized, ...coupons];
    saveCouponsState(next);
    setForm((current) => ({ ...current, coupon: emptyCoupon, editingId: "" }));
    setFormErrors({});
    showToast(form.editingId ? "Cupom atualizado com sucesso" : "Cupom criado com sucesso");
  }

  function editCoupon(coupon) {
    setForm((current) => ({ ...current, coupon, editingId: coupon.id }));
    setFormErrors({});
  }

  function deleteCoupon(id) {
    requestConfirm("Excluir cupom", "Este cupom será removido da lista.", () => {
      saveCouponsState(coupons.filter((coupon) => coupon.id !== id), "Cupom excluído com sucesso");
      setConfirmDialog(null);
    });
  }

  function toggleCoupon(id) {
    const next = coupons.map((coupon) => (coupon.id === id ? { ...coupon, active: !coupon.active } : coupon));
    saveCouponsState(next, "Status do cupom atualizado");
  }

  function saveCouponSettings() {
    simulateSave(() => {
      const activeCoupons = coupons.filter((coupon) => coupon.active).length;
      updateSettingsSection("coupons", {
        activeCoupons,
        activePromotions: Number(form.activePromotions || 0),
        pixDiscount: Number(form.pixDiscount || 0),
        freeShippingValue: Number(form.freeShippingValue || 0),
      }, "Promoções atualizadas com sucesso");
      closeModal();
    });
  }

  function simulateSave(callback) {
    setSaving(true);
    setTimeout(() => {
      callback();
      setSaving(false);
    }, 280);
  }

  const payments = [
    ["Stripe", settings.payments.stripe, () => openModal("stripe"), "stripe"],
    ["PIX", settings.payments.pix, () => openModal("pix"), "pix"],
    ["Boleto", settings.payments.boleto, () => settings.payments.boleto ? openModal("boleto") : activatePayment("boleto", "Boleto"), "boleto"],
    ["Dinheiro na entrega", settings.payments.cashOnDelivery, () => settings.payments.cashOnDelivery ? openModal("cash") : activatePayment("cashOnDelivery", "Dinheiro na entrega"), "cashOnDelivery"],
  ];

  const delivery = [
    ["Correios", settings.delivery.correios, "Configurar", () => openModal("correios")],
    ["Entrega local", settings.delivery.localDelivery, "Configurar", () => openModal("localDelivery")],
    ["Retirada na loja", settings.delivery.storePickup, "Configurar", () => openModal("pickup")],
    ["Frete grátis", money(settings.delivery.freeShippingValue)],
    ["Regiões atendidas", settings.delivery.regions],
  ];

  const notifications = [
    ["WhatsApp - Pedido confirmado", "whatsappOrderConfirmed"],
    ["WhatsApp - Pedido enviado", "whatsappOrderSent"],
    ["E-mail - Pagamento aprovado", "emailPaymentApproved"],
    ["Alerta de novo pedido (admin)", "adminNewOrderAlert"],
  ];

  const checkoutRows = [
    ["Login obrigatório", "loginRequired", settings.checkout.loginRequired ? "Sim" : "Não"],
    ["CPF obrigatório", "cpfRequired", settings.checkout.cpfRequired ? "Sim" : "Não"],
    ["Cupom de desconto", "couponEnabled", settings.checkout.couponEnabled ? "Ativo" : "Inativo"],
    ["Campo de observação", "orderNoteEnabled", settings.checkout.orderNoteEnabled ? "Ativo" : "Inativo"],
    ["Aceite dos termos", "termsRequired", settings.checkout.termsRequired ? "Ativo" : "Inativo"],
  ];

  return (
    <main className="page settings-page">
      <div className="settings-title">
        <p className="section-kicker">Sistema</p>
        <h2>CONFIGURAÇÕES</h2>
        <span>Gerencie as configurações da sua loja</span>
      </div>

      <SettingsTabs activeTab={activeTab} onSelect={selectTab} />

      <section className="settings-dashboard-grid">
        <div ref={(node) => { sectionRefs.current.Geral = node; sectionRefs.current.Loja = node; }}>
          <SettingsCard action="Editar dados" description="Informações básicas da sua loja e canais de contato." icon={icons.store} id="settings-store" onAction={() => openModal("store")} title="Dados da Loja">
            <SettingsRow label="Nome da loja" value={settings.store.name} />
            <SettingsRow label="WhatsApp" value={settings.store.whatsapp} />
            <SettingsRow label="Instagram" value={settings.store.instagram} />
            <SettingsRow label="E-mail" value={settings.store.email} />
          </SettingsCard>
        </div>

        <div ref={(node) => { sectionRefs.current.Pagamentos = node; }}>
          <SettingsCard action="Gerenciar pagamentos" description="Configure os métodos de pagamento da sua loja." icon={icons.card} id="settings-payments" onAction={() => openModal("payments", { wide: true })} title="Pagamentos">
            {payments.map(([label, active, action, key]) => (
              <SettingsRow action={active ? "Configurar" : "Ativar"} key={key} label={label} onAction={action}>
                <StatusBadge status={active ? "Ativo" : "Pendente"} />
              </SettingsRow>
            ))}
          </SettingsCard>
        </div>

        <div ref={(node) => { sectionRefs.current.Entrega = node; }}>
          <SettingsCard action="Gerenciar entregas" description="Configure as opções de entrega e cálculo do frete." icon={icons.truck} id="settings-delivery" onAction={() => openModal("delivery")} title="Entrega e Frete">
            {delivery.map(([label, value, action, onAction]) => (
              <SettingsRow action={action} key={label} label={label} onAction={onAction}>
                {typeof value === "boolean" ? <StatusBadge status={value ? "Ativo" : "Pendente"} /> : <strong>{value}</strong>}
              </SettingsRow>
            ))}
          </SettingsCard>
        </div>

        <div ref={(node) => { sectionRefs.current.Notificações = node; }}>
          <SettingsCard action="Configurar notificações" description="Gerencie as notificações enviadas para clientes e para você." icon={icons.bell} id="settings-notifications" onAction={() => openModal("notifications")} title="Notificações">
            {notifications.map(([label, key]) => (
              <SettingsRow key={key} label={label}>
                <ToggleSwitch checked={settings.notifications[key]} onChange={() => toggleNotification(key)} />
              </SettingsRow>
            ))}
          </SettingsCard>
        </div>

        <div ref={(node) => { sectionRefs.current.Checkout = node; }}>
          <SettingsCard action="Configurar checkout" description="Personalize o processo de finalização de compra." icon={icons.cart} id="settings-checkout" onAction={() => openModal("checkout")} title="Checkout">
            {checkoutRows.map(([label, key, value]) => <SettingsRow key={key} label={label} onClick={() => quickToggleCheckout(key)} value={value} />)}
          </SettingsCard>
        </div>

        <div ref={(node) => { sectionRefs.current.Segurança = node; }}>
          <SettingsCard action="Gerenciar segurança" description="Proteja sua conta e gerencie o acesso ao painel." icon={icons.shield} id="settings-security" onAction={() => openModal("security", { wide: true })} title="Segurança">
            <SettingsRow action="Alterar" label="Senha" onAction={() => openModal("password")} value="" />
            <SettingsRow label="Autenticação 2FA"><StatusBadge onClick={() => openModal("security", { wide: true })} status={settings.security.twoFactorEnabled ? "Ativo" : "Pendente"} /></SettingsRow>
            <SettingsRow label="Sessões ativas" onClick={() => openModal("security", { wide: true })} value={`${settings.security.activeSessions} sessões`} />
            <SettingsRow label="Histórico de acessos" onClick={() => openModal("accessHistory", { wide: true })} value="›" />
          </SettingsCard>
        </div>

        <SettingsCard action="Gerenciar cupons" description="Gerencie cupons de desconto e promoções da loja." icon={icons.ticket} id="settings-coupons" onAction={() => openModal("coupons", { wide: true })} title="Cupons e Promoções">
          <SettingsRow label="Cupons ativos" value={settings.coupons.activeCoupons} />
          <SettingsRow label="Promoções ativas" value={settings.coupons.activePromotions} />
          <SettingsRow label="Desconto no PIX" value={`${settings.coupons.pixDiscount}%`} />
          <SettingsRow label="Frete grátis" value={money(settings.coupons.freeShippingValue)} />
        </SettingsCard>
      </section>

      {toast ? <div className={`settings-toast ${toast.type}`}>{toast.message}</div> : null}
      {modal ? renderModal() : null}
      {confirmDialog ? (
        <ConfirmDialog
          message={confirmDialog.message}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
        />
      ) : null}
    </main>
  );

  function renderModal() {
    const modalProps = {
      password: ["Alterar senha", "Atualize sua senha de acesso ao painel."],
      store: ["Editar dados da loja", "Atualize as informações exibidas no painel."],
      stripe: ["Configurar Stripe", "Salve as chaves e simule uma conexão."],
      pix: ["Configurar PIX", "Defina chave, recebedor e desconto."],
      boleto: ["Configurar Boleto", "Defina provedor, vencimento e instruções."],
      cash: ["Configurar dinheiro na entrega", "Ajuste regras para pagamento presencial."],
      payments: ["Gerenciar pagamentos", "Ative ou desative os métodos disponíveis."],
      correios: ["Configurar Correios", "Configure origem, contrato e teste de cálculo."],
      localDelivery: ["Configurar entrega local", "Defina valor, prazo e regiões."],
      pickup: ["Configurar retirada na loja", "Defina local, horários e instruções."],
      delivery: ["Gerenciar entregas", "Atualize frete grátis e regiões atendidas."],
      notifications: ["Configurar notificações", "Personalize canais, mensagens e alerta sonoro."],
      checkout: ["Configurar checkout", "Controle as regras de finalização de compra."],
      security: ["Gerenciar segurança", "Controle 2FA e sessões ativas."],
      accessHistory: ["Histórico de acessos", "Revise os acessos recentes ao painel."],
      coupons: ["Gerenciar cupons", "Crie, edite e acompanhe promoções."],
    };
    const [title, description] = modalProps[modal.type] || ["Configurações", ""];
    return (
      <Modal description={description} onClose={closeModal} title={title} wide={modal.wide || ["payments", "security", "accessHistory", "coupons"].includes(modal.type)}>
        {renderModalBody()}
      </Modal>
    );
  }

  function renderModalBody() {
    if (modal.type === "password") {
      return <div className="settings-form"><Field error={formErrors.currentPassword} label="Senha atual" type="password" value={form.currentPassword || ""} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /><Field error={formErrors.newPassword} label="Nova senha" type="password" value={form.newPassword || ""} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /><Field error={formErrors.confirmPassword} label="Confirmar nova senha" type="password" value={form.confirmPassword || ""} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={savePassword} saveLabel="Salvar senha" /></div>;
    }
    if (modal.type === "store") {
      return <div className="settings-form"><Field error={formErrors.name} label="Nome da loja" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Field error={formErrors.whatsapp} label="WhatsApp" value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /><Field label="Instagram" value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /><Field error={formErrors.email} label="E-mail comercial" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={saveStore} /></div>;
    }
    if (modal.type === "stripe") {
      return <div className="settings-form"><Field label="Public Key" value={form.publicKey || ""} onChange={(e) => setForm({ ...form, publicKey: e.target.value })} /><Field label="Secret Key" value={form.secretKey || ""} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} /><Field label="Webhook Secret" value={form.webhookSecret || ""} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} /><SelectField label="Modo" value={form.mode || "Teste"} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>Teste</option><option>Produção</option></SelectField><ModalActions busy={saving} onCancel={closeModal} onSave={() => savePaymentConfig("stripe")}><button className="settings-secondary-action" onClick={testStripeConnection} type="button">Testar conexão</button></ModalActions></div>;
    }
    if (modal.type === "pix") {
      return <div className="settings-form"><SelectField label="Tipo de chave PIX" value={form.keyType || "CPF"} onChange={(e) => setForm({ ...form, keyType: e.target.value })}>{["CPF", "CNPJ", "E-mail", "Telefone", "Aleatória"].map((item) => <option key={item}>{item}</option>)}</SelectField><Field label="Chave PIX" value={form.key || ""} onChange={(e) => setForm({ ...form, key: e.target.value })} /><Field label="Nome do recebedor" value={form.receiverName || ""} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} /><Field label="Cidade do recebedor" value={form.receiverCity || ""} onChange={(e) => setForm({ ...form, receiverCity: e.target.value })} /><Field label="Desconto no PIX (%)" type="number" value={form.discount || ""} onChange={(e) => setForm({ ...form, discount: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => savePaymentConfig("pix")} /></div>;
    }
    if (modal.type === "boleto") {
      return <div className="settings-form"><SelectField label="Provedor" value={form.provider || "Mercado Pago"} onChange={(e) => setForm({ ...form, provider: e.target.value })}>{["Mercado Pago", "PagSeguro", "Asaas", "Outro"].map((item) => <option key={item}>{item}</option>)}</SelectField><Field label="Dias para vencimento" type="number" value={form.dueDays || ""} onChange={(e) => setForm({ ...form, dueDays: e.target.value })} /><TextArea label="Instruções do boleto" value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => savePaymentConfig("boleto")} /></div>;
    }
    if (modal.type === "cash") {
      return <div className="settings-form"><SettingsRow label="Permitir troco?"><ToggleSwitch checked={Boolean(form.allowChange)} onChange={() => setForm({ ...form, allowChange: !form.allowChange })} /></SettingsRow><Field label="Valor máximo permitido" type="number" value={form.maxValue || ""} onChange={(e) => setForm({ ...form, maxValue: e.target.value })} /><TextArea label="Observações para pagamento na entrega" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => savePaymentConfig("cash")} /></div>;
    }
    if (modal.type === "payments") {
      return <div className="settings-form"><div className="settings-list-panel">{["stripe", "pix", "boleto", "cashOnDelivery"].map((key) => <SettingsRow key={key} label={{ stripe: "Stripe", pix: "PIX", boleto: "Boleto", cashOnDelivery: "Dinheiro na entrega" }[key]}><ToggleSwitch checked={Boolean(form[key])} onChange={() => setForm({ ...form, [key]: !form[key] })} /></SettingsRow>)}</div><ModalActions busy={saving} onCancel={closeModal} onSave={savePaymentManager} /></div>;
    }
    if (modal.type === "correios") {
      return <div className="settings-form"><Field label="CEP de origem" value={form.originCep || ""} onChange={(e) => setForm({ ...form, originCep: e.target.value })} /><Field label="Código de contrato (opcional)" value={form.contractCode || ""} onChange={(e) => setForm({ ...form, contractCode: e.target.value })} /><SelectField label="Serviço padrão" value={form.defaultService || "Ambos"} onChange={(e) => setForm({ ...form, defaultService: e.target.value })}><option>PAC</option><option>SEDEX</option><option>Ambos</option></SelectField><Field label="Prazo adicional em dias" type="number" value={form.extraDays || ""} onChange={(e) => setForm({ ...form, extraDays: e.target.value })} /><Field label="Taxa extra de manuseio" type="number" value={form.handlingFee || ""} onChange={(e) => setForm({ ...form, handlingFee: e.target.value })} /><Field label="CEP de destino para teste" value={form.testCep || ""} onChange={(e) => setForm({ ...form, testCep: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => saveDeliveryConfig("correios")}><button className="settings-secondary-action" onClick={testShipping} type="button">Testar cálculo</button></ModalActions></div>;
    }
    if (modal.type === "localDelivery") {
      return <div className="settings-form"><SettingsRow label="Ativar entrega local"><ToggleSwitch checked={Boolean(form.enabled)} onChange={() => setForm({ ...form, enabled: !form.enabled })} /></SettingsRow><Field label="Valor da entrega local" type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} /><Field label="Prazo estimado" value={form.estimatedTime || ""} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} /><TextArea label="Bairros/regiões atendidas" value={form.regions || ""} onChange={(e) => setForm({ ...form, regions: e.target.value })} /><Field label="Pedido mínimo para entrega" type="number" value={form.minOrderValue || ""} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => saveDeliveryConfig("localDelivery")} /></div>;
    }
    if (modal.type === "pickup") {
      return <div className="settings-form"><SettingsRow label="Ativar retirada"><ToggleSwitch checked={Boolean(form.enabled)} onChange={() => setForm({ ...form, enabled: !form.enabled })} /></SettingsRow><Field label="Endereço de retirada" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /><Field label="Horário de retirada" value={form.hours || ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} /><TextArea label="Instruções para cliente" value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={() => saveDeliveryConfig("pickup")} /></div>;
    }
    if (modal.type === "delivery") {
      return <div className="settings-form"><Field label="Valor mínimo para frete grátis" type="number" value={form.freeShippingValue || ""} onChange={(e) => setForm({ ...form, freeShippingValue: e.target.value })} /><TextArea label="Regiões atendidas" value={form.regions || ""} onChange={(e) => setForm({ ...form, regions: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={saveDeliveryManager} /></div>;
    }
    if (modal.type === "notifications") {
      return <div className="settings-form"><Field label="Número WhatsApp do admin" value={form.adminWhatsapp || ""} onChange={(e) => setForm({ ...form, adminWhatsapp: e.target.value })} /><Field label="E-mail do admin" type="email" value={form.adminEmail || ""} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /><TextArea label="Mensagem de pedido confirmado" value={form.orderConfirmedMessage || ""} onChange={(e) => setForm({ ...form, orderConfirmedMessage: e.target.value })} /><TextArea label="Mensagem de pedido enviado" value={form.orderSentMessage || ""} onChange={(e) => setForm({ ...form, orderSentMessage: e.target.value })} /><TextArea label="Mensagem de pagamento aprovado" value={form.paymentApprovedMessage || ""} onChange={(e) => setForm({ ...form, paymentApprovedMessage: e.target.value })} /><SettingsRow label="Ativar som de alerta no painel"><ToggleSwitch checked={Boolean(form.soundAlert)} onChange={() => setForm({ ...form, soundAlert: !form.soundAlert })} /></SettingsRow><ModalActions busy={saving} onCancel={closeModal} onSave={saveNotifications}><button className="settings-secondary-action" onClick={() => showToast("Notificação de teste enviada com sucesso")} type="button">Testar notificação</button></ModalActions></div>;
    }
    if (modal.type === "checkout") {
      return <div className="settings-form">{["loginRequired", "cpfRequired", "couponEnabled", "orderNoteEnabled", "termsRequired"].map((key) => <SettingsRow key={key} label={{ loginRequired: "Login obrigatório", cpfRequired: "CPF obrigatório", couponEnabled: "Cupom de desconto ativo", orderNoteEnabled: "Campo de observação ativo", termsRequired: "Aceite dos termos obrigatório" }[key]}><ToggleSwitch checked={Boolean(form[key])} onChange={() => setForm({ ...form, [key]: !form[key] })} /></SettingsRow>)}<TextArea label="Mensagem exibida após compra" value={form.postPurchaseMessage || ""} onChange={(e) => setForm({ ...form, postPurchaseMessage: e.target.value })} /><TextArea label="Texto curto dos termos de compra" value={form.termsText || ""} onChange={(e) => setForm({ ...form, termsText: e.target.value })} /><Field label="URL da política de troca" value={form.exchangePolicyUrl || ""} onChange={(e) => setForm({ ...form, exchangePolicyUrl: e.target.value })} /><Field label="URL da política de privacidade" value={form.privacyPolicyUrl || ""} onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={saveCheckout} /></div>;
    }
    if (modal.type === "security") {
      return <div className="settings-form"><SettingsRow label="Autenticação 2FA"><ToggleSwitch checked={Boolean(form.twoFactorEnabled)} onChange={() => setForm({ ...form, twoFactorEnabled: !form.twoFactorEnabled })} /></SettingsRow><div className="settings-list-panel">{(form.sessions || []).map((session) => <SettingsRow action="Encerrar" key={session.id} label={`${session.device} - ${session.location}`} onAction={() => endSession(session.id)} value={session.lastAccess} />)}</div><ModalActions busy={saving} onCancel={closeModal} onSave={saveSecurity}><button className="settings-secondary-action" onClick={endOtherSessions} type="button">Encerrar outras sessões</button></ModalActions></div>;
    }
    if (modal.type === "accessHistory") {
      return <div className="settings-history">{settings.security.accessHistory.map((item) => <div key={`${item.date}-${item.device}`}><span>{item.date}</span><strong>{item.device}</strong><span>{item.location}</span><StatusBadge status={item.status === "Sucesso" ? "Ativo" : "Pendente"} /></div>)}</div>;
    }
    if (modal.type === "coupons") {
      const coupon = form.coupon || emptyCoupon;
      return <div className="settings-form settings-coupon-layout"><div className="settings-coupon-form"><Field error={formErrors.code} label="Código do cupom" value={coupon.code || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, code: e.target.value } })} /><SelectField label="Tipo" value={coupon.type || "percent"} onChange={(e) => setForm({ ...form, coupon: { ...coupon, type: e.target.value } })}><option value="percent">Porcentagem</option><option value="fixed">Valor fixo</option></SelectField><SelectField label="Aplicar desconto em" value={coupon.target || "products"} onChange={(e) => setForm({ ...form, coupon: { ...coupon, target: e.target.value } })}><option value="products">Produtos</option><option value="shipping">Frete</option><option value="both">Produtos e frete</option></SelectField><Field error={formErrors.value} label="Valor do desconto" type="number" value={coupon.value || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, value: e.target.value } })} /><Field label="Valor mínimo do pedido" type="number" value={coupon.minOrderValue || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, minOrderValue: e.target.value } })} /><Field label="Limite de uso" type="number" value={coupon.usageLimit || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, usageLimit: e.target.value } })} /><SettingsRow label="Status"><ToggleSwitch checked={Boolean(coupon.active)} onChange={() => setForm({ ...form, coupon: { ...coupon, active: !coupon.active } })} /></SettingsRow><button className="settings-action" onClick={saveCoupon} type="button">{form.editingId ? "Salvar cupom" : "Criar cupom"}</button></div><div className="settings-coupon-list">{coupons.map((item) => <div className="settings-coupon-item" key={item.id}><div><strong>{item.code}</strong><span>{item.type === "percent" ? `${item.value}%` : money(item.value)} • {item.target === "shipping" ? "frete" : item.target === "both" ? "produtos + frete" : "produtos"} • mínimo {money(item.minOrderValue)}</span></div><ToggleSwitch checked={item.active} onChange={() => toggleCoupon(item.id)} /><button className="settings-mini-action" onClick={() => editCoupon(item)} type="button">Editar</button><button className="settings-mini-action danger-action" onClick={() => deleteCoupon(item.id)} type="button">Excluir</button></div>)}</div><div className="settings-form-grid full"><Field label="Promoções ativas" type="number" value={form.activePromotions || ""} onChange={(e) => setForm({ ...form, activePromotions: e.target.value })} /><Field label="Desconto no PIX (%)" type="number" value={form.pixDiscount || ""} onChange={(e) => setForm({ ...form, pixDiscount: e.target.value })} /><Field label="Frete grátis acima de" type="number" value={form.freeShippingValue || ""} onChange={(e) => setForm({ ...form, freeShippingValue: e.target.value })} /></div><ModalActions busy={saving} onCancel={closeModal} onSave={saveCouponSettings} saveLabel="Salvar promoções" /></div>;
    }
    return null;
  }
}
