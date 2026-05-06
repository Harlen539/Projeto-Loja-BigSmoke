import { useState } from "react";

function maskCep(value) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
}

function maskCpf(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

async function fetchCep(rawCep) {
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

export function AddressStep({ form, setForm }) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCepChange(e) {
    const masked = maskCep(e.target.value);
    update("cep", masked);
    setCepError("");
  }

  async function handleCepBlur() {
    const raw = form.cep.replace(/\D/g, "");
    if (raw.length !== 8) {
      setCepError("CEP deve ter 8 dígitos.");
      return;
    }
    setCepLoading(true);
    setCepError("");
    const data = await fetchCep(raw);
    setCepLoading(false);
    if (!data) {
      setCepError("CEP não encontrado. Preencha o endereço manualmente.");
      return;
    }
    setForm((current) => ({
      ...current,
      street: data.logradouro || current.street,
      neighborhood: data.bairro || current.neighborhood,
      city: data.localidade || current.city,
      state: data.uf || current.state,
    }));
  }

  function handlePhoneChange(e) {
    update("phone", maskPhone(e.target.value));
  }

  return (
    <div className="form-grid">
      <input
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Nome completo"
        required
        autoComplete="name"
      />
      <input
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        placeholder="E-mail"
        required
        type="email"
        autoComplete="email"
      />
      <input
        value={form.phone}
        onChange={handlePhoneChange}
        placeholder="Telefone / WhatsApp"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
      />

      <div style={{ position: "relative" }}>
        <input
          value={form.cep}
          onChange={handleCepChange}
          onBlur={handleCepBlur}
          placeholder="CEP (ex: 58000-000)"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          style={{ width: "100%" }}
        />
        {cepLoading && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--color-text-secondary)" }}>
            Buscando...
          </span>
        )}
        {cepError && (
          <p style={{ color: "var(--color-text-danger, #c00)", fontSize: 12, margin: "4px 0 0" }}>
            {cepError}
          </p>
        )}
      </div>

      <input
        value={form.street}
        onChange={(e) => update("street", e.target.value)}
        placeholder="Rua / Avenida"
        required
        autoComplete="address-line1"
      />
      <input
        value={form.number}
        onChange={(e) => update("number", e.target.value)}
        placeholder="Número"
        required
        inputMode="numeric"
      />
      <input
        value={form.complement || ""}
        onChange={(e) => update("complement", e.target.value)}
        placeholder="Complemento (opcional)"
        autoComplete="address-line2"
      />
      <input
        value={form.neighborhood}
        onChange={(e) => update("neighborhood", e.target.value)}
        placeholder="Bairro"
        required
        autoComplete="address-level3"
      />
      <input
        value={form.city}
        onChange={(e) => update("city", e.target.value)}
        placeholder="Cidade"
        required
        autoComplete="address-level2"
      />
      <input
        value={form.state}
        onChange={(e) => update("state", e.target.value.toUpperCase().slice(0, 2))}
        placeholder="UF (ex: PB)"
        required
        maxLength={2}
        autoComplete="address-level1"
        style={{ textTransform: "uppercase" }}
      />
    </div>
  );
}
