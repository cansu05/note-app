import { useEffect, useMemo, useRef } from "react";
import { NOTE_COLORS } from "../../../domain/note";
import { useBoardUiStore } from "../store/useBoardUiStore";
import { useBoardData } from "./useBoardData";
import { useBoardInteractions } from "./useBoardInteractions";

export const useNotesBoard = () => {
  const boardRef = useRef(null);
  const zoomRef = useRef(1);
  const maxZIndexRef = useRef(1);
  const zoomLevel = useBoardUiStore((state) => state.zoomLevel);
  const setZoomLevel = useBoardUiStore((state) => state.setZoomLevel);

  const data = useBoardData({ boardRef, zoomRef, maxZIndexRef });
  const interactions = useBoardInteractions({
    boardRef,
    zoomRef,
    notesRef: data.notesRef,
    setNotes: data.setNotes,
    updateNote: data.updateNote,
    service: data.service,
    maxZIndexRef
  });

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  const activeNotes = useMemo(
    () =>
      data.activePageId
        ? data.notes.filter((note) => note.pageId === data.activePageId)
        : [],
    [data.activePageId, data.notes]
  );

  return {
    notes: activeNotes,
    pages: data.pages,
    activePageId: data.activePageId,
    selectPage: data.selectPage,
    createNewPage: data.createNewPage,
    renamePage: data.renamePage,
    deletePage: data.deletePage,
    movePage: data.movePage,
    colors: NOTE_COLORS,
    activeColor: data.activeColor,
    setActiveColor: data.setActiveColor,
    selectedId: interactions.selectedId,
    selectedIds: interactions.selectedIds,
    setSelectedIds: interactions.setSelectedIds,
    setSelectedId: interactions.setSelectedId,
    clearSelection: interactions.clearSelection,
    selectNote: interactions.selectNote,
    zoomLevel,
    setZoomLevel,
    bringNoteToFront: interactions.bringNoteToFront,
    boardRef,
    createNote: data.createNote,
    duplicateNotes: data.duplicateNotes,
    removeNote: data.removeNote,
    updateNote: data.updateNote,
    moveNote: interactions.moveNote,
    commitNotePosition: interactions.commitNotePosition,
    queueNoteResize: interactions.queueNoteResize,
    selectionRect: interactions.selectionRect,
    startMarqueeSelection: interactions.startMarqueeSelection,
    updateMarqueeSelection: interactions.updateMarqueeSelection,
    endMarqueeSelection: interactions.endMarqueeSelection,
    cancelMarqueeSelection: interactions.cancelMarqueeSelection
  };
};
