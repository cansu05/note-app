import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NOTE_COLORS } from "../../../domain/note";
import { auth } from "../../../lib/firebase";
import { FirebasePageRepository } from "../../../repositories/FirebasePageRepository";
import { FirebaseNoteRepository } from "../../../repositories/FirebaseNoteRepository";
import { createNoteService } from "../../../services/noteService";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from "../constants";
import {
  collectDescendantPageIds,
  createPage,
  getMergedRemoteWithLegacy,
  MODEL_NOTE_WIDTH,
  normalizeNoteDimensions,
  normalizePages
} from "./notesBoardHelpers";

export const useBoardData = ({ boardRef, zoomRef, maxZIndexRef }) => {
  const service = useMemo(() => {
    const repository = new FirebaseNoteRepository();
    return createNoteService({ repository });
  }, []);
  const pageRepository = useMemo(() => new FirebasePageRepository(), []);

  const [notes, setNotes] = useState([]);
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [activeColor, setActiveColor] = useState(NOTE_COLORS[0]);
  const [selectedId, setSelectedId] = useState(null);

  const notesRef = useRef([]);
  const pagesRef = useRef([]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const remotePages = await pageRepository.list();
        const remoteNotes = await service.listNotes();
        const merged = getMergedRemoteWithLegacy({
          uid: auth.currentUser?.uid,
          remotePages,
          remoteNotes
        });

        if (merged.pages.length !== remotePages.length) {
          const remotePageIds = new Set(remotePages.map((page) => page.id));
          const missingPages = merged.pages.filter((page) => !remotePageIds.has(page.id));
          await Promise.all(missingPages.map((page) => pageRepository.create(page)));
        }

        if (merged.notes.length !== remoteNotes.length) {
          const remoteNoteIds = new Set(remoteNotes.map((note) => note.id));
          const missingNotes = merged.notes.filter((note) => !remoteNoteIds.has(note.id));
          await Promise.all(missingNotes.map((note) => service.addNote(note)));
        }

        const savedPages = merged.pages.length > 0 ? merged.pages : [createPage(1)];
        if (merged.pages.length === 0) {
          await pageRepository.create(savedPages[0]);
        }

        const normalizedPages = normalizePages(savedPages);
        if (cancelled) return;
        setPages(normalizedPages);
        setActivePageId(normalizedPages[0].id);

        const data = merged.notes.length > 0 ? merged.notes : await service.listNotes();
        if (cancelled) return;

        const notesWithoutPage = data.filter((n) => !n.pageId);
        if (notesWithoutPage.length > 0) {
          await Promise.all(
            notesWithoutPage.map((n) =>
              service.updateNote(n.id, { pageId: normalizedPages[0].id })
            )
          );
        }
        if (cancelled) return;

        const normalizedNotes = data.map((note) =>
          normalizeNoteDimensions({
            ...note,
            pageId: note.pageId || normalizedPages[0].id
          })
        );

        maxZIndexRef.current = normalizedNotes.reduce(
          (max, note) => Math.max(max, note.zIndex ?? 1),
          1
        );
        setNotes(normalizedNotes);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load notes board data", error);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [maxZIndexRef, pageRepository, service]);

  const createNewPage = useCallback(async (name, parentId = null) => {
    const safeName = (name || "").trim();
    const next = {
      ...createPage(pagesRef.current.length + 1, parentId),
      name: safeName || `Sayfa ${pagesRef.current.length + 1}`
    };

    await pageRepository.create(next);
    setPages((prev) => [...prev, next]);
    setActivePageId(next.id);
  }, [pageRepository]);

  const renamePage = useCallback(async (id, nextName) => {
    const safeName = (nextName || "").trim();
    if (!safeName) return;

    const previous = pagesRef.current;
    const updated = previous.map((page) =>
      page.id === id
        ? { ...page, name: safeName, updatedAt: new Date().toISOString() }
        : page
    );

    setPages(updated);
    try {
      await pageRepository.update(id, { name: safeName });
    } catch {
      setPages(previous);
      throw new Error("Page rename failed");
    }
  }, [pageRepository]);

  const deletePage = useCallback(async (id) => {
    const pageIdsToDelete = collectDescendantPageIds(pagesRef.current, id);
    const targetNotes = notesRef.current.filter((note) => pageIdsToDelete.has(note.pageId));

    if (targetNotes.length > 0) {
      await Promise.all(targetNotes.map((note) => service.deleteNote(note.id)));
      setNotes((prev) => prev.filter((note) => !pageIdsToDelete.has(note.pageId)));
    }

    await Promise.all(Array.from(pageIdsToDelete).map((pageId) => pageRepository.remove(pageId)));

    const remainingPages = pagesRef.current.filter((page) => !pageIdsToDelete.has(page.id));
    if (remainingPages.length === 0) {
      const fallback = createPage(1);
      await pageRepository.create(fallback);
      setPages([fallback]);
      setActivePageId(fallback.id);
      setSelectedId(null);
      return;
    }

    setPages(remainingPages);
    if (activePageId && pageIdsToDelete.has(activePageId)) {
      setActivePageId(remainingPages[0].id);
      setSelectedId(null);
    }
  }, [activePageId, pageRepository, service]);

  const createNote = useCallback(async ({ kind = "note" } = {}) => {
    if (!activePageId) return;
    const isModel = kind === "model";
    const targetWidth = isModel ? MODEL_NOTE_WIDTH : DEFAULT_NOTE_WIDTH;
    const zoom = zoomRef.current || 1;
    const board = boardRef.current;

    const centeredX = board
      ? Math.max(
          0,
          Math.round(board.scrollLeft / zoom + (board.clientWidth / zoom - targetWidth) / 2)
        )
      : 30;
    const centeredY = board
      ? Math.max(
          0,
          Math.round(
            board.scrollTop / zoom + (board.clientHeight / zoom - DEFAULT_NOTE_HEIGHT) / 2
          )
        )
      : 30;

    const note = await service.addNote({
      color: activeColor,
      x: centeredX,
      y: centeredY,
      isNew: true,
      pageId: activePageId,
      kind,
      title: isModel ? "" : "Yeni Not",
      width: targetWidth,
      zIndex: maxZIndexRef.current + 1,
      content: ""
    });

    maxZIndexRef.current = Math.max(maxZIndexRef.current, note.zIndex ?? 1);
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  }, [activeColor, activePageId, boardRef, maxZIndexRef, service, zoomRef]);

  const removeNote = useCallback(async (id) => {
    const previous = notesRef.current;
    const previousSelected = selectedId;

    setNotes((prev) => prev.filter((note) => note.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));

    try {
      await service.deleteNote(id);
    } catch {
      setNotes(previous);
      setSelectedId(previousSelected);
      throw new Error("Note delete failed");
    }
  }, [selectedId, service]);

  const updateNote = useCallback(async (id, changes, optimistic = true, persist = true) => {
    const previous = notesRef.current;
    if (optimistic) {
      setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, ...changes } : note)));
    }

    try {
      if (persist) {
        await service.updateNote(id, changes);
      }
    } catch {
      if (optimistic) {
        setNotes(previous);
      }
      throw new Error("Note update failed");
    }
  }, [service]);

  const selectPage = useCallback((id) => {
    setActivePageId(id);
    setSelectedId(null);
  }, []);

  return {
    notes,
    pages,
    activePageId,
    activeColor,
    setActiveColor,
    selectedId,
    setSelectedId,
    notesRef,
    pagesRef,
    setNotes,
    selectPage,
    createNewPage,
    renamePage,
    deletePage,
    createNote,
    removeNote,
    updateNote,
    service
  };
};
