import { get, ref, remove, set } from "firebase/database";
import { auth, db } from "../lib/firebase";

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
    const current = await get(ref(db, `${pagesPath}/${id}`));
    const currentValue = current.val() || {};
    const payload = { ...currentValue, ...changes, updatedAt: new Date().toISOString() };
    await set(ref(db, `${pagesPath}/${id}`), payload);
    return payload;
  }

  async remove(id) {
    const pagesPath = userPagesPath();
    await remove(ref(db, `${pagesPath}/${id}`));
  }
}
