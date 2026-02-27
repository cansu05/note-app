# Note App - Notes Board

Production odakli, cok sayfali bir not/canvas uygulamasi.  
Amac, hiyerarsik bilgi mimarisi (page/subpage) ile serbest yerlesimli not duzenlemeyi ayni deneyimde birlestirmek.

## One Cikan Ozellikler

- Hiyerarsik sayfa agaci
  - Root page + sinirsiz subpage
  - Arrow ile ac/kapa
  - Drag-and-drop ile page tasima (`before`, `after`, `inside`)
- Canvas not yonetimi
  - Tekli/coklu secim (Shift, Ctrl/Cmd)
  - Grup surukleme (secili notlar birlikte hareket eder)
  - Yeniden boyutlandirma ve otomatik icerik olcumleme
  - Model/not tipleri (farkli varsayilan davranislar)
- Kisayol odakli kullanim
  - `Ctrl/Cmd + C` / `Ctrl/Cmd + V` (coklu kopyala-yapistir)
  - `Delete/Backspace` (tekli/coklu silme)
  - `Space + drag` ile hand-pan (canvas icinde gezinme)
- Zengin metin (rich text)
  - Kalin/italik/liste stilleri
  - HTML sanitize + normalize pipeline
- Tema ve gorunum
  - Ust palette hizli renk atama
  - Secili notlara toplu renk uygulama
  - Zoom in/out/reset

## Mimari

- Feature-first yapi: `src/features/notes/*`
- State katmanlari:
  - `zustand` UI store (`useBoardUiStore`)
  - `zustand` data store (`useBoardDataStore`)
- Domain/Service/Repository ayrimi:
  - `domain/*`: entity/default degerler
  - `services/*`: uygulama kurallari
  - `repositories/*`: Firebase IO
- Hook tabanli orchestration:
  - `useBoardData`, `useBoardInteractions`, `useBoardKeyboardShortcuts`, `useNotesPageController`

## Performans Notlari

- Page move islemlerinde batch update (`updateMany`) kullanilir.
- Coklu not kopyalama paralel calisir (`Promise.all`).
- Keyboard listener stabil tutulur (gereksiz re-bind azaltilmistir).
- Pan davranisi render maliyetini dusurecek sekilde optimize edilmistir.

## Guvenlik

- Rich text girisleri sanitize edilir (`sanitizeRichHtml`).
- Firebase Realtime Database kurallari:
  - user isolation (`auth.uid === $uid`)
  - id/path tutarliligi
  - kritik alanlarda tip ve sinir dogrulamalari
- `firebase/database.rules.json` dosyasi source control altinda tutulur.

## Test ve Kalite

- Unit/component testler: Vitest + Testing Library
- Mevcut kapsam:
  - store davranislari
  - page-tree move helper
  - keyboard shortcuts
  - interaction rollback
  - sidebar DnD
  - rich text sanitize

```bash
npm run lint
npm run test
npm run build
```

## Teknolojiler

- React 18
- Vite 5
- Zustand
- Firebase Realtime Database + Auth
- Vitest + Testing Library

## Kurulum

```bash
npm install
npm run dev
```

`.env` dosyasini `.env.example` baz alarak `VITE_FIREBASE_*` degiskenleri ile doldur.

## Firebase Kurulumu

1. Firebase projesi olustur.
2. Realtime Database'i aktif et.
3. Auth provider'larini ac (`Email/Password`, `Google`, `GitHub`).
4. Gerekli OAuth callback URL'lerini provider tarafinda tanimla.
5. Web app config'ini `.env` icine `VITE_FIREBASE_*` olarak ekle.
6. Publish oncesi database rules dosyasini deploy et.
