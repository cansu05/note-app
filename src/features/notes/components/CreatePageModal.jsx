const buildPageOptions = (pages, parentId = null, depth = 0) =>
  pages
    .filter((page) => page.parentId === parentId)
    .flatMap((page) => [
      {
        id: page.id,
        label: `${"  ".repeat(depth)}${depth > 0 ? "└ " : ""}${page.name}`
      },
      ...buildPageOptions(pages, page.id, depth + 1)
    ]);

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
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal create-page-modal">
        <h3>Yeni Sayfa</h3>
        <p>Sayfa adini gir ve istersen ust sayfa secerek alt sayfa olustur.</p>
        <select
          className="create-page-select"
          value={parentPageId ?? ""}
          onChange={(e) => onChangeParentPage(e.target.value || null)}
        >
          <option value="">Ust seviye sayfa</option>
          {pageOptions.map((page) => (
            <option key={page.id} value={page.id}>
              {page.label}
            </option>
          ))}
        </select>
        <input
          className="create-page-input"
          value={draftName}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Orn: Gunluk, Is, Fikirler"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onCreate();
            }
          }}
        />
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel}>
            Vazgec
          </button>
          <button type="button" className="confirm-delete" onClick={onCreate}>
            Sayfayi Olustur
          </button>
        </div>
      </div>
    </div>
  );
};
