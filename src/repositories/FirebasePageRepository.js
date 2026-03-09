import { get, ref, remove, set, update } from "firebase/database";
import { auth } from "../lib/firebaseAuth";
import { db } from "../lib/firebaseDb";

const userPagesPath = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("User not authenticated");
  }
  return `users/${uid}/pages`;
};

const toList = (snapshotValue) => {
  if (!snapshotValue || typeof snapshotValue !== "object") {
    return [];
  }

  return Object.values(snapshotValue);
};

export class FirebasePageRepository {
  async list() {
    const pagesPath = userPagesPath();
    const snapshot = await get(ref(db, pagesPath));
    return toList(snapshot.val());
  }

  async create(page) {
    const pagesPath = userPagesPath();
    await set(ref(db, `${pagesPath}/${page.id}`), page);
    return page;
  }

  async update(id, changes) {
    const pagesPath = userPagesPath();
    const payload = { ...changes, updatedAt: new Date().toISOString() };
    await update(ref(db, `${pagesPath}/${id}`), payload);
    return payload;
  }

  async updateMany(changesById) {
    const pagesPath = userPagesPath();
    const now = new Date().toISOString();
    const payload = Object.fromEntries(
      Object.entries(changesById).map(([id, changes]) => [id, { ...changes, updatedAt: now }])
    );
    await update(ref(db, pagesPath), payload);
  }

  async remove(id) {
    const pagesPath = userPagesPath();
    await remove(ref(db, `${pagesPath}/${id}`));
  }
}
