import { useEffect, useMemo, useRef, useState } from "react";
import { NOTE_COLORS } from "../../../domain/note";
import { useBoardData } from "./useBoardData";
import { useBoardInteractions } from "./useBoardInteractions";

export const useNotesBoard = () => {
  const boardRef = useRef(null);
  const zoomRef = useRef(1);
  const maxZIndexRef = useRef(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const data = useBoardData({ boardRef, zoomRef, maxZIndexRef });
  const interactions = useBoardInteractions({
    boardRef,
    zoomRef,
    notesRef: data.notesRef,
    setNotes: data.setNotes,
    selectedId: data.selectedId,
    setSelectedId: data.setSelectedId,
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
    colors: NOTE_COLORS,
    activeColor: data.activeColor,
    setActiveColor: data.setActiveColor,
    selectedId: interactions.selectedId,
    setSelectedId: interactions.setSelectedId,
    zoomLevel,
    setZoomLevel,
    bringNoteToFront: interactions.bringNoteToFront,
    boardRef,
    createNote: data.createNote,
    removeNote: data.removeNote,
    updateNote: data.updateNote,
    moveNote: interactions.moveNote,
    commitNotePosition: interactions.commitNotePosition,
    queueNoteResize: interactions.queueNoteResize
  };
};
