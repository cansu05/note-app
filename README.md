# Note App - Firebase Notes Board

Modern ve olceklenebilir bir not uygulamasi.
Kullanicilar coklu sayfa/alt sayfa olusturabilir, notlari surukleyip yeniden boyutlandirabilir ve zengin metin olarak duzenleyebilir.

## Ozellikler

- Coklu sayfa ve alt sayfa (hiyerarsik yapi)
- Surukle-birak not yerlesimi
- Not yeniden boyutlandirma
- Zengin metin duzenleme (kalin, italik, liste stilleri)
- Zoom kontrolleri
- Renk secimi ile not olusturma
- Firebase Realtime Database ile kalici veri
- Servis + repository tabanli mimari

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

## Build

```bash
npm run build
npm run preview
```

## Firebase Kurulumu

1. Firebase Console'da proje olustur.
2. Realtime Database'i aktif et (gelistirme icin `test mode`).
3. Web app ekle ve config degerlerini al.
4. `src/lib/firebase.js` icindeki config'i kendi proje bilgilerinle degistir.

## GitHub

```bash
git add .
git commit -m "feat: integrate firebase realtime database"
git push
```
