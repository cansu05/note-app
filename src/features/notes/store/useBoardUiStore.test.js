import { beforeEach, describe, expect, it } from "vitest";
import { useBoardUiStore } from "./useBoardUiStore";

const initialState = useBoardUiStore.getInitialState();

describe("useBoardUiStore", () => {
  beforeEach(() => {
    useBoardUiStore.setState(initialState, true);
  });

  it("toggles sidebar and shortcuts visibility", () => {
    useBoardUiStore.getState().toggleSidebar();
    expect(useBoardUiStore.getState().isSidebarHidden).toBe(true);

    useBoardUiStore.getState().openShortcuts();
    expect(useBoardUiStore.getState().isShortcutsOpen).toBe(true);

    useBoardUiStore.getState().closeShortcuts();
    expect(useBoardUiStore.getState().isShortcutsOpen).toBe(false);
  });

  it("manages selection and clipboard consistently", () => {
    useBoardUiStore.getState().setSelectedId("n1");
    useBoardUiStore.getState().setSelectedIds(["n1", "n2"]);
    useBoardUiStore.getState().setClipboardIds(["n1", "n2"]);

    expect(useBoardUiStore.getState().selectedId).toBe("n1");
    expect(useBoardUiStore.getState().selectedIds).toEqual(["n1", "n2"]);
    expect(useBoardUiStore.getState().clipboardIds).toEqual(["n1", "n2"]);

    useBoardUiStore.getState().clearSelectedIds();
    expect(useBoardUiStore.getState().selectedId).toBeNull();
    expect(useBoardUiStore.getState().selectedIds).toEqual([]);
  });

  it("supports updater functions for selected and clipboard ids", () => {
    useBoardUiStore.getState().setSelectedId("n1");
    useBoardUiStore.getState().setSelectedId((previous) => (previous === "n1" ? "n2" : previous));

    useBoardUiStore.getState().setSelectedIds(["n1"]);
    useBoardUiStore.getState().setSelectedIds((previous) => [...previous, "n2"]);

    useBoardUiStore.getState().setClipboardIds(["n1"]);
    useBoardUiStore.getState().setClipboardIds((previous) => [...previous, "n2"]);

    expect(useBoardUiStore.getState().selectedId).toBe("n2");
    expect(useBoardUiStore.getState().selectedIds).toEqual(["n1", "n2"]);
    expect(useBoardUiStore.getState().clipboardIds).toEqual(["n1", "n2"]);
  });
});
