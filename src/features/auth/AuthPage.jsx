import { FaGithub, FaGoogle } from "react-icons/fa";
import { useAuthForm } from "./hooks/useAuthForm";

export const AuthPage = () => {
  const {
    mode,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    info,
    loading,
    switchMode,
    signInWithProvider,
    submit,
    sendReset
  } = useAuthForm();

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="auth-pill">Güvenli Çalışma Alanı</span>
        <h1>Note App</h1>
        <p className="auth-subtitle">
          {mode === "register" ? "Yeni hesap oluştur" : "Hesabına giriş yap"}
        </p>

        {mode === "register" ? (
          <>
            <label className="auth-label" htmlFor="fullName">
              Ad Soyad
            </label>
            <input
              id="fullName"
              type="text"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </>
        ) : null}

        <label className="auth-label" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="auth-label" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />

        {error ? (
          <p className="auth-error" role="alert" aria-live="polite">
            <span className="auth-error-icon" aria-hidden="true">!</span>
            <span>{error}</span>
          </p>
        ) : null}

        {info ? (
          <p className="auth-info" role="status" aria-live="polite">
            <span className="auth-info-icon" aria-hidden="true">i</span>
            <span>{info}</span>
          </p>
        ) : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Bekleniyor..." : mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
        </button>

        {mode === "login" ? (
          <button
            type="button"
            className="auth-link-btn"
            onClick={sendReset}
            disabled={loading}
          >
            Şifremi unuttum
          </button>
        ) : null}

        <div className="auth-divider">veya</div>
        <div className="auth-socials">
          <button
            type="button"
            className="auth-social-btn auth-social-google"
            onClick={() => signInWithProvider("google")}
            disabled={loading}
          >
            <span className="auth-social-icon" aria-hidden="true">
              <FaGoogle />
            </span>
            <span>Google ile giriş</span>
          </button>
          <button
            type="button"
            className="auth-social-btn auth-social-github"
            onClick={() => signInWithProvider("github")}
            disabled={loading}
          >
            <span className="auth-social-icon" aria-hidden="true">
              <FaGithub />
            </span>
            <span>GitHub ile giriş</span>
          </button>
        </div>

        <button type="button" className="auth-switch" onClick={switchMode} disabled={loading}>
          {mode === "register"
            ? "Zaten hesabım var, giriş yap"
            : "Hesabım yok, kayıt ol"}
        </button>
      </form>
    </main>
  );
};
