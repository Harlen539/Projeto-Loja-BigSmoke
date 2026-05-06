import { useEffect, useState } from "react";

import { apiFetch } from "../services/api.js";

function BoolBadge({ value }) {
  return <span className={`status-badge ${value ? "status-success" : "status-warning"}`}>{value ? "Ativo" : "Pendente"}</span>;
}

export function Settings() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/config").then(setConfig).catch((err) => setError(err.message));
  }, []);

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
