import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../context/AuthContext.jsx";
import { apiFetch } from "../services/api.js";
import { getCoupons, getSettings, saveCoupons, saveSettings } from "../services/settingsStorage.js";

const tabs = ["Geral", "Loja", "Entrega", "Notificações", "Checkout"];
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

  useEffect(() => {
    if (!auth?.token) return;
    apiFetch("/api/admin/settings", { headers: { Authorization: `Bearer ${auth.token}` } })
      .then((data) => {
        if (data?.store) {
          const next = { ...settings, store: { ...settings.store, ...data.store } };
          setSettings(next);
          saveSettings(next);
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
    const { delivery, notifications, checkout, store, coupons: couponSettings } = settings;
    const map = {
      store: { ...store },
      correios: { ...delivery.correiosConfig, result: "" },
      localDelivery: { ...delivery.localConfig },
      pickup: { ...delivery.pickupConfig },
      delivery: { freeShippingValue: delivery.freeShippingValue, regions: delivery.regions },
      notifications: { ...notifications },
      checkout: { ...checkout },
      coupons: { coupon: emptyCoupon, editingId: "", activePromotions: couponSettings.activePromotions, pixDiscount: couponSettings.pixDiscount, freeShippingValue: couponSettings.freeShippingValue },
    };
    return map[type] || {};
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
    simulateSave(async () => {
      const store = { ...form, instagram: nextInstagram };
      let nextStore = store;
      if (auth?.token) {
        try {
          const saved = await apiFetch("/api/admin/settings", {
            method: "PUT",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({ store })
          });
          nextStore = saved?.store || store;
        } catch {
          showToast("Dados salvos localmente, mas não foi possível publicar na loja.", "error");
        }
      }
      updateSettingsSection("store", nextStore, "Dados da loja atualizados com sucesso");
      closeModal();
    });
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
    setTimeout(async () => {
      await callback();
      setSaving(false);
    }, 280);
  }

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
      store: ["Editar dados da loja", "Atualize as informações exibidas no painel."],
      correios: ["Configurar Correios", "Configure origem, contrato e teste de cálculo."],
      localDelivery: ["Configurar entrega local", "Defina valor, prazo e regiões."],
      pickup: ["Configurar retirada na loja", "Defina local, horários e instruções."],
      delivery: ["Gerenciar entregas", "Atualize frete grátis e regiões atendidas."],
      notifications: ["Configurar notificações", "Personalize canais, mensagens e alerta sonoro."],
      checkout: ["Configurar checkout", "Controle as regras de finalização de compra."],
      coupons: ["Gerenciar cupons", "Crie, edite e acompanhe promoções."],
    };
    const [title, description] = modalProps[modal.type] || ["Configurações", ""];
    return (
      <Modal description={description} onClose={closeModal} title={title} wide={modal.wide || ["coupons"].includes(modal.type)}>
        {renderModalBody()}
      </Modal>
    );
  }

  function renderModalBody() {
    if (modal.type === "store") {
      return <div className="settings-form"><Field error={formErrors.name} label="Nome da loja" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Field error={formErrors.whatsapp} label="WhatsApp" value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /><Field label="Instagram" value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /><Field error={formErrors.email} label="E-mail comercial" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /><ModalActions busy={saving} onCancel={closeModal} onSave={saveStore} /></div>;
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
    if (modal.type === "coupons") {
      const coupon = form.coupon || emptyCoupon;
      return <div className="settings-form settings-coupon-layout"><div className="settings-coupon-form"><Field error={formErrors.code} label="Código do cupom" value={coupon.code || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, code: e.target.value } })} /><SelectField label="Tipo" value={coupon.type || "percent"} onChange={(e) => setForm({ ...form, coupon: { ...coupon, type: e.target.value } })}><option value="percent">Porcentagem</option><option value="fixed">Valor fixo</option></SelectField><SelectField label="Aplicar desconto em" value={coupon.target || "products"} onChange={(e) => setForm({ ...form, coupon: { ...coupon, target: e.target.value } })}><option value="products">Produtos</option><option value="shipping">Frete</option><option value="both">Produtos e frete</option></SelectField><Field error={formErrors.value} label="Valor do desconto" type="number" value={coupon.value || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, value: e.target.value } })} /><Field label="Valor mínimo do pedido" type="number" value={coupon.minOrderValue || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, minOrderValue: e.target.value } })} /><Field label="Limite de uso" type="number" value={coupon.usageLimit || ""} onChange={(e) => setForm({ ...form, coupon: { ...coupon, usageLimit: e.target.value } })} /><SettingsRow label="Status"><ToggleSwitch checked={Boolean(coupon.active)} onChange={() => setForm({ ...form, coupon: { ...coupon, active: !coupon.active } })} /></SettingsRow><button className="settings-action" onClick={saveCoupon} type="button">{form.editingId ? "Salvar cupom" : "Criar cupom"}</button></div><div className="settings-coupon-list">{coupons.map((item) => <div className="settings-coupon-item" key={item.id}><div><strong>{item.code}</strong><span>{item.type === "percent" ? `${item.value}%` : money(item.value)} • {item.target === "shipping" ? "frete" : item.target === "both" ? "produtos + frete" : "produtos"} • mínimo {money(item.minOrderValue)}</span></div><ToggleSwitch checked={item.active} onChange={() => toggleCoupon(item.id)} /><button className="settings-mini-action" onClick={() => editCoupon(item)} type="button">Editar</button><button className="settings-mini-action danger-action" onClick={() => deleteCoupon(item.id)} type="button">Excluir</button></div>)}</div><div className="settings-form-grid full"><Field label="Promoções ativas" type="number" value={form.activePromotions || ""} onChange={(e) => setForm({ ...form, activePromotions: e.target.value })} /><Field label="Desconto no PIX (%)" type="number" value={form.pixDiscount || ""} onChange={(e) => setForm({ ...form, pixDiscount: e.target.value })} /><Field label="Frete grátis acima de" type="number" value={form.freeShippingValue || ""} onChange={(e) => setForm({ ...form, freeShippingValue: e.target.value })} /></div><ModalActions busy={saving} onCancel={closeModal} onSave={saveCouponSettings} saveLabel="Salvar promoções" /></div>;
    }
    return null;
  }
}
