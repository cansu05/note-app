import { useCallback, useEffect, useRef } from "react";
import { clamp } from "../utils/noteSizing";

export const useBoardInteractions = ({
  boardRef,
  zoomRef,
  notesRef,
  setNotes,
  selectedId,
  setSelectedId,
  updateNote,
  service,
  maxZIndexRef
}) => {
  const pendingPositionRef = useRef(new Map());
  const pendingResizeRef = useRef(new Map());
  const resizeFrameRef = useRef(new Map());

  const clearInteractionQueues = useCallback(() => {
    resizeFrameRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
    resizeFrameRef.current.clear();
    pendingResizeRef.current.clear();
    pendingPositionRef.current.clear();
  }, []);

  useEffect(() => () => clearInteractionQueues(), [clearInteractionQueues]);

  const bringNoteToFront = useCallback((id) => {
    const currentNotes = notesRef.current;
    const target = currentNotes.find((note) => note.id === id);
    if (!target) return;

    const highestZ = currentNotes.reduce((max, note) => Math.max(max, note.zIndex ?? 1), 1);
    if ((target.zIndex ?? 1) >= highestZ) {
      setSelectedId(id);
      return;
    }

    const nextZ = highestZ + 1;
    maxZIndexRef.current = nextZ;
    setSelectedId(id);
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, zIndex: nextZ } : note)));

    service.updateNote(id, { zIndex: nextZ }).catch(() => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, zIndex: target.zIndex ?? 1 } : note
        )
      );
      maxZIndexRef.current = currentNotes.reduce(
        (max, note) => Math.max(max, note.zIndex ?? 1),
        1
      );
    });
  }, [maxZIndexRef, notesRef, service, setNotes, setSelectedId]);

  const moveNote = useCallback((id, dx, dy) => {
    const board = boardRef.current;
    if (!board) return;
    const zoom = zoomRef.current || 1;
    const target = notesRef.current.find((note) => note.id === id);
    if (!target) return;

    const canvasWidth = Math.max(board.scrollWidth / zoom, board.clientWidth / zoom + 500);
    const canvasHeight = Math.max(board.scrollHeight / zoom, board.clientHeight / zoom + 320);
    const maxX = canvasWidth - target.width;
    const maxY = canvasHeight - target.height;

    const nextX = clamp(target.x + dx, 0, Math.max(maxX, 0));
    const nextY = clamp(target.y + dy, 0, Math.max(maxY, 0));

    const existingPending = pendingPositionRef.current.get(id);
    const previousPosition = existingPending
      ? existingPending.previous
      : { x: target.x, y: target.y };

    pendingPositionRef.current.set(id, {
      next: { x: nextX, y: nextY },
      previous: previousPosition
    });

    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, x: nextX, y: nextY } : note)));
  }, [boardRef, notesRef, setNotes, zoomRef]);

  const commitNotePosition = useCallback(async (id) => {
    const pending = pendingPositionRef.current.get(id);
    if (!pending) return;

    pendingPositionRef.current.delete(id);
    try {
      await updateNote(id, pending.next, false);
    } catch {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, x: pending.previous.x, y: pending.previous.y }
            : note
        )
      );
      throw new Error("Note position update failed");
    }
  }, [setNotes, updateNote]);

  const queueNoteResize = useCallback((id, size) => {
    const existing = notesRef.current.find((note) => note.id === id);
    if (!existing) return;

    const nextWidth = size.width ?? existing.width;
    const nextHeight = size.height ?? existing.height;
    if (nextWidth === existing.width && nextHeight === existing.height) return;

    pendingResizeRef.current.set(id, { width: nextWidth, height: nextHeight });
    if (resizeFrameRef.current.has(id)) return;

    const frameId = requestAnimationFrame(() => {
      const pending = pendingResizeRef.current.get(id);
      pendingResizeRef.current.delete(id);
      resizeFrameRef.current.delete(id);
      if (!pending) return;
      setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, ...pending } : note)));
    });

    resizeFrameRef.current.set(id, frameId);
  }, [notesRef, setNotes]);

  return {
    selectedId,
    setSelectedId,
    bringNoteToFront,
    moveNote,
    commitNotePosition,
    queueNoteResize,
    clearInteractionQueues
  };
};
