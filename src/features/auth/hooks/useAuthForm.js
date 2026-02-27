import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { getAuthErrorMessage, validateAuthForm, validateEmail } from "../authMessages";

export const useAuthForm = () => {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setMode((prev) => (prev === "register" ? "login" : "register"));
    setError("");
    setInfo("");
  };

  const signInWithProvider = async (providerName) => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const provider =
        providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(getAuthErrorMessage(err?.code, mode));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const validationError = validateAuthForm({ mode, fullName, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const safeName = fullName.trim();
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: safeName });
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setMode("login");
        setFullName("");
        setPassword("");
        setInfo("Doğrulama e-postası gönderildi. Giriş yapmadan önce e-postanı doğrula.");
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const isEmailPasswordProvider = credential.user.providerData.some(
          (provider) => provider.providerId === "password"
        );
        if (isEmailPasswordProvider && !credential.user.emailVerified) {
          await sendEmailVerification(credential.user);
          await signOut(auth);
          setError("E-posta adresini doğrulamalısın. Yeni doğrulama e-postası gönderildi.");
        }
      }
    } catch (err) {
      setError(getAuthErrorMessage(err?.code, mode));
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    setError("");
    setInfo("");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    } catch (err) {
      setError(getAuthErrorMessage(err?.code, mode));
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};
