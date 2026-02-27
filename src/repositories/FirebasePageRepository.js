import { get, ref, remove, set } from "firebase/database";
import { db } from "../lib/firebase";

const PAGES_PATH = "pages";

const toList = (snapshotValue) => {
  if (!snapshotValue || typeof snapshotValue !== "object") {
    return [];
  }

  return Object.values(snapshotValue);
};

export class FirebasePageRepository {
  async list() {
    const snapshot = await get(ref(db, PAGES_PATH));
    return toList(snapshot.val());
  }

  async create(page) {
    await set(ref(db, `${PAGES_PATH}/${page.id}`), page);
    return page;
  }

  async update(id, changes) {
    const current = await get(ref(db, `${PAGES_PATH}/${id}`));
    const currentValue = current.val() || {};
    const payload = { ...currentValue, ...changes, updatedAt: new Date().toISOString() };
    await set(ref(db, `${PAGES_PATH}/${id}`), payload);
    return payload;
  }

  async remove(id) {
    await remove(ref(db, `${PAGES_PATH}/${id}`));
  }
}
