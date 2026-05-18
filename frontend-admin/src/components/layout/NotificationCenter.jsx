import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminNotifications } from "../../context/NotificationsContext.jsx";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function typeLabel(type) {
  const labels = {
    success: "Pedido",
    warning: "Pedido",
    stock: "Estoque",
    danger: "Urgente",
    info: "Loja",
  };
  return labels[type] || "Aviso";
}

export function NotificationCenter({ variant = "desktop", title = "Notificacoes" }) {
  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { loading, markAllRead, markRead, notifications, readIds, refresh, unreadCount } = useAdminNotifications();

  useEffect(() => {
    if (!open) return undefined;
    function close(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openItem(item) {
    markRead(item.id);
    setOpen(false);
    navigate(item.route);
  }

  return (
    <div className={`admin-notification-center ${variant}`} ref={popoverRef}>
      <button
        aria-expanded={open}
        aria-label={unreadCount ? `${unreadCount} notificacoes novas` : title}
        className={`${variant === "mobile" ? "mobile-admin-bell" : "soc-bell"} ${unreadCount ? "has-unread" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title={title}
        type="button"
      >
        <BellIcon />
        {unreadCount ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <section className="admin-notification-popover">
          <div className="admin-notification-head">
            <div>
              <strong>Notificacoes</strong>
              <span>{unreadCount ? `${unreadCount} nova${unreadCount === 1 ? "" : "s"}` : "Tudo em dia"}</span>
            </div>
            <button onClick={refresh} type="button">{loading ? "..." : "Atualizar"}</button>
          </div>

          <div className="admin-notification-list">
            {notifications.length ? notifications.map((item) => {
              const unread = !readIds.has(item.id);
              return (
                <button className={`admin-notification-item ${item.type} ${unread ? "is-unread" : ""}`} key={item.id} onClick={() => openItem(item)} type="button">
                  <span className="admin-notification-dot" />
                  <span>
                    <small>{typeLabel(item.type)}</small>
                    <strong>{item.title}</strong>
                    <em>{item.message}</em>
                    <b>{item.meta}</b>
                  </span>
                </button>
              );
            }) : (
              <div className="admin-notification-empty">
                <strong>Nenhuma notificacao agora</strong>
                <span>Novos pedidos, mudancas na loja e alertas de estoque vao aparecer aqui.</span>
              </div>
            )}
          </div>

          <div className="admin-notification-actions">
            <button onClick={markAllRead} type="button">Marcar como lidas</button>
            <button onClick={() => { setOpen(false); navigate("/pedidos"); }} type="button">Ver pedidos</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
