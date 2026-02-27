import { createNewNote } from "../domain/note";

export class NoteService {
  constructor(repository) {
    this.repository = repository;
  }

  async listNotes() {
    return this.repository.list();
  }

  async addNote(payload) {
    const note = createNewNote(payload);
    return this.repository.create(note);
  }

  async updateNote(id, changes) {
    return this.repository.update(id, changes);
  }

  async deleteNote(id) {
    return this.repository.remove(id);
  }
}

export const createNoteService = ({ repository }) => {
  return new NoteService(repository);
};

// Firebase'e geçişte LocalNoteRepository yerine burada FirebaseNoteRepository verilecek.
