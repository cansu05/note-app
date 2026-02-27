import { useCallback, useEffect, useMemo, useRef } from "react";
import { NOTE_COLORS } from "../../../domain/note";
import { auth } from "../../../lib/firebase";
import { FirebasePageRepository } from "../../../repositories/FirebasePageRepository";
import { FirebaseNoteRepository } from "../../../repositories/FirebaseNoteRepository";
import { createNoteService } from "../../../services/noteService";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from "../constants";
import { useBoardDataStore } from "../store/useBoardDataStore";
import { useBoardUiStore } from "../store/useBoardUiStore";
import {
  collectDescendantPageIds,
  createPage,
  getMergedRemoteWithLegacy,
  MODEL_NOTE_WIDTH,
  movePageInTree,
  normalizeNoteDimensions,
  normalizePages
} from "./notesBoardHelpers";

const syncMissingPages = async (pageRepository, remotePages, mergedPages) => {
  if (mergedPages.length === remotePages.length) return;

  const remotePageIds = new Set(remotePages.map((page) => page.id));
  const missingPages = mergedPages.filter((page) => !remotePageIds.has(page.id));
  await Promise.all(missingPages.map((page) => pageRepository.create(page)));
};

const syncMissingNotes = async (service, remoteNotes, mergedNotes) => {
  if (mergedNotes.length === remoteNotes.length) return;

  const remoteNoteIds = new Set(remoteNotes.map((note) => note.id));
  const missingNotes = mergedNotes.filter((note) => !remoteNoteIds.has(note.id));
  await Promise.all(missingNotes.map((note) => service.addNote(note)));
};

const ensureInitialPages = async (pageRepository, mergedPages) => {
  if (mergedPages.length > 0) {
    return normalizePages(mergedPages);
  }

  const fallback = createPage(1);
  await pageRepository.create(fallback);
  return normalizePages([fallback]);
};

const ensureNotesHavePage = async (service, notes, fallbackPageId) => {
  const notesWithoutPage = notes.filter((note) => !note.pageId);
  if (notesWithoutPage.length === 0) return;

  await Promise.all(
    notesWithoutPage.map((note) => service.updateNote(note.id, { pageId: fallbackPageId }))
  );
};

const normalizeBoardNotes = (notes, fallbackPageId) =>
  notes.map((note) =>
    normalizeNoteDimensions({
      ...note,
      pageId: note.pageId || fallbackPageId
    })
  );

