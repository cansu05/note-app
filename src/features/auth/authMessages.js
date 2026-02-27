export const getAuthErrorMessage = (code = "", mode = "login") => {
  if (code === "auth/invalid-credential") {
    return "E-posta veya şifre hatalı.";
  }
  if (code === "auth/user-not-found") {
    return "Bu e-posta ile kayıtlı bir hesap bulunamadı.";
  }
  if (code === "auth/wrong-password") {
    return "Şifre hatalı.";
  }
  if (code === "auth/email-already-in-use") {
    return "Bu e-posta zaten kullanımda.";
  }
  if (code === "auth/invalid-email") {
    return "Geçerli bir e-posta adresi gir.";
  }
  if (code === "auth/weak-password") {
    return "Şifre çok zayıf. Daha güçlü bir şifre seç.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Giriş penceresi kapatıldı.";
  }
  if (code === "auth/popup-blocked") {
    return "Tarayıcı popup penceresini engelledi.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Bu alan adı Firebase Authentication için yetkili değil.";
  }
  if (code === "auth/too-many-requests") {
    return "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.";
  }
  if (code === "auth/user-disabled") {
    return "Bu hesap devre dışı bırakılmış.";
  }
  if (code === "auth/network-request-failed") {
    return "Ağ bağlantısı hatası. İnternetini kontrol et.";
  }
  if (mode === "register") {
    return "Kayıt işlemi başarısız. Lütfen tekrar dene.";
  }
  return "Giriş işlemi başarısız. Lütfen tekrar dene.";
};

export const validateEmail = (email = "") => {
  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return "Lütfen e-posta gir.";
  }
  if (!emailPattern.test(trimmedEmail)) {
    return "Lütfen geçerli bir e-posta adresi gir.";
  }
  return "";
};

export const validateAuthForm = ({ mode, fullName, email, password }) => {
  if (mode === "register" && !fullName.trim()) {
    return "Lütfen ad soyad gir.";
  }

  const emailError = validateEmail(email);
  if (emailError) return emailError;

  if (!password) {
    return "Lütfen şifre gir.";
  }
  if (password.length < 6) {
    return "Şifre en az 6 karakter olmalı.";
  }

  return "";
};
