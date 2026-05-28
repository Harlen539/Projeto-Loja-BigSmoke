import { useState } from "react";
import { useNavigate } from "react-router-dom";

import logoAdmin from "../assets/logo_sem_fundo.png";
import { useAuth } from "../hooks/useAuth.js";

function Icon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
        <path d="M9.9 5.4A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a16.7 16.7 0 0 1-3 4.1" />
        <path d="M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 4-.9" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.6 2.6 0 0 1 4.9 1.2c0 1.8-2.7 2-2.7 4" />
        <path d="M12 17h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

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
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="admin-login-page">
      <span className="admin-login-smoke admin-login-smoke-one" />
      <span className="admin-login-smoke admin-login-smoke-two" />
      <span className="admin-login-smoke admin-login-smoke-three" />
      <span className="admin-login-ember ember-one" />
      <span className="admin-login-ember ember-two" />
      <span className="admin-login-ember ember-three" />

      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-login-logo-wrap">
          <img className="admin-login-logo" src={logoAdmin} alt="BigSmoke" />
        </div>

        <div className="admin-login-kicker">
          <Icon name="lock" />
          <span>PAINEL PRIVADO</span>
        </div>

        <header className="admin-login-header">
          <h1>{mode === "login" ? "BIGSMOKE ADMIN" : "RECUPERAR SENHA"}</h1>
          <p>
            {mode === "login"
              ? "Acesse sua área administrativa para gerenciar pedidos, produtos, cardápio e configurações."
              : "Informe o e-mail do admin para receber as instruções de recuperação."}
          </p>
        </header>

        {mode === "login" ? (
          <>
            <label className="admin-login-field">
              <span>E-mail</span>
              <div className="admin-login-input-wrap">
                <Icon name="mail" />
                <input
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                />
              </div>
            </label>

            <label className="admin-login-field">
              <span>Senha</span>
              <div className="admin-login-input-wrap">
                <Icon name="lock" />
                <input
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="admin-login-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
            </label>

            <button className="admin-login-submit" type="submit">
              <span>Entrar</span>
              <Icon name="arrow" />
            </button>

            <div className="admin-login-divider">
              <span>ou</span>
            </div>

            <button className="admin-login-link" onClick={showRecovery} type="button">
              <Icon name="help" />
              <span>Esqueceu sua senha?</span>
            </button>
          </>
        ) : (
          <>
            <label className="admin-login-field">
              <span>E-mail</span>
              <div className="admin-login-input-wrap">
                <Icon name="mail" />
                <input
                  autoComplete="email"
                  value={recoveryEmail}
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  placeholder="seu@email.com"
                  type="email"
                />
              </div>
            </label>

            <button className="admin-login-submit" disabled={sendingRecovery} type="submit">
              <span>{sendingRecovery ? "Enviando..." : "Enviar instruções"}</span>
              <Icon name="arrow" />
            </button>

            <button className="admin-login-link" onClick={showLogin} type="button">
              <Icon name="lock" />
              <span>Voltar ao login</span>
            </button>
          </>
        )}

        {error ? <span className="admin-login-alert error">{error}</span> : null}
        {message ? <span className="admin-login-alert success">{message}</span> : null}

        <footer className="admin-login-footer">
          <Icon name="shield" />
          <span>Acesso restrito aos administradores autorizados.</span>
        </footer>
      </form>
    </main>
  );
}
