# Note App - Firebase Notes Board

Modern ve ölçeklenebilir bir not uygulamasý.
Kullanýcýlar çoklu sayfa/alt sayfa oluþturabilir, notlarý sürükleyip yeniden boyutlandýrabilir ve zengin metin olarak düzenleyebilir.

## Özellikler

- Çoklu sayfa ve alt sayfa (hiyerarþik yapý)
- Sürükle-býrak not yerleþimi
- Not yeniden boyutlandýrma
- Zengin metin düzenleme (kalýn, italik, liste stilleri)
- Zoom kontrolleri
- Renk seçimi ile not oluþturma
- Firebase Realtime Database ile kalýcý veri
- Servis + repository tabanlý mimari

## Teknolojiler

- React 18
- Vite 5
- JavaScript (ES Modules)
- CSS
- Firebase Realtime Database

## Kurulum

```bash
npm install
npm run dev
```

`.env` dosyasý oluþturup `.env.example` içindeki deðiþkenleri doldur.

## Build

```bash
npm run build
npm run preview
```

## Firebase Kurulumu

1. Firebase Console'da proje oluþtur.
2. Realtime Database'i aktif et (geliþtirme için `test mode`).
3. Authentication > Sign-in method içinden `Email/Password`, `Google` ve `GitHub` provider'larýný aç.
4. GitHub provider için Firebase'in istediði callback URL'yi GitHub OAuth App ayarlarýna ekle.
5. Web app ekle ve config deðerlerini al.
6. Config deðerlerini `.env` dosyasýna `VITE_FIREBASE_*` deðiþkenleri olarak ekle.

## GitHub

```bash
git add .
git commit -m "feat: integrate firebase realtime database"
git push
```
