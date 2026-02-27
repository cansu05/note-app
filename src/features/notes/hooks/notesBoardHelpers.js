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
const LEGACY_OWNER_UID_KEY = "note_app_legacy_owner_uid";

export const MODEL_NOTE_WIDTH = 380;

export const createPage = (index = 1, parentId = null) => ({
  id: crypto.randomUUID(),
  name: `Sayfa ${index}`,
  parentId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const normalizePages = (pages) =>
  pages.map((page) => ({
    ...page,
    parentId: page.parentId ?? null
  }));

export const collectDescendantPageIds = (allPages, rootId) => {
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

export const normalizeNoteDimensions = (note) => ({
  ...note,
  width:
    note.kind === "model"
      ? Math.max(320, note.width ?? MODEL_NOTE_WIDTH)
      : clamp(note.width ?? DEFAULT_NOTE_WIDTH, MIN_NOTE_WIDTH, MAX_NOTE_WIDTH),
  height: Math.max(note.height ?? DEFAULT_NOTE_HEIGHT, MIN_NOTE_HEIGHT),
  zIndex: Number.isFinite(note.zIndex) ? note.zIndex : 1
});

const safeParseArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadLegacyLocalData = () => {
  if (typeof window === "undefined") {
    return { notes: [], pages: [] };
  }

  const legacyNotes = safeParseArray(localStorage.getItem(LEGACY_NOTES_STORAGE_KEY));
  const legacyPages = safeParseArray(localStorage.getItem(LEGACY_PAGES_STORAGE_KEY));
  return { notes: legacyNotes, pages: legacyPages };
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

export const getMergedRemoteWithLegacy = ({ uid, remotePages, remoteNotes }) => {
  if (typeof window === "undefined" || !uid) {
    return { pages: remotePages, notes: remoteNotes };
  }

  const legacy = loadLegacyLocalData();
  const hasLegacyData = legacy.notes.length > 0 || legacy.pages.length > 0;
  if (!hasLegacyData) {
    return { pages: remotePages, notes: remoteNotes };
  }

  const ownerUid = localStorage.getItem(LEGACY_OWNER_UID_KEY);
  if (!ownerUid) {
    localStorage.setItem(LEGACY_OWNER_UID_KEY, uid);
  }

  if (ownerUid && ownerUid !== uid) {
    return { pages: remotePages, notes: remoteNotes };
  }

  return {
    pages: mergeById(remotePages, legacy.pages.filter((page) => page?.id)),
    notes: mergeById(remoteNotes, legacy.notes.filter((note) => note?.id))
  };
};
