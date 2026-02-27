# Note App - Firebase Notes Board

Modern ve ölçeklenebilir bir not uygulaması.
Kullanıcılar çoklu sayfa/alt sayfa oluşturabilir, notları sürükleyip yeniden boyutlandırabilir ve zengin metin olarak düzenleyebilir.

## Özellikler

- Çoklu sayfa ve alt sayfa (hiyerarşik yapı)
- Sürükle-bırak not yerleşimi
- Not yeniden boyutlandırma
- Zengin metin düzenleme (kalın, italik, liste stilleri)
- Zoom kontrolleri
- Renk seçimi ile not oluşturma
- Firebase Realtime Database ile kalıcı veri
- Servis + repository tabanlı mimari

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

`.env` dosyası oluşturup `.env.example` içindeki değişkenleri doldur.

## Kalite Komutları

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install
npm run test:e2e
npm run build
```

## Firebase Kurulumu

1. Firebase Console'da proje oluştur.
2. Realtime Database'i aktif et ve yayın öncesi kuralları `firebase/database.rules.json` ile aynı olacak şekilde sıkılaştır.
3. Authentication > Sign-in method içinden `Email/Password`, `Google` ve `GitHub` provider'larını aç.
4. GitHub provider için Firebase'in istediği callback URL'yi GitHub OAuth App ayarlarına ekle.
5. Web app ekle ve config değerlerini al.
6. Config değerlerini `.env` dosyasına `VITE_FIREBASE_*` değişkenleri olarak ekle.

## Güvenlik Notu

- Realtime Database kurallarını sürüm kontrollü tutmak için `firebase/database.rules.json` dosyasını kullan.
- Yayın ortamında `test mode` kullanma.

## GitHub

```bash
git add .
git commit -m "feat: improve architecture and quality gates"
git push
```
