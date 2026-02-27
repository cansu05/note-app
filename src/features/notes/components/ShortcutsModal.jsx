export const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal shortcuts-modal">
        <h3>Kısayollar</h3>
        <ul className="shortcuts-list">
          <li>
            <kbd>Shift</kbd> + tık: Çoklu seçim
          </li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + tık: Çoklu seçim (ekle/çıkar)
          </li>
          <li>Seçili notlardan birini sürükle: Tüm seçili notlar birlikte taşınır</li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>C</kbd>: Seçili notları kopyala
          </li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>V</kbd>: Yapıştır
          </li>
          <li>
            <kbd>Delete</kbd>/<kbd>Backspace</kbd>: Seçili notları sil
          </li>
          <li>Seçili not varken üstteki renklerden tıkla: Toplu renk değiştir</li>
        </ul>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-cancel" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