export const useBoardData = ({ boardRef, zoomRef, maxZIndexRef }) => {
  const service = useMemo(() => {
    const repository = new FirebaseNoteRepository();
    return createNoteService({ repository });
  }, []);
  const pageRepository = useMemo(() => new FirebasePageRepository(), []);

  const notes = useBoardDataStore((state) => state.notes);
  const pages = useBoardDataStore((state) => state.pages);
  const activePageId = useBoardDataStore((state) => state.activePageId);
  const activeColor = useBoardDataStore((state) => state.activeColor) ?? NOTE_COLORS[0];
  const setNotes = useBoardDataStore((state) => state.setNotes);
  const setPages = useBoardDataStore((state) => state.setPages);
  const setActivePageId = useBoardDataStore((state) => state.setActivePageId);
  const setActiveColor = useBoardDataStore((state) => state.setActiveColor);
  const selectedId = useBoardUiStore((state) => state.selectedId);
  const setSelectedId = useBoardUiStore((state) => state.setSelectedId);
  const clearSelectedIds = useBoardUiStore((state) => state.clearSelectedIds);

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

        await syncMissingPages(pageRepository, remotePages, merged.pages);
        await syncMissingNotes(service, remoteNotes, merged.notes);

        const normalizedPages = await ensureInitialPages(pageRepository, merged.pages);
        if (cancelled) return;
        setPages(normalizedPages);
        setActivePageId(normalizedPages[0].id);

        const data = merged.notes.length > 0 ? merged.notes : await service.listNotes();
        if (cancelled) return;

        await ensureNotesHavePage(service, data, normalizedPages[0].id);
        if (cancelled) return;

        const normalizedNotes = normalizeBoardNotes(data, normalizedPages[0].id);

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
  }, [maxZIndexRef, pageRepository, service, setActivePageId, setNotes, setPages]);

  const createNewPage = useCallback(async (name, parentId = null) => {
    const safeName = (name || "").trim();
    const siblingCount = pagesRef.current.filter((page) => page.parentId === parentId).length;
    const next = {
      ...createPage(pagesRef.current.length + 1, parentId),
      name: safeName || `Sayfa ${pagesRef.current.length + 1}`,
      sortOrder: siblingCount + 1
    };

    await pageRepository.create(next);
    setPages((prev) => normalizePages([...prev, next]));
    setActivePageId(next.id);
  }, [pageRepository, setActivePageId, setPages]);

  const renamePage = useCallback(async (id, nextName) => {
    const safeName = (nextName || "").trim();
    if (!safeName) return;

    const previous = pagesRef.current;
    const updated = previous.map((page) =>
      page.id === id
        ? { ...page, name: safeName, updatedAt: new Date().toISOString() }
        : page
    );

    setPages(normalizePages(updated));
    try {
      await pageRepository.update(id, { name: safeName });
    } catch {
      setPages(previous);
      throw new Error("Page rename failed");
    }
  }, [pageRepository, setPages]);

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

    setPages(normalizePages(remainingPages));
    if (activePageId && pageIdsToDelete.has(activePageId)) {
      setActivePageId(remainingPages[0].id);
      setSelectedId(null);
    }
  }, [activePageId, pageRepository, service, setActivePageId, setNotes, setPages, setSelectedId]);

  const movePage = useCallback(async (sourceId, targetId, position = "inside") => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const previous = pagesRef.current;
    const { nextPages, changesById } = movePageInTree(previous, sourceId, targetId, position);
    if (Object.keys(changesById).length === 0) return;

    setPages(nextPages);
    try {
      await pageRepository.updateMany(changesById);
    } catch {
      setPages(previous);
      throw new Error("Page move failed");
    }
  }, [pageRepository, setPages]);

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
  }, [activeColor, activePageId, boardRef, maxZIndexRef, service, setNotes, setSelectedId, zoomRef]);

  const duplicateNotes = useCallback(async (noteIds, offset = { x: 36, y: 36 }) => {
    if (!Array.isArray(noteIds) || noteIds.length === 0) return [];

    const selectedIds = new Set(noteIds);
    const sourceNotes = notesRef.current.filter((note) => selectedIds.has(note.id));
    if (sourceNotes.length === 0) return [];

    const baseZIndex = maxZIndexRef.current;
    const payloads = sourceNotes.map((source, index) => ({
      color: source.color,
      x: Math.max(0, (source.x ?? 0) + offset.x),
      y: Math.max(0, (source.y ?? 0) + offset.y),
      pageId: source.pageId || activePageId,
      kind: source.kind || "note",
      title: source.kind === "model" ? "" : source.title || "Yeni Not",
      width: source.width,
      height: source.height,
      zIndex: baseZIndex + index + 1,
      content: source.content || "",
      isNew: false
    }));

    const created = await Promise.all(
      payloads.map((payload) => service.addNote(payload))
    );
    created.forEach((next) => {
      maxZIndexRef.current = Math.max(maxZIndexRef.current, next.zIndex ?? 1);
    });

    setNotes((prev) => [...created, ...prev]);
    return created;
  }, [activePageId, maxZIndexRef, service, setNotes]);

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
  }, [selectedId, service, setNotes, setSelectedId]);

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
  }, [service, setNotes]);

  const selectPage = useCallback((id) => {
    setActivePageId(id);
    clearSelectedIds();
  }, [clearSelectedIds, setActivePageId]);

  return {
    notes,
    pages,
    activePageId,
    activeColor,
    setActiveColor,
    notesRef,
    pagesRef,
    setNotes,
    selectPage,
    createNewPage,
    renamePage,
    deletePage,
    movePage,
    createNote,
    duplicateNotes,
    removeNote,
    updateNote,
    service
  };
};
