import { memo, useCallback } from "react";
import { NOTES_UI_ERRORS, NOTES_UI_TEXT } from "../notesMessages";
import { useBoardUiStore } from "../store/useBoardUiStore";
import { useBoardKeyboardShortcuts } from "../hooks/useBoardKeyboardShortcuts";
import { NoteCard } from "./NoteCard";

export const NotesBoardCanvas = memo(({
  notes,
  selectedId,
  selectedIds,
  boardRef,
  boardStage,
  zoomLevel,
  clearSelection,
  bringNoteToFront,
  moveNote,
  commitNotePosition,
  updateNote,
  duplicateNotes,
  setSelectedIds,
  queueNoteResize,
  openConfirm,
  closeConfirm,
  removeNote,
  setUiError
}) => {
  const clipboardIds = useBoardUiStore((state) => state.clipboardIds);
  const setClipboardIds = useBoardUiStore((state) => state.setClipboardIds);

  const handleSelect = useCallback(
    (id, event) => {
      const isAdditive = Boolean(event?.shiftKey || event?.metaKey || event?.ctrlKey);
      const preserveGroup =
        !isAdditive && selectedIds.includes(id) && selectedIds.length > 1;
      bringNoteToFront(id, { additive: isAdditive, preserveGroup });
    },
    [bringNoteToFront, selectedIds]
  );

  const handleDrag = useCallback(
    (id, dx, dy) => moveNote(id, dx / zoomLevel, dy / zoomLevel),
    [moveNote, zoomLevel]
  );

  const handleDragEnd = useCallback(
    async (id) => {
      try {
        await commitNotePosition(id);
        setUiError("");
      } catch {
        setUiError(NOTES_UI_ERRORS.moveNote);
      }
    },
    [commitNotePosition, setUiError]
  );

  const handleSave = useCallback(
    async ({ id, ...changes }) => {
      try {
        await updateNote(id, changes);
        setUiError("");
      } catch {
        setUiError(NOTES_UI_ERRORS.saveNote);
        throw new Error("Note save failed");
      }
    },
    [setUiError, updateNote]
  );

  const handleResize = useCallback((id, size) => queueNoteResize(id, size), [queueNoteResize]);

  const handleDelete = useCallback(
    (note) =>
      openConfirm({
        title: NOTES_UI_TEXT.deleteNoteTitle,
        message: `"${note.title || "Yeni Not"}" notu silinecek.`,
        confirmText: NOTES_UI_TEXT.deleteNoteConfirm,
        onConfirm: async () => {
          await removeNote(note.id);
          closeConfirm();
        }
      }),
    [closeConfirm, openConfirm, removeNote]
  );

  useBoardKeyboardShortcuts({
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

  return (
    <section className="board" ref={boardRef} onClick={clearSelection}>
      <div className="board-zoom-stage" style={{ width: boardStage.stageWidth, height: boardStage.stageHeight }}>
        <div
          className="board-zoom"
          style={{
            width: boardStage.unscaledWidth,
            height: boardStage.unscaledHeight,
            transform: `scale(${zoomLevel})`
          }}
        >
          {notes.length === 0 ? <p className="empty-board">{NOTES_UI_TEXT.emptyBoard}</p> : null}

          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedIds.includes(note.id) || selectedId === note.id}
              onSelect={handleSelect}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onSave={handleSave}
              onResize={handleResize}
              onDelete={handleDelete}
              boardRef={boardRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

NotesBoardCanvas.displayName = "NotesBoardCanvas";
