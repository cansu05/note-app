import { get, ref, remove, set, update } from "firebase/database";
import { db } from "../lib/firebase";
import { NoteRepository } from "./NoteRepository";

const NOTES_PATH = "notes";

const toList = (snapshotValue) => {
  if (!snapshotValue || typeof snapshotValue !== "object") {
    return [];
  }

  return Object.values(snapshotValue);
};

export class FirebaseNoteRepository extends NoteRepository {
  async list() {
    const snapshot = await get(ref(db, NOTES_PATH));
    return toList(snapshot.val());
  }

  async create(note) {
    await set(ref(db, `${NOTES_PATH}/${note.id}`), note);
    return note;
  }

  async update(id, changes) {
    const payload = { ...changes, updatedAt: new Date().toISOString() };
    await update(ref(db, `${NOTES_PATH}/${id}`), payload);
    return { id, ...payload };
  }

  async remove(id) {
    await remove(ref(db, `${NOTES_PATH}/${id}`));
  }
}
