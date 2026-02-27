import { useEffect, useState } from "react";

export const ActivePagePanel = ({ activePage, renamePage, onRequestDelete }) => {
  const [draftName, setDraftName] = useState(activePage?.name ?? "");

  useEffect(() => {
    setDraftName(activePage?.name ?? "");
  }, [activePage?.id, activePage?.name]);

  if (!activePage) {
    return null;
  }

  const handleRename = () => {
    renamePage(activePage.id, draftName);
  };

  return (
    <div className="active-page-panel">
      <span className="active-page-label">Aktif Sayfa</span>
      <input
        className="active-page-input"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleRename();
          }
        }}
      />
      <div className="active-page-actions">
        <button type="button" className="active-page-btn" onClick={handleRename}>
          Ismi Kaydet
        </button>
        <button
          type="button"
          className="active-page-btn active-page-btn-danger"
          onClick={() => onRequestDelete(activePage)}
        >
          Sayfayi Sil
        </button>
      </div>
    </div>
  );
};
