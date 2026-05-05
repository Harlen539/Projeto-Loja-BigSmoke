import { useState } from "react";

import { apiFetch } from "../services/api.js";

export function Pedidos() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");

  async function search(event) {
    event.preventDefault();
    setStatus("");
    setOrder(null);
    try {
      setOrder(await apiFetch(`/api/orders/public/${encodeURIComponent(query)}`));
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="page-shell">
      <h1>Meus pedidos</h1>
      <form className="tracking-search" onSubmit={search}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código, número ou session id" />
        <button className="btn btn-primary" type="submit">Buscar</button>
      </form>
      {status ? <p className="form-status">{status}</p> : null}
      {order ? (
        <article className="panel">
          <h2>{order.orderNumberFormatted || order.id}</h2>
          <p>Status: <strong>{order.status}</strong></p>
          <p>Total: R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</p>
        </article>
      ) : null}
    </main>
  );
}
