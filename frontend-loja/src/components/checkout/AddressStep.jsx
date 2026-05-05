export function AddressStep({ form, setForm }) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="form-grid">
      <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nome" required />
      <input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="E-mail" required type="email" />
      <input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Telefone" required />
      <input value={form.cep} onChange={(event) => update("cep", event.target.value)} placeholder="CEP" required />
      <input value={form.street} onChange={(event) => update("street", event.target.value)} placeholder="Rua" required />
      <input value={form.number} onChange={(event) => update("number", event.target.value)} placeholder="Número" required />
      <input value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} placeholder="Bairro" required />
      <input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Cidade" required />
      <input value={form.state} onChange={(event) => update("state", event.target.value)} placeholder="UF" required maxLength={2} />
    </div>
  );
}
