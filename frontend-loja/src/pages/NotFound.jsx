export function NotFound() {
  return (
    <main style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", textAlign: "center", padding: "2rem" }}>
      <p style={{ fontSize: "4rem", fontWeight: 700, opacity: 0.15, margin: 0 }}>404</p>
      <h1 style={{ margin: 0 }}>Página não encontrada</h1>
      <p style={{ color: "var(--color-text-secondary, #888)", maxWidth: 360 }}>
        O endereço que você acessou não existe ou foi removido.
      </p>
      <a className="btn btn-primary" href="/">
        Voltar para a loja
      </a>
    </main>
  );
}
