const INDENT_STEP = 14;

export const NotesSidebar = ({
  pages,
  activePageId,
  selectPage,
  onRequestCreatePage,
  onRequestCreateSubPage
}) => {
  const renderPages = (parentId = null, depth = 0) =>
    pages
      .filter((page) => page.parentId === parentId)
      .map((page) => (
        <div key={page.id} className="page-node">
          <div className="page-row" style={{ paddingLeft: depth * INDENT_STEP }}>
            <button
              type="button"
              className={`page-item ${page.id === activePageId ? "active" : ""}`}
              onClick={() => selectPage(page.id)}
            >
              {page.name}
            </button>
            <button
              type="button"
              className="create-subpage"
              onClick={() => onRequestCreateSubPage(page.id)}
              title="Alt sayfa ekle"
              aria-label={`${page.name} için alt sayfa ekle`}
            >
              +
            </button>
          </div>
          {renderPages(page.id, depth + 1)}
        </div>
      ));

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h2>Sayfalar</h2>
        <button type="button" className="create-page" onClick={onRequestCreatePage}>
          + Sayfa
        </button>
      </div>
      <div className="page-list">{renderPages()}</div>
    </aside>
  );
};
