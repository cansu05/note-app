import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { auth } from "../../lib/firebase";

export const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithProvider = async (providerName) => {
    setError("");
    setLoading(true);
    try {
      const provider =
        providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err?.message || "Sosyal giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(err?.message || "Giriş işlemi başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-pill">Güvenli Çalışma Alanı</span>
        <h1>Note App</h1>
        <p className="auth-subtitle">
          {mode === "register" ? "Yeni hesap oluştur" : "Hesabına giriş yap"}
        </p>

        <label className="auth-label" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
          required
          minLength={6}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading
            ? "Bekleniyor..."
            : mode === "register"
              ? "Kayıt Ol"
              : "Giriş Yap"}
        </button>

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

        <button
          type="button"
          className="auth-switch"
          onClick={() => setMode((prev) => (prev === "register" ? "login" : "register"))}
          disabled={loading}
        >
          {mode === "register"
            ? "Zaten hesabım var, giriş yap"
            : "Hesabım yok, kayıt ol"}
        </button>
      </form>
    </main>
  );
};
