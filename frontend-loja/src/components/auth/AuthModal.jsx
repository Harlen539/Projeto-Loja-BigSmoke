import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiFetch } from "../../services/api.js";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
let googleScriptPromise = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

export function AuthModal() {
  const { authOpen, closeAuth, login } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);
  const googleButtonRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (authOpen) {
      setMode("login");
      setForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
      setError("");
    }
  }, [authOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAuth();
    }
    if (authOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [authOpen, closeAuth]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = authOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [authOpen]);

  useEffect(() => {
    if (!authOpen || !googleClientId || !googleButtonRef.current) return;

    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current) return;
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          locale: "pt-BR",
          width: Math.min(360, googleButtonRef.current.offsetWidth || 360),
        });
      })
      .catch(() => setError("Nao foi possivel carregar o login do Google."));

    return () => {
      cancelled = true;
    };
  }, [authOpen]);

  if (!authOpen) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) closeAuth();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!form.firstName.trim()) { setError("Informe seu nome."); setLoading(false); return; }
        if (!form.email.trim() || !form.email.includes("@")) { setError("Informe um e-mail válido."); setLoading(false); return; }
        if (form.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); setLoading(false); return; }
        if (form.password !== form.confirmPassword) { setError("As senhas não coincidem."); setLoading(false); return; }

        // Save user locally (sem backend de auth)
        const stored = JSON.parse(localStorage.getItem("bigsmoke_users") || "[]");
        const exists = stored.find((u) => u.email.toLowerCase() === form.email.toLowerCase());
        if (exists) { setError("Este e-mail já está cadastrado. Faça login."); setLoading(false); return; }

        const newUser = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password, // In production, hash this!
          createdAt: new Date().toISOString(),
        };
        stored.push(newUser);
        localStorage.setItem("bigsmoke_users", JSON.stringify(stored));

        login({ firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email });

      } else {
        // Login
        if (!form.email.trim()) { setError("Informe seu e-mail."); setLoading(false); return; }
        if (!form.password) { setError("Informe sua senha."); setLoading(false); return; }

        const stored = JSON.parse(localStorage.getItem("bigsmoke_users") || "[]");
        const found = stored.find(
          (u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.password === form.password
        );

        if (!found) {
          setError("E-mail ou senha incorretos.");
          setLoading(false);
          return;
        }

        login({ firstName: found.firstName, lastName: found.lastName, email: found.email });
      }
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(response) {
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response?.credential || "" }),
      });
      login(data.user, data.token);
    } catch (err) {
      setError(err.message || "Nao foi possivel entrar com Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label={mode === "login" ? "Iniciar sessão" : "Criar conta"}>
        {/* Close button */}
        <button className="auth-close" onClick={closeAuth} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Logo / Header */}
        <div className="auth-header">
          <div className="auth-logo-ring">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="var(--gold)" strokeWidth="1.5"/>
              <path d="M9 14 C9 10.5 11.5 8 14 8 C16.5 8 18 10 18 14" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M11 14 L17 14" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 14 L14 20" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="auth-title">
            {mode === "login" ? "Iniciar sessão" : "Criar conta"}
          </h2>
          {mode === "login" && (
            <p className="auth-subtitle">Acesse sua conta BigSmoke</p>
          )}
        </div>

        {/* Breadcrumb / Tab switcher */}
        <div className="auth-mode-bar">
          <button
            type="button"
            className={`auth-mode-btn${mode === "login" ? " active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-mode-btn${mode === "register" ? " active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Criar conta
          </button>
        </div>

        {googleClientId && (
          <>
            <div className="auth-google-slot">
              <div className="auth-google-official" ref={googleButtonRef} />
              <div className="auth-google-visual" aria-hidden="true">
                <img src="/google-logo.webp" alt="" />
                <span>Continuar com Google</span>
              </div>
            </div>
            <div className="auth-divider"><span>ou</span></div>
          </>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="auth-fn">Nome</label>
                <input
                  id="auth-fn"
                  type="text"
                  placeholder="Seu nome"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-ln">Sobrenome</label>
                <input
                  id="auth-ln"
                  type="text"
                  placeholder="Seu sobrenome"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              placeholder="ex.: seuemail@email.com.br"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-pass">
              Senha
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() => alert("Para recuperar sua senha, entre em contato conosco pelo WhatsApp.")}
                >
                  Esqueceu a senha?
                </button>
              )}
            </label>
            <div className="auth-pass-wrap">
              <input
                id="auth-pass"
                type={showPass ? "text" : "password"}
                placeholder="ex.: suasenha"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirmar senha</label>
              <div className="auth-pass-wrap">
                <input
                  id="auth-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Aguarde..." : mode === "login" ? "Iniciar sessão" : "Criar conta"}
          </button>

          <p className="auth-switch">
            {mode === "login" ? "Não possui uma conta ainda? " : "Já tem uma conta? "}
            <button
              type="button"
              className="auth-link"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "Criar uma conta" : "Entrar"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
