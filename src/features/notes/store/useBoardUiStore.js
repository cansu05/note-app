import { create } from "zustand";

const resolveUpdater = (updater, previous) =>
  typeof updater === "function" ? updater(previous) : updater;

export const useBoardUiStore = create((set) => ({
  isSidebarHidden: false,
  isShortcutsOpen: false,
  zoomLevel: 1,
  selectedId: null,
  selectedIds: [],
  clipboardIds: [],
  toggleSidebar: () => set((state) => ({ isSidebarHidden: !state.isSidebarHidden })),
  setZoomLevel: (updater) =>
    set((state) => ({
      zoomLevel: typeof updater === "function" ? updater(state.zoomLevel) : updater
    })),
  openShortcuts: () => set({ isShortcutsOpen: true }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
  setSelectedId: (updater) =>
    set((state) => ({ selectedId: resolveUpdater(updater, state.selectedId) })),
  setSelectedIds: (updater) =>
    set((state) => ({ selectedIds: resolveUpdater(updater, state.selectedIds) })),
  clearSelectedIds: () => set({ selectedIds: [], selectedId: null }),
  setClipboardIds: (updater) =>
    set((state) => ({ clipboardIds: resolveUpdater(updater, state.clipboardIds) }))
}));
