import { memo, useCallback } from "react";
import { NOTES_UI_ERRORS, NOTES_UI_TEXT } from "../notesMessages";
import { NoteCard } from "./NoteCard";

export const NotesBoardCanvas = memo(({
  notes,
  selectedId,
  boardRef,
  boardStage,
  zoomLevel,
  setSelectedId,
  bringNoteToFront,
  moveNote,
  commitNotePosition,
  updateNote,
  queueNoteResize,
  openConfirm,
  closeConfirm,
  removeNote,
  setUiError
}) => {
  const clearSelection = useCallback(() => setSelectedId(null), [setSelectedId]);
  const handleSelect = useCallback((id) => bringNoteToFront(id), [bringNoteToFront]);
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
              isSelected={selectedId === note.id}
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
