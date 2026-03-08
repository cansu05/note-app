import { useEffect, useMemo, useState } from "react";

const TOTAL_DURATION = 40;

const scenes = [
  {
    id: "hero",
    start: 0,
    end: 4,
    tag: "NOTE APP",
    title: "Notlarını sadece yazma.",
    subtitle: "Düzenle. Taşı. Ölçekle.",
    narration: "Note App, klasik not alma deneyimini görsel ve esnek bir çalışma alanına dönüştürüyor.",
    accent: "Akıllı notlar, düzenli akış"
  },
  {
    id: "auth",
    start: 4,
    end: 9,
    tag: "GÜVENLİ GİRİŞ",
    title: "E-posta, Google, GitHub",
    subtitle: "Hızlı ve güvenli erişim.",
    narration: "Güvenli kimlik doğrulama ile saniyeler içinde giriş yap, çalışma alanına anında ulaş.",
    accent: "Hızlı başlangıç"
  },
  {
    id: "pages",
    start: 9,
    end: 15,
    tag: "SAYFA YAPISI",
    title: "Hiyerarşik sayfalar",
    subtitle: "Ana sayfalar, alt sayfalar ve sürükle bırak düzeni.",
    narration: "İçeriklerini tek düzende değil, düzenli bir sayfa mimarisi içinde yönet.",
    accent: "Yapıyı koru"
  },
  {
    id: "canvas",
    start: 15,
    end: 22,
    tag: "SERBEST ALAN",
    title: "Esnek not yerleşimi",
    subtitle: "Notlar ve modeller tek ekranda.",
    narration: "Farklı içerik bloklarını aynı kanvasta konumlandır, büyük resmi birlikte gör.",
    accent: "Serbest yerleşim"
  },
  {
    id: "selection",
    start: 22,
    end: 28,
    tag: "TOPLU AKSİYON",
    title: "Çoklu seçim",
    subtitle: "Grup taşıma ve toplu renk atama.",
    narration: "Birden fazla notu seç, birlikte taşı ve renklerle odak alanlarını hızla ayır.",
    accent: "Tek hamlede düzen"
  },
  {
    id: "editor",
    start: 28,
    end: 33,
    tag: "RICH TEXT",
    title: "Biçimlendirilmiş içerik",
    subtitle: "Kalın, italik ve listeler.",
    narration: "Sadece not alma değil, okunabilir ve düzenli içerik hazırlama deneyimi sunar.",
    accent: "Daha okunaklı içerik"
  },
  {
    id: "zoom",
    start: 33,
    end: 37,
    tag: "NAVİGASYON",
    title: "Zoom ve pan",
    subtitle: "Büyük çalışma alanlarında rahat gezin.",
    narration: "Zoom ve pan kontrolleri ile büyük çalışma alanlarında bile akışını kaybetmezsin.",
    accent: "Kontrol sende"
  },
  {
    id: "finale",
    start: 37,
    end: 40,
    tag: "KAPANIŞ",
    title: "Note App",
    subtitle: "Daha akıllı not al. Daha görsel düşün.",
    narration: "Note App, notlarını yazmaktan öte onları düzenlemeni, taşımanı ve büyütmeni sağlar.",
    accent: "60 saniyelik lansman"
  }
];

const pageList = [
  { label: "Genel Plan", depth: 0, active: true },
  { label: "Lansman Akışı", depth: 1, active: false },
  { label: "İçerik Kurgusu", depth: 1, active: false },
  { label: "Sosyal Medya", depth: 2, active: false },
  { label: "Geri Bildirim", depth: 0, active: false }
];

const featureCards = [
  {
    id: "auth",
    title: "Güvenli Giriş",
    items: ["E-posta ile giriş", "Google ile giriş", "GitHub ile giriş", "Şifre sıfırlama"]
  },
  {
    id: "pages",
    title: "Sayfa Yapısı",
    items: ["Ana sayfalar", "Alt sayfalar", "Sürükle bırak taşıma", "Düzenli sayfa ağacı"]
  },
  {
    id: "canvas",
    title: "Not Alanı",
    items: ["Serbest yerleşim", "Not ve model kartları", "Sürükle bırak düzen", "Esnek çalışma yüzeyi"]
  },
  {
    id: "selection",
    title: "Toplu İşlemler",
    items: ["Çoklu seçim", "Grup taşıma", "Toplu renk değişimi", "Hızlı aksiyon akışı"]
  },
  {
    id: "editor",
    title: "İçerik Düzenleme",
    items: ["Kalın metin", "İtalik metin", "Liste stilleri", "Daha okunaklı notlar"]
  },
  {
    id: "zoom",
    title: "Gezinme",
    items: ["Zoom in / out", "Yüzde sıfırlama", "Space ile pan", "Geniş alan kontrolü"]
  }
];

