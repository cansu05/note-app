export const ConfirmModal = ({ isOpen, title, message, confirmText, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel}>
            Vazgeç
          </button>
          <button type="button" className="confirm-delete" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
