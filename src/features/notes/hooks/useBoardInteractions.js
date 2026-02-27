import { useCallback, useEffect, useRef } from "react";
import { clamp } from "../utils/noteSizing";
import { useBoardUiStore } from "../store/useBoardUiStore";

export const useBoardInteractions = ({
  boardRef,
  zoomRef,
  notesRef,
  setNotes,
  updateNote,
  service,
  maxZIndexRef
}) => {
  const pendingPositionRef = useRef(new Map());
  const pendingResizeRef = useRef(new Map());
  const resizeFrameRef = useRef(new Map());
  const selectedId = useBoardUiStore((state) => state.selectedId);
  const setSelectedId = useBoardUiStore((state) => state.setSelectedId);
  const selectedIds = useBoardUiStore((state) => state.selectedIds);
  const setSelectedIds = useBoardUiStore((state) => state.setSelectedIds);
  const clearSelectedIds = useBoardUiStore((state) => state.clearSelectedIds);
  const selectedIdsRef = useRef([]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    if (selectedId == null) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((previous) => (previous.includes(selectedId) ? previous : [selectedId]));
  }, [selectedId, setSelectedIds]);

  const clearInteractionQueues = useCallback(() => {
    resizeFrameRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
    resizeFrameRef.current.clear();
    pendingResizeRef.current.clear();
    pendingPositionRef.current.clear();
  }, []);

  useEffect(() => () => clearInteractionQueues(), [clearInteractionQueues]);

  const selectNote = useCallback(
    (id, { additive = false, preserveGroup = false } = {}) => {
      if (preserveGroup) {
        setSelectedIds((previous) => {
          if (previous.includes(id) && previous.length > 1) {
            setSelectedId(id);
            return previous;
          }
          setSelectedId(id);
          return [id];
        });
        return;
      }

      if (!additive) {
        setSelectedIds([id]);
        setSelectedId(id);
        return;
      }

      setSelectedIds((previous) => {
        if (previous.includes(id)) {
          const next = previous.filter((selected) => selected !== id);
          setSelectedId(next[0] ?? null);
          return next;
        }
        const next = [...previous, id];
        setSelectedId(id);
        return next;
      });
    },
    [setSelectedId, setSelectedIds]
  );

  const clearSelection = useCallback(() => {
    clearSelectedIds();
    setSelectedId(null);
  }, [clearSelectedIds, setSelectedId]);

  const bringNoteToFront = useCallback(
    (id, options = {}) => {
      const currentNotes = notesRef.current;
      const target = currentNotes.find((note) => note.id === id);
      if (!target) return;

      selectNote(id, options);

      const highestZ = currentNotes.reduce((max, note) => Math.max(max, note.zIndex ?? 1), 1);
      if ((target.zIndex ?? 1) >= highestZ) {
        return;
      }

      const nextZ = highestZ + 1;
      maxZIndexRef.current = nextZ;
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
    },
    [maxZIndexRef, notesRef, selectNote, service, setNotes]
  );

  const moveNote = useCallback(
    (id, dx, dy) => {
      const board = boardRef.current;
      if (!board) return;
      const zoom = zoomRef.current || 1;
      const currentNotes = notesRef.current;
      const selected = selectedIdsRef.current;
      const movingIds = selected.includes(id) ? selected : [id];

      const canvasWidth = Math.max(board.scrollWidth / zoom, board.clientWidth / zoom + 500);
      const canvasHeight = Math.max(board.scrollHeight / zoom, board.clientHeight / zoom + 320);

      const nextById = new Map();
      movingIds.forEach((movingId) => {
        const target = currentNotes.find((note) => note.id === movingId);
        if (!target) return;

        const maxX = canvasWidth - target.width;
        const maxY = canvasHeight - target.height;
        const nextX = clamp(target.x + dx, 0, Math.max(maxX, 0));
        const nextY = clamp(target.y + dy, 0, Math.max(maxY, 0));

        const existingPending = pendingPositionRef.current.get(movingId);
        const previousPosition = existingPending
          ? existingPending.previous
          : { x: target.x, y: target.y };

        pendingPositionRef.current.set(movingId, {
          next: { x: nextX, y: nextY },
          previous: previousPosition
        });
        nextById.set(movingId, { x: nextX, y: nextY });
      });

      setNotes((prev) =>
        prev.map((note) =>
          nextById.has(note.id) ? { ...note, ...nextById.get(note.id) } : note
        )
      );
    },
    [boardRef, notesRef, setNotes, zoomRef]
  );

  const commitNotePosition = useCallback(
    async (id) => {
      const selected = selectedIdsRef.current;
      const pendingKeys = Array.from(pendingPositionRef.current.keys());
      const targetIds =
        selected.includes(id) && selected.length > 1
          ? pendingKeys.filter((pendingId) => selected.includes(pendingId))
          : [id];

      const toCommit = targetIds
        .map((noteId) => [noteId, pendingPositionRef.current.get(noteId)])
        .filter(([, pending]) => Boolean(pending));

      if (toCommit.length === 0) return;

      toCommit.forEach(([noteId]) => pendingPositionRef.current.delete(noteId));

      try {
        await Promise.all(
          toCommit.map(([noteId, pending]) => updateNote(noteId, pending.next, false))
        );
      } catch {
        const rollbackById = new Map(
          toCommit.map(([noteId, pending]) => [noteId, pending.previous])
        );
        setNotes((prev) =>
          prev.map((note) =>
            rollbackById.has(note.id)
              ? { ...note, ...rollbackById.get(note.id) }
              : note
          )
        );
        throw new Error("Note position update failed");
      }
    },
    [setNotes, updateNote]
  );

  const queueNoteResize = useCallback(
    (id, size) => {
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
    },
    [notesRef, setNotes]
  );

  return {
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    clearSelection,
    selectNote,
    bringNoteToFront,
    moveNote,
    commitNotePosition,
    queueNoteResize,
    clearInteractionQueues
  };
};
