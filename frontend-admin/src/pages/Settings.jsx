import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

function BoolBadge({ value }) {
  return <span className={`status-badge ${value ? "status-success" : "status-warning"}`}>{value ? "Ativo" : "Pendente"}</span>;
}

export function Settings() {
  const { token, user } = useAuth();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);
  const email = user?.email || "admin";
  const avatarKey = useMemo(() => `bigsmoke-admin-avatar:${email}`, [email]);

  useEffect(() => {
    apiFetch("/api/config").then(setConfig).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setAvatar(localStorage.getItem(avatarKey) || "");
  }, [avatarKey]);

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await response.json();
      if (data.imageUrl) {
        localStorage.setItem(avatarKey, data.imageUrl);
        setAvatar(data.imageUrl);
        window.dispatchEvent(new Event("bigsmoke-admin-avatar-updated"));
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel enviar a foto.");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  function removeAvatar() {
    localStorage.removeItem(avatarKey);
    setAvatar("");
    window.dispatchEvent(new Event("bigsmoke-admin-avatar-updated"));
  }

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="section-kicker">Sistema</p>
          <h2>Configuracoes</h2>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="settings-grid">
        <article className="panel admin-profile-panel">
          <h3>Perfil do admin</h3>
          <div className="admin-profile-card">
            <button type="button" className="admin-avatar-button" onClick={() => fileRef.current?.click()} aria-label="Alterar foto do admin">
              {avatar ? <img src={avatar} alt="" /> : <span>{email.slice(0, 1).toUpperCase()}</span>}
            </button>
            <div>
              <strong>{email}</strong>
              <small>{uploadingAvatar ? "Enviando foto..." : "Foto salva para este email"}</small>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} hidden />
          <div className="admin-profile-actions">
            <button type="button" onClick={() => fileRef.current?.click()}>{avatar ? "Trocar foto" : "Adicionar foto"}</button>
            {avatar ? <button type="button" onClick={removeAvatar}>Remover</button> : null}
          </div>
        </article>

        <article className="panel">
          <h3>Pagamentos</h3>
          <div className="settings-row"><span>Stripe configurado</span><BoolBadge value={config?.stripeConfigured} /></div>
          <div className="settings-row"><span>Webhook Stripe</span><BoolBadge value={config?.webhookConfigured} /></div>
          <div className="settings-row"><span>Metricas live</span><BoolBadge value={config?.paymentMetricsEnabled} /></div>
        </article>

        <article className="panel">
          <h3>Dados e loja</h3>
          <div className="settings-row"><span>Modo de dados</span><strong>{config?.dataMode || "local"}</strong></div>
          <div className="settings-row"><span>Supabase</span><BoolBadge value={config?.supabaseConfigured} /></div>
          <div className="settings-row"><span>WhatsApp</span><strong>{config?.whatsappNumber || "-"}</strong></div>
        </article>

        <article className="panel">
          <h3>Operacao</h3>
          <div className="settings-row"><span>Notificacao de pedido</span><BoolBadge value={config?.orderNotificationConfigured} /></div>
          <div className="settings-row"><span>Twilio</span><BoolBadge value={config?.twilioConfigured} /></div>
          <div className="settings-row"><span>Confirmacao cliente</span><BoolBadge value={config?.twilioCustomerConfirmationEnabled} /></div>
        </article>
      </section>
    </main>
  );
}
