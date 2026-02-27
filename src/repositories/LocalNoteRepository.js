import { NoteRepository } from "./NoteRepository";

const STORAGE_KEY = "note_app_notes";

export class StorageAccessError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageAccessError";
  }
}

const safeParse = (raw, fallback) => {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export class LocalNoteRepository extends NoteRepository {
  async list() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return safeParse(raw, []);
    } catch {
      throw new StorageAccessError("Unable to read from local storage");
    }
  }

  async create(note) {
    const notes = await this.list();
    const next = [note, ...notes];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new StorageAccessError("Unable to write note to local storage");
    }
    return note;
  }

  async update(id, changes) {
    const notes = await this.list();
    const next = notes.map((n) =>
      n.id === id
        ? { ...n, ...changes, updatedAt: new Date().toISOString() }
        : n
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new StorageAccessError("Unable to update note in local storage");
    }
    return next.find((n) => n.id === id);
  }

  async remove(id) {
    const notes = await this.list();
    const next = notes.filter((n) => n.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new StorageAccessError("Unable to remove note from local storage");
    }
  }
}
