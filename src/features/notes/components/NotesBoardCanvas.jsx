import { memo, useCallback, useEffect, useRef, useState } from "react";
import { NOTES_UI_ERRORS, NOTES_UI_TEXT } from "../notesMessages";
import { useBoardUiStore } from "../store/useBoardUiStore";
import { useBoardKeyboardShortcuts } from "../hooks/useBoardKeyboardShortcuts";
import { NoteCard } from "./NoteCard";

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
};

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
  selectionRect,
  startMarqueeSelection,
  updateMarqueeSelection,
  endMarqueeSelection,
  cancelMarqueeSelection,
  openConfirm,
  closeConfirm,
  removeNote,
  setUiError
}) => {
  const clipboardIds = useBoardUiStore((state) => state.clipboardIds);
  const setClipboardIds = useBoardUiStore((state) => state.setClipboardIds);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef({ active: false, x: 0, y: 0 });
  const suppressClickRef = useRef(false);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomLevelRef = useRef(zoomLevel);
  const frameRef = useRef(null);
  const zoomNodeRef = useRef(null);

  const applyTransform = useCallback(() => {
    const node = zoomNodeRef.current;
    if (!node) return;
    const { x, y } = panOffsetRef.current;
    node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoomLevelRef.current})`;
  }, []);

  const toBoardPoint = useCallback(
    (event) => {
      const board = boardRef.current;
      if (!board) return { x: 0, y: 0 };
      const rect = board.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - panOffsetRef.current.x) / zoomLevelRef.current,
        y: (event.clientY - rect.top - panOffsetRef.current.y) / zoomLevelRef.current
      };
    },
    [boardRef]
  );

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
    applyTransform();
  }, [applyTransform, zoomLevel]);

  useEffect(
    () => () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== "Space") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setIsSpacePressed(true);
    };

    const onKeyUp = (event) => {
      if (event.code !== "Space") return;
      setIsSpacePressed(false);
      panStateRef.current.active = false;
      setIsPanning(false);
    };

    const onBlur = () => {
      setIsSpacePressed(false);
      panStateRef.current.active = false;
      setIsPanning(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

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

  const handleBoardPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      const isNoteTarget = Boolean(event.target?.closest?.(".note-card"));
      if (isSpacePressed) {
        panStateRef.current = { active: true, x: event.clientX, y: event.clientY };
        setIsPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      if (isNoteTarget) return;

      const start = toBoardPoint(event);
      startMarqueeSelection(start);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isSpacePressed, startMarqueeSelection, toBoardPoint]
  );

  const handleBoardPointerMove = useCallback((event) => {
    if (panStateRef.current.active) {
      const dx = event.clientX - panStateRef.current.x;
      const dy = event.clientY - panStateRef.current.y;
      panStateRef.current.x = event.clientX;
      panStateRef.current.y = event.clientY;
      panOffsetRef.current = {
        x: panOffsetRef.current.x + dx,
        y: panOffsetRef.current.y + dy
      };
      if (frameRef.current != null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        applyTransform();
      });
      return;
    }

    if (!selectionRect) return;
    const point = toBoardPoint(event);
    updateMarqueeSelection(point);
  }, [applyTransform, selectionRect, toBoardPoint, updateMarqueeSelection]);

  const handleBoardPointerUp = useCallback((event) => {
    if (panStateRef.current.active) {
      panStateRef.current.active = false;
      setIsPanning(false);
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (selectionRect) {
      suppressClickRef.current = endMarqueeSelection().moved;
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }, [endMarqueeSelection, selectionRect]);

  const handleBoardClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!selectionRect) {
      clearSelection();
    }
  }, [clearSelection, selectionRect]);

  const handleBoardPointerCancel = useCallback(() => {
    panStateRef.current.active = false;
    setIsPanning(false);
    cancelMarqueeSelection();
  }, [cancelMarqueeSelection]);

  return (
    <section
      className={`board ${isSpacePressed ? "pan-ready" : ""} ${isPanning ? "panning" : ""} ${selectionRect ? "selecting" : ""}`}
      ref={boardRef}
      onClick={handleBoardClick}
      onPointerDown={handleBoardPointerDown}
      onPointerMove={handleBoardPointerMove}
      onPointerUp={handleBoardPointerUp}
      onPointerCancel={handleBoardPointerCancel}
    >
      <div className="board-zoom-stage">
        <div
          ref={zoomNodeRef}
          className="board-zoom"
          style={{
            width: boardStage.unscaledWidth,
            height: boardStage.unscaledHeight
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
          {selectionRect ? (
            <div
              className="selection-marquee"
              style={{
                left: selectionRect.left,
                top: selectionRect.top,
                width: selectionRect.width,
                height: selectionRect.height
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
});

NotesBoardCanvas.displayName = "NotesBoardCanvas";
