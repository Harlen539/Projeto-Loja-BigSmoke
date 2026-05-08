import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@bigsmoke.local");
  const [password, setPassword] = useState("admin123");
  const [recoveryEmail, setRecoveryEmail] = useState("admin@bigsmoke.local");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "recovery") {
      recoverPassword();
      return;
    }

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  function recoverPassword() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      setError("Informe um e-mail válido para recuperar a senha.");
      return;
    }

    setSendingRecovery(true);
    setTimeout(() => {
      localStorage.setItem("bigsmoke_admin_password_recovery", JSON.stringify({
        email: recoveryEmail,
        requestedAt: new Date().toISOString(),
      }));
      setSendingRecovery(false);
      setMessage("Se esse e-mail existir no admin, enviaremos as instruções de recuperação.");
      setError("");
    }, 350);
  }

  function showRecovery() {
    setMode("recovery");
    setRecoveryEmail(email);
    setError("");
    setMessage("");
  }

  function showLogin() {
    setMode("login");
    setError("");
    setMessage("");
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <p>Painel privado</p>
        <h1>{mode === "login" ? "BigSmoke Admin" : "Recuperar senha"}</h1>
        {mode === "login" ? (
          <>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" />
            <button type="submit">Entrar</button>
            <button className="login-link-button" onClick={showRecovery} type="button">Esqueci minha senha</button>
          </>
        ) : (
          <>
            <span className="login-helper">Digite o e-mail do admin para simular o envio das instruções de recuperação.</span>
            <input value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="E-mail do admin" type="email" />
            <button disabled={sendingRecovery} type="submit">{sendingRecovery ? "Enviando..." : "Enviar instruções"}</button>
            <button className="login-link-button" onClick={showLogin} type="button">Voltar ao login</button>
          </>
        )}
        {error ? <span className="error">{error}</span> : null}
        {message ? <span className="login-success">{message}</span> : null}
      </form>
    </main>
  );
}
