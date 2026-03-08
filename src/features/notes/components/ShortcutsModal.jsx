export const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal shortcuts-modal">
        <h3>Kisayollar</h3>
        <ul className="shortcuts-list">
          <li>
            <kbd>Shift</kbd> + tik: Coklu secim
          </li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + tik: Coklu secim (ekle/cikar)
          </li>
          <li>Secili notlardan birini surukle: Tum secili notlar birlikte tasinir</li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>C</kbd>: Secili notlari kopyala
          </li>
          <li>
            <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>V</kbd>: Yapistir
          </li>
          <li>
            <kbd>Delete</kbd>/<kbd>Backspace</kbd>: Secili notlari sil
          </li>
          <li>
            <kbd>Alt</kbd> basili tut + surukle: Canvas icinde hand ile gez
          </li>
          <li>Secili not varken ustteki renklerden tikla: Toplu renk degistir</li>
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
