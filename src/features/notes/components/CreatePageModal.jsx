const sortPages = (pages = []) =>
  pages.slice().sort((a, b) => {
    const aOrder = Number.isFinite(a?.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b?.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "tr");
  });

const buildPageOptions = (pages = []) => {
  const sortedPages = sortPages(pages);
  const childrenByParentId = new Map();

  sortedPages.forEach((page) => {
    const key = page?.parentId ?? null;
    const siblings = childrenByParentId.get(key) ?? [];
    siblings.push(page);
    childrenByParentId.set(key, siblings);
  });

  const options = [];
  const visited = new Set();

  const walk = (page, depth = 0, path = new Set()) => {
    if (!page?.id || visited.has(page.id) || path.has(page.id)) return;

    visited.add(page.id);
    options.push({
      id: page.id,
      label: `${"  ".repeat(depth)}${depth > 0 ? "- " : ""}${page.name}`
    });

    const nextPath = new Set(path);
    nextPath.add(page.id);
    const children = childrenByParentId.get(page.id) ?? [];
    children.forEach((child) => walk(child, depth + 1, nextPath));
  };

  const rootPages = childrenByParentId.get(null) ?? [];
  rootPages.forEach((page) => walk(page, 0));

  // Malformed/legacy data can contain unreachable or cyclic branches; render them once safely.
  sortedPages.forEach((page) => walk(page, 0));

  return options;
};

export const CreatePageModal = ({
  isOpen,
  draftName,
  parentPageId,
  pages,
  onChangeName,
  onChangeParentPage,
  onCancel,
  onCreate
}) => {
  if (!isOpen) return null;
  const pageOptions = buildPageOptions(pages);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-page-title"
      aria-describedby="create-page-description"
    >
      <div className="confirm-modal create-page-modal">
        <h3 id="create-page-title">Yeni Sayfa</h3>
        <p>Sayfa adını gir ve istersen üst sayfa seçerek alt sayfa oluştur.</p>
        <p id="create-page-description" className="sr-only">
          Yeni sayfa olusturma formu.
        </p>
        <select
          className="create-page-select"
          value={parentPageId ?? ""}
          aria-label="Ust sayfa secimi"
          onChange={(e) => onChangeParentPage(e.target.value || null)}
        >
          <option value="">Üst seviye sayfa</option>
          {pageOptions.map((page) => (
            <option key={page.id} value={page.id}>
              {page.label}
            </option>
          ))}
        </select>
        <input
          className="create-page-input"
          value={draftName}
          aria-label="Yeni sayfa adi"
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Örn: Günlük, İş, Fikirler"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onCreate();
            }
          }}
        />
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel}>
            Vazgeç
          </button>
          <button type="button" className="confirm-delete" onClick={onCreate}>
            Sayfayı Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};
