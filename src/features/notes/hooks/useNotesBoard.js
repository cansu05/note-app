import { useEffect, useMemo, useRef, useState } from "react";
import { NOTE_COLORS } from "../../../domain/note";
import { FirebasePageRepository } from "../../../repositories/FirebasePageRepository";
import { FirebaseNoteRepository } from "../../../repositories/FirebaseNoteRepository";
import { createNoteService } from "../../../services/noteService";
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  MAX_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH
} from "../constants";
import { clamp } from "../utils/noteSizing";

const LEGACY_NOTES_STORAGE_KEY = "note_app_notes";
const LEGACY_PAGES_STORAGE_KEY = "note_app_pages";

const createPage = (index = 1, parentId = null) => ({
  id: crypto.randomUUID(),
  name: `Sayfa ${index}`,
  parentId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const normalizePages = (pages) =>
  pages.map((page) => ({
    ...page,
    parentId: page.parentId ?? null
  }));

const collectDescendantPageIds = (allPages, rootId) => {
  const result = new Set([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = allPages.filter((page) => page.parentId === currentId);
    children.forEach((child) => {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    });
  }

  return result;
};

const normalizeNoteDimensions = (note) => ({
  ...note,
  width:
    note.kind === "model"
      ? Math.max(320, note.width ?? 380)
      : clamp(note.width ?? DEFAULT_NOTE_WIDTH, MIN_NOTE_WIDTH, MAX_NOTE_WIDTH),
  height: Math.max(note.height ?? DEFAULT_NOTE_HEIGHT, MIN_NOTE_HEIGHT),
  zIndex: Number.isFinite(note.zIndex) ? note.zIndex : 1
});

const MODEL_NOTE_WIDTH = 380;
const safeParseArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mergeById = (primary = [], incoming = []) => {
  const map = new Map(primary.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const loadLegacyLocalData = () => {
  if (typeof window === "undefined") {
    return { notes: [], pages: [] };
  }

  const legacyNotes = safeParseArray(localStorage.getItem(LEGACY_NOTES_STORAGE_KEY));
  const legacyPages = safeParseArray(localStorage.getItem(LEGACY_PAGES_STORAGE_KEY));
  return { notes: legacyNotes, pages: legacyPages };
};

export const useNotesBoard = () => {
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const boardRef = useRef(null);
  const notesRef = useRef([]);
  const pagesRef = useRef([]);
  const zoomRef = useRef(1);
  const pendingPositionRef = useRef(new Map());
  const pendingResizeRef = useRef(new Map());
  const resizeFrameRef = useRef(new Map());
  const maxZIndexRef = useRef(1);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    return () => {
      resizeFrameRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
      resizeFrameRef.current.clear();
      pendingResizeRef.current.clear();
      pendingPositionRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const remotePages = await pageRepository.list();
        const remoteNotes = await service.listNotes();
        const legacy = loadLegacyLocalData();

        const pagesToImport = legacy.pages.filter((page) => page?.id);
        const notesToImport = legacy.notes.filter((note) => note?.id);

        const mergedPages = mergeById(remotePages, pagesToImport);
        const mergedNotes = mergeById(remoteNotes, notesToImport);

        if (mergedPages.length !== remotePages.length) {
          const remotePageIds = new Set(remotePages.map((page) => page.id));
          const missingPages = mergedPages.filter((page) => !remotePageIds.has(page.id));
          await Promise.all(missingPages.map((page) => pageRepository.create(page)));
        }

        if (mergedNotes.length !== remoteNotes.length) {
          const remoteNoteIds = new Set(remoteNotes.map((note) => note.id));
          const missingNotes = mergedNotes.filter((note) => !remoteNoteIds.has(note.id));
          await Promise.all(missingNotes.map((note) => service.addNote(note)));
        }

        const savedPages = mergedPages.length > 0 ? mergedPages : [createPage(1)];
        if (mergedPages.length === 0) {
          await pageRepository.create(savedPages[0]);
        }

        const normalizedPages = normalizePages(savedPages);
        if (cancelled) return;
        setPages(normalizedPages);
        setActivePageId(normalizedPages[0].id);

        const data = mergedNotes.length > 0 ? mergedNotes : await service.listNotes();
        if (cancelled) return;

        const notesWithoutPage = data.filter((n) => !n.pageId);
        if (notesWithoutPage.length > 0) {
          await Promise.all(
            notesWithoutPage.map((n) =>
              service.updateNote(n.id, { pageId: normalizedPages[0].id })
            )
          );
          if (cancelled) return;

          const normalizedNotes = data.map((n) =>
            normalizeNoteDimensions({ ...n, pageId: n.pageId || normalizedPages[0].id })
          );
          maxZIndexRef.current = normalizedNotes.reduce(
            (max, note) => Math.max(max, note.zIndex ?? 1),
            1
          );
          setNotes(normalizedNotes);
        } else {
          const normalizedNotes = data.map(normalizeNoteDimensions);
          maxZIndexRef.current = normalizedNotes.reduce(
            (max, note) => Math.max(max, note.zIndex ?? 1),
            1
          );
          setNotes(normalizedNotes);
        }
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
  }, [pageRepository, service]);

  const createNewPage = async (name, parentId = null) => {
    const safeName = (name || "").trim();
    const nextId = crypto.randomUUID();
    const currentPages = pagesRef.current;
    const index = currentPages.length + 1;
    const next = {
      id: nextId,
      name: safeName || `Sayfa ${index}`,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await pageRepository.create(next);
    setPages([...currentPages, next]);
    setActivePageId(nextId);
  };

  const renamePage = async (id, nextName) => {
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
  };

  const deletePage = async (id) => {
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
  };

  const selectPage = (id) => {
    setActivePageId(id);
    setSelectedId(null);
  };

  const createNote = async ({ kind = "note" } = {}) => {
    if (!activePageId) return;
    const isModel = kind === "model";
    const targetWidth = isModel ? MODEL_NOTE_WIDTH : DEFAULT_NOTE_WIDTH;

    const board = boardRef.current;
    const zoom = zoomRef.current || 1;
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
  };

  const bringNoteToFront = (id) => {
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
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, zIndex: nextZ } : note))
    );

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
  };

  const removeNote = async (id) => {
    const previous = notesRef.current;
    const previousSelected = selectedId;

    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));

    try {
      await service.deleteNote(id);
    } catch {
      setNotes(previous);
      setSelectedId(previousSelected);
      throw new Error("Note delete failed");
    }
  };

  const updateNote = async (id, changes, optimistic = true, persist = true) => {
    const previous = notesRef.current;

    if (optimistic) {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...changes } : n))
      );
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
  };

  const moveNote = (id, dx, dy) => {
    const board = boardRef.current;
    if (!board) return;
    const zoom = zoomRef.current || 1;

    const target = notesRef.current.find((n) => n.id === id);
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

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x: nextX, y: nextY } : n))
    );
  };

  const commitNotePosition = async (id) => {
    const pending = pendingPositionRef.current.get(id);
    if (!pending) return;

    pendingPositionRef.current.delete(id);
    try {
      await updateNote(id, pending.next, false);
    } catch {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, x: pending.previous.x, y: pending.previous.y } : n
        )
      );
      throw new Error("Note position update failed");
    }
  };

  const queueNoteResize = (id, size) => {
    const existing = notesRef.current.find((n) => n.id === id);
    if (!existing) return;

    const nextWidth = size.width ?? existing.width;
    const nextHeight = size.height ?? existing.height;
    if (nextWidth === existing.width && nextHeight === existing.height) {
      return;
    }

    pendingResizeRef.current.set(id, { width: nextWidth, height: nextHeight });

    if (resizeFrameRef.current.has(id)) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      const pending = pendingResizeRef.current.get(id);
      pendingResizeRef.current.delete(id);
      resizeFrameRef.current.delete(id);
      if (!pending) return;

      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...pending } : n))
      );
    });

    resizeFrameRef.current.set(id, frameId);
  };

  const activeNotes = activePageId
    ? notes.filter((note) => note.pageId === activePageId)
    : [];

  return {
    notes: activeNotes,
    pages,
    activePageId,
    selectPage,
    createNewPage,
    renamePage,
    deletePage,
    colors: NOTE_COLORS,
    activeColor,
    setActiveColor,
    selectedId,
    setSelectedId,
    zoomLevel,
    setZoomLevel,
    bringNoteToFront,
    boardRef,
    createNote,
    removeNote,
    updateNote,
    moveNote,
    commitNotePosition,
    queueNoteResize
  };
};
