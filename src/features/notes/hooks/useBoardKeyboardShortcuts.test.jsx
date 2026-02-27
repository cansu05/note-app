import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOTES_UI_TEXT } from "../notesMessages";
import { useBoardKeyboardShortcuts } from "./useBoardKeyboardShortcuts";

const buildContext = (overrides = {}) => ({
  notes: [
    { id: "n1", title: "Note 1" },
    { id: "n2", title: "Note 2" }
  ],
  selectedId: null,
  selectedIds: [],
  clearSelection: vi.fn(),
  duplicateNotes: vi.fn().mockResolvedValue([]),
  removeNote: vi.fn().mockResolvedValue(undefined),
  openConfirm: vi.fn(),
  closeConfirm: vi.fn(),
  setSelectedIds: vi.fn(),
  setClipboardIds: vi.fn(),
  clipboardIds: [],
  setUiError: vi.fn(),
  ...overrides
});

const dispatchKey = (target, key, options = {}) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  target.dispatchEvent(event);
};

describe("useBoardKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("copies selected note ids with ctrl/cmd + c", () => {
    const context = buildContext({ selectedIds: ["n1", "n2"] });
    renderHook(() => useBoardKeyboardShortcuts(context));

    act(() => {
      dispatchKey(window, "c", { ctrlKey: true });
    });

    expect(context.setClipboardIds).toHaveBeenCalledWith(["n1", "n2"]);
  });

  it("pastes clipboard note ids with ctrl/cmd + v and selects duplicates", async () => {
    const context = buildContext({
      clipboardIds: ["n1", "n2"],
      duplicateNotes: vi.fn().mockResolvedValue([{ id: "n3" }, { id: "n4" }])
    });
    renderHook(() => useBoardKeyboardShortcuts(context));

    await act(async () => {
      dispatchKey(window, "v", { metaKey: true });
    });

    expect(context.duplicateNotes).toHaveBeenCalledWith(["n1", "n2"]);
    expect(context.setSelectedIds).toHaveBeenCalledWith(["n3", "n4"]);
    expect(context.setUiError).toHaveBeenCalledWith("");
  });

  it("opens delete confirm and removes all selected notes on confirm", async () => {
    const context = buildContext({ selectedIds: ["n1", "n2"] });
    renderHook(() => useBoardKeyboardShortcuts(context));

    act(() => {
      dispatchKey(window, "Delete");
    });

    expect(context.openConfirm).toHaveBeenCalledTimes(1);
    const payload = context.openConfirm.mock.calls[0][0];
    expect(payload.title).toBe(NOTES_UI_TEXT.deleteNoteTitle);
    expect(payload.confirmText).toBe(NOTES_UI_TEXT.deleteNoteConfirm);
    expect(payload.message).toContain("2 not");

    await act(async () => {
      await payload.onConfirm();
    });

    expect(context.removeNote).toHaveBeenNthCalledWith(1, "n1");
    expect(context.removeNote).toHaveBeenNthCalledWith(2, "n2");
    expect(context.clearSelection).toHaveBeenCalledTimes(1);
    expect(context.closeConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not trigger shortcuts while typing inside editable elements", () => {
    const context = buildContext({ selectedIds: ["n1"] });
    renderHook(() => useBoardKeyboardShortcuts(context));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    act(() => {
      dispatchKey(input, "c", { ctrlKey: true });
      dispatchKey(input, "Delete");
    });

    document.body.removeChild(input);

    expect(context.setClipboardIds).not.toHaveBeenCalled();
    expect(context.openConfirm).not.toHaveBeenCalled();
  });
});
