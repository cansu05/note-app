import { useEffect, useRef } from "react";
import { NOTES_UI_ERRORS, NOTES_UI_TEXT } from "../notesMessages";

const isEditableTarget = (target) => {
  const targetElement = target instanceof HTMLElement ? target : null;
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selectionAnchor = window.getSelection()?.anchorNode;
  const selectionElement =
    selectionAnchor?.nodeType === Node.TEXT_NODE
      ? selectionAnchor.parentElement
      : selectionAnchor instanceof HTMLElement
        ? selectionAnchor
        : null;

  const candidates = [targetElement, activeElement, selectionElement].filter(Boolean);
  return candidates.some((element) => {
    if (element.isContentEditable) return true;
    return Boolean(element.closest("input, textarea, [contenteditable='true']"));
  });
};

export const useBoardKeyboardShortcuts = ({
  notes,
  selectedId,
  selectedIds,
  clearSelection,
  duplicateNotes,
  removeNote,
  openConfirm,
  closeConfirm,
  setSelectedIds,
  setClipboardIds,
  clipboardIds,
  setUiError
}) => {
  const latestRef = useRef({
    notes,
    selectedId,
    selectedIds,
    clearSelection,
    duplicateNotes,
    removeNote,
    openConfirm,
    closeConfirm,
    setSelectedIds,
    setClipboardIds,
    clipboardIds,
    setUiError
  });

  latestRef.current = {
    notes,
    selectedId,
    selectedIds,
    clearSelection,
    duplicateNotes,
    removeNote,
    openConfirm,
    closeConfirm,
    setSelectedIds,
    setClipboardIds,
    clipboardIds,
    setUiError
  };

  useEffect(() => {
    const onKeyDown = async (event) => {
      const {
        notes: currentNotes,
        selectedId: currentSelectedId,
        selectedIds: currentSelectedIds,
        clearSelection: currentClearSelection,
        duplicateNotes: currentDuplicateNotes,
        removeNote: currentRemoveNote,
        openConfirm: currentOpenConfirm,
        closeConfirm: currentCloseConfirm,
        setSelectedIds: currentSetSelectedIds,
        setClipboardIds: currentSetClipboardIds,
        clipboardIds: currentClipboardIds,
        setUiError: currentSetUiError
      } = latestRef.current;

      if (isEditableTarget(event.target)) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        const targetIds =
          currentSelectedIds.length > 0
            ? currentSelectedIds
            : currentSelectedId
              ? [currentSelectedId]
              : [];
        if (targetIds.length === 0) return;

        event.preventDefault();
        const selectedNotes = currentNotes.filter((note) => targetIds.includes(note.id));
        const singleTitle = selectedNotes[0]?.title || "Yeni Not";
        currentOpenConfirm({
          title: NOTES_UI_TEXT.deleteNoteTitle,
          message:
            targetIds.length === 1
              ? `"${singleTitle}" notu silinecek.`
              : `${targetIds.length} not silinecek.`,
          confirmText: NOTES_UI_TEXT.deleteNoteConfirm,
          onConfirm: async () => {
            await Promise.all(targetIds.map((id) => currentRemoveNote(id)));
            currentClearSelection();
            currentCloseConfirm();
          }
        });
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;

      const key = event.key.toLowerCase();
      if (key === "c") {
        if (currentSelectedIds.length === 0) return;
        currentSetClipboardIds(currentSelectedIds);
        event.preventDefault();
        return;
      }

      if (key === "v") {
        if (currentClipboardIds.length === 0) return;
        event.preventDefault();
        try {
          const created = await currentDuplicateNotes(currentClipboardIds);
          const createdIds = created.map((note) => note.id);
          currentSetSelectedIds(createdIds);
          currentSetUiError("");
        } catch {
          currentSetUiError(NOTES_UI_ERRORS.saveNote);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
