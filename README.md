# ?? Note App - Yapýþkan Not Panosu

Modern bir not uygulamasý. Kullanýcýlar sayfalar oluþturabilir, not ekleyebilir, notlarý sürükleyip yeniden boyutlandýrabilir ve içerikleri zengin metin olarak düzenleyebilir.

## ?? Özellikler

- Çoklu sayfa ve alt sayfa (hiyerarþik yapý)
- Sürükle-býrak not yerleþimi
- Notlarý yeniden boyutlandýrma
- Zengin metin düzenleme (kalýn, italik, liste stilleri)
- Yakýnlaþtýrma/Uzaklaþtýrma (zoom)
- Renk seçimiyle not oluþturma
- LocalStorage ile kalýcý veri saklama
- Servis + repository ayrýmýyla ölçeklenebilir mimari

## ?? Teknolojiler

- React 18
- Vite 5
- JavaScript (ES Modules)
- CSS
- LocalStorage

## ?? Proje Yapýsý

```txt
src/
  domain/
  features/notes/
    components/
    hooks/
    utils/
  repositories/
  services/
```

## ? Kurulum

```bash
npm install
npm run dev
```

## ?? Build

```bash
npm run build
npm run preview
```

## ?? GitHub'a Gönderme

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <GITHUB_REPO_URL>
git push -u origin main
```

## ?? Not

Repository katmaný soyutlandýðý için ileride `LocalNoteRepository` yerine örneðin Firebase tabanlý bir repository kolayca eklenebilir.
