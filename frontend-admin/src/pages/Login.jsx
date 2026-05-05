import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@bigsmoke.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <p>Painel privado</p>
        <h1>BigSmoke Admin</h1>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
        <button type="submit">Entrar</button>
        {error ? <span className="error">{error}</span> : null}
      </form>
    </main>
  );
}
