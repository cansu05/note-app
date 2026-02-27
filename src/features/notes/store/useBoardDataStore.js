import { create } from "zustand";
import { NOTE_COLORS } from "../../../domain/note";

const resolveUpdater = (updater, previous) =>
  typeof updater === "function" ? updater(previous) : updater;

export const useBoardDataStore = create((set) => ({
  notes: [],
  pages: [],
  activePageId: null,
  activeColor: NOTE_COLORS[0],
  setNotes: (updater) => set((state) => ({ notes: resolveUpdater(updater, state.notes) })),
  setPages: (updater) => set((state) => ({ pages: resolveUpdater(updater, state.pages) })),
  setActivePageId: (activePageId) => set({ activePageId }),
  setActiveColor: (activeColor) => set({ activeColor })
}));
