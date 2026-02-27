import { get, ref, remove, set, update } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { NoteRepository } from "./NoteRepository";

const userNotesPath = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("User not authenticated");
  }
  return `users/${uid}/notes`;
};

const toList = (snapshotValue) => {
  if (!snapshotValue || typeof snapshotValue !== "object") {
    return [];
  }

  return Object.values(snapshotValue);
};

export class FirebaseNoteRepository extends NoteRepository {
  async list() {
    const notesPath = userNotesPath();
    const snapshot = await get(ref(db, notesPath));
    return toList(snapshot.val());
  }

  async create(note) {
    const notesPath = userNotesPath();
    await set(ref(db, `${notesPath}/${note.id}`), note);
    return note;
  }

  async update(id, changes) {
    const notesPath = userNotesPath();
    const payload = { ...changes, updatedAt: new Date().toISOString() };
    await update(ref(db, `${notesPath}/${id}`), payload);
    return { id, ...payload };
  }

  async remove(id) {
    const notesPath = userNotesPath();
    await remove(ref(db, `${notesPath}/${id}`));
  }
}
