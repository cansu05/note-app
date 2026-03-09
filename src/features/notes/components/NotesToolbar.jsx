export const NotesToolbar = ({
  colors,
  activeColor,
  setActiveColor,
  onOpenShortcuts,
  createNote,
  createModel,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  return (
    <header className="toolbar">
      <h1>Note Canvas</h1>
      <div className="palette">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`swatch ${activeColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => setActiveColor(color)}
            aria-label={`Color ${color}`}
          />
        ))}
      </div>
      <div className="zoom-controls">
        <button type="button" className="zoom-btn" onClick={onZoomOut}>
          <span className="sr-only">Uzaklastir</span>
          -
        </button>
        <span className="zoom-value">%{Math.round(zoomLevel * 100)}</span>
        <button type="button" className="zoom-btn" onClick={onZoomIn}>
          <span className="sr-only">Yakinlastir</span>
          +
        </button>
        <button type="button" className="zoom-reset" onClick={onZoomReset}>
          100%
        </button>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="create-model" onClick={onOpenShortcuts}>
          Kısayollar
        </button>
        <button type="button" className="create-note" onClick={createNote}>
          + Not Ekle
        </button>
        <button type="button" className="create-model" onClick={createModel}>
          + Model Ekle
        </button>
      </div>
    </header>
  );
};