const authProviders = ["Google ile giriş", "GitHub ile giriş"];

const actionSteps = [
  "Yeni sayfa oluştur",
  "Alt sayfa ekle",
  "Not ekle ve taşı",
  "Renk ver ve düzenle"
];

export function App() {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const safeElapsed = Math.min(elapsed, TOTAL_DURATION);

  useEffect(() => {
    if (elapsed > TOTAL_DURATION) {
      setElapsed(TOTAL_DURATION);
      setIsPlaying(false);
    }
  }, [elapsed]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const baseline = Date.now() - safeElapsed * 1000;
    const intervalId = window.setInterval(() => {
      const nextElapsed = Math.min((Date.now() - baseline) / 1000, TOTAL_DURATION);
      setElapsed(nextElapsed);
      if (nextElapsed >= TOTAL_DURATION) {
        setIsPlaying(false);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, safeElapsed]);

  const activeScene = useMemo(() => {
    return scenes.find((scene) => safeElapsed >= scene.start && safeElapsed < scene.end) ?? scenes[scenes.length - 1];
  }, [safeElapsed]);

  const activeIndex = scenes.findIndex((scene) => scene.id === activeScene.id);

  const handleToggle = () => {
    if (safeElapsed >= TOTAL_DURATION) {
      setElapsed(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((current) => !current);
  };

  const handleReset = () => {
    setElapsed(0);
    setIsPlaying(true);
  };

  return (
    <main className={`app-shell scene-${activeScene.id}`}>
      <div className="frame">
        <header className="hero-bar">
          <div>
            <p className="tag">{activeScene.tag}</p>
            <h1>{activeScene.title}</h1>
            <p className="subtitle">{activeScene.subtitle}</p>
          </div>
        </header>

        <section className="demo-layout">
          <aside className="sidebar">
            <div className="panel-head">
              <span>Sayfalar</span>
              <button type="button">+ Sayfa</button>
            </div>
            <div className="tree">
              {pageList.map((page) => (
                <div
                  key={`${page.label}-${page.depth}`}
                  className={`tree-row${page.active ? " active" : ""}`}
                  style={{ paddingLeft: `${10 + page.depth * 16}px` }}
                >
                  <span className="tree-mark" />
                  <span>{page.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="board">
            <div className="toolbar">
              <div className="palette">
                <span className="dot rose" />
                <span className="dot blush" />
                <span className="dot soft" />
                <span className="dot cream" />
              </div>
              <div className="toolbar-actions">
                <button type="button">Kısayollar</button>
                <button type="button">+ Not Ekle</button>
                <button type="button">+ Model Ekle</button>
              </div>
            </div>

            <div className="canvas">
              {activeScene.id === "auth" ? (
                <section className="auth-demo">
                  <div className="auth-shell-demo">
                    <div className="auth-scene-card">
                      <span className="auth-scene-pill">Güvenli Çalışma Alanı</span>
                      <h3>Note App</h3>
                      <p className="auth-scene-subtitle">Yeni hesap oluştur</p>

                      <div className="auth-field">
                        <label>Ad Soyad</label>
                        <div className="mock-input">Cansu Demir</div>
                      </div>
                      <div className="auth-field">
                        <label>E-posta</label>
                        <div className="mock-input">cansu@ornek.com</div>
                      </div>
                      <div className="auth-field">
                        <label>Şifre</label>
                        <div className="mock-input">••••••••••</div>
                      </div>

                      <button type="button" className="auth-submit-demo">Kayıt Ol</button>
                      <button type="button" className="auth-link-demo">Şifremi unuttum</button>

                      <div className="auth-divider-demo">veya</div>

                      <div className="provider-list">
                        {authProviders.map((provider, index) => (
                          <button key={provider} type="button" className="provider-button">
                            <span className={`provider-icon ${index === 0 ? "google" : "github"}`}>
                              {index === 0 ? "G" : "GH"}
                            </span>
                            <span>{provider}</span>
                          </button>
                        ))}
                      </div>

                      <button type="button" className="auth-switch-demo">
                        Zaten hesabım var, giriş yap
                      </button>
                    </div>
                  </div>
                </section>
              ) : activeScene.id === "pages" || activeScene.id === "canvas" ? (
                <section className="usage-demo">
                  <div className="usage-grid">
                    <article className="usage-panel">
                      <h3>Sayfa Akışı</h3>
                      <div className="usage-list">
                        {actionSteps.map((step, index) => (
                          <div
                            key={step}
                            className={`usage-row${
                              (activeScene.id === "pages" && index < 2) ||
                              (activeScene.id === "canvas" && index < 4)
                                ? " active"
                                : ""
                            }`}
                          >
                            <span>{index + 1}</span>
                            <strong>{step}</strong>
                          </div>
                        ))}
                      </div>
                    </article>
                    <article className="usage-panel board-preview">
                      <h3>Uygulama Kullanımı</h3>
                      <div className="mini-board">
                        <div className="mini-note note-a">Yeni Not</div>
                        <div className="mini-note note-b">İçerik Planı</div>
                        <div className="mini-note note-c">Yayın Takvimi</div>
                      </div>
                    </article>
                  </div>
                </section>
              ) : activeScene.id === "selection" ? (
                <section className="selection-demo">
                  <div className="selection-layout">
                    <article className="selection-panel">
                      <h3>Çoklu seçim aktif</h3>
                      <div className="selection-steps">
                        <div className="selection-step active">
                          <span>1</span>
                          <strong>Birden fazla not seçildi</strong>
                        </div>
                        <div className="selection-step active">
                          <span>2</span>
                          <strong>Seçili notlar birlikte taşınıyor</strong>
                        </div>
                        <div className="selection-step active">
                          <span>3</span>
                          <strong>Renk paletinden toplu renk uygulandı</strong>
                        </div>
                      </div>
                      <div className="selection-palette">
                        <span className="palette-label">Toplu renk:</span>
                        <span className="palette-swatch rose" />
                        <span className="palette-swatch blush" />
                        <span className="palette-swatch active" />
                        <span className="palette-swatch cream" />
                      </div>
                    </article>

                    <article className="selection-board-panel">
                      <h3>Taşıma Önizlemesi</h3>
                      <div className="selection-board">
                        <div className="selection-arrow">
                          <span>Birlikte taşı</span>
                        </div>
                        <div className="selection-note note-one">İçerik Planı</div>
                        <div className="selection-note note-two">Yayın Takvimi</div>
                        <div className="selection-note note-three">Sosyal Medya</div>
                      </div>
                    </article>
                  </div>
                </section>
              ) : activeScene.id === "zoom" ? (
                <section className="zoom-demo">
                  <div className="zoom-layout">
                    <article className="zoom-panel">
                      <h3>Zoom ve pan aktif</h3>
                      <div className="zoom-stats">
                        <div className="zoom-stat active">
                          <span>Yakınlaştırma</span>
                          <strong>%125</strong>
                        </div>
                        <div className="zoom-stat">
                          <span>Pan modu</span>
                          <strong>Space + sürükle</strong>
                        </div>
                        <div className="zoom-stat">
                          <span>Odak</span>
                          <strong>Geniş çalışma alanı</strong>
                        </div>
                      </div>
                    </article>

                    <article className="zoom-board-panel">
                      <h3>Yakınlaştırılmış görünüm</h3>
                      <div className="zoom-board">
                        <div className="zoom-indicator-badge">%125</div>
                        <div className="pan-indicator">Pan yönü ↗</div>
                        <div className="zoom-surface">
                          <div className="zoom-card z-one">Ürün Notları</div>
                          <div className="zoom-card z-two">Yol Haritası</div>
                          <div className="zoom-card z-three">Geri Bildirim</div>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>
              ) : (
                <div className="feature-grid">
                  {featureCards.map((card) => (
                    <article
                      key={card.id}
                      className={`feature-card${card.id === activeScene.id ? " active" : ""}`}
                    >
                      <h3>{card.title}</h3>
                      <ul>
                        {card.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="narration-bar">
          <p>{activeScene.narration}</p>
          <div className="time-badge">
            <span>{String(Math.floor(safeElapsed)).padStart(2, "0")} sn</span>
            <span>/ 40 sn</span>
          </div>
        </section>

        <footer className="controls">
          <div className="timeline" aria-hidden="true">
            <div className="timeline-fill" style={{ width: `${(safeElapsed / TOTAL_DURATION) * 100}%` }} />
            {scenes.map((scene, index) => (
              <span
                key={scene.id}
                className={`timeline-step${index <= activeIndex ? " active" : ""}`}
                style={{ left: `${(scene.start / TOTAL_DURATION) * 100}%` }}
              />
            ))}
          </div>
          <div className="actions">
            <button type="button" onClick={handleToggle}>
              {isPlaying ? "Duraklat" : safeElapsed >= TOTAL_DURATION ? "Yeniden Başlat" : "Oynat"}
            </button>
            <button type="button" onClick={handleReset}>Sıfırla</button>
          </div>
        </footer>
      </div>
    </main>
  );
}
