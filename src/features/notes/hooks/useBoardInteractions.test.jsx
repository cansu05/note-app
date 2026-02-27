import React, { act } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBoardUiStore } from "../store/useBoardUiStore";
import { useBoardInteractions } from "./useBoardInteractions";

const initialUiState = useBoardUiStore.getInitialState();

const useHarness = ({ initialNotes, updateNoteImpl } = {}) => {
  const startingNotes = initialNotes ?? [
    { id: "n1", x: 10, y: 10, width: 120, height: 80, zIndex: 1 },
    { id: "n2", x: 80, y: 20, width: 120, height: 80, zIndex: 2 }
  ];

  const [notes, setNotesState] = React.useState(startingNotes);
  const notesRef = React.useRef(notes);
  React.useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const setNotes = React.useCallback((updater) => {
    setNotesState((previous) =>
      typeof updater === "function" ? updater(previous) : updater
    );
  }, []);

  const boardRef = React.useRef({
    scrollWidth: 1600,
    clientWidth: 1200,
    scrollHeight: 900,
    clientHeight: 700
  });
  const zoomRef = React.useRef(1);
  const maxZIndexRef = React.useRef(2);
  const updateNote = vi.fn(updateNoteImpl ?? (() => Promise.resolve()));
  const service = { updateNote: vi.fn().mockResolvedValue(undefined) };

  const interactions = useBoardInteractions({
    boardRef,
    zoomRef,
    notesRef,
    setNotes,
    updateNote,
    service,
    maxZIndexRef
  });

  return { notes, updateNote, ...interactions };
};

describe("useBoardInteractions", () => {
  beforeEach(() => {
    useBoardUiStore.setState(initialUiState, true);
    vi.restoreAllMocks();
  });

  it("supports additive multi-select toggle", () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.selectNote("n1");
    });
    expect(useBoardUiStore.getState().selectedId).toBe("n1");
    expect(useBoardUiStore.getState().selectedIds).toEqual(["n1"]);

    act(() => {
      result.current.selectNote("n2", { additive: true });
    });
    expect(useBoardUiStore.getState().selectedId).toBe("n2");
    expect(useBoardUiStore.getState().selectedIds).toEqual(["n1", "n2"]);

    act(() => {
      result.current.selectNote("n1", { additive: true });
    });
    expect(useBoardUiStore.getState().selectedId).toBe("n2");
    expect(useBoardUiStore.getState().selectedIds).toEqual(["n2"]);
  });

  it("rolls back grouped note positions when commit fails", async () => {
    const { result } = renderHook(() =>
      useHarness({
        updateNoteImpl: (id) =>
          id === "n2" ? Promise.reject(new Error("fail")) : Promise.resolve()
      })
    );

    const before = result.current.notes.map((note) => ({
      id: note.id,
      x: note.x,
      y: note.y
    }));

    act(() => {
      result.current.setSelectedIds(["n1", "n2"]);
      result.current.setSelectedId("n1");
    });

    await waitFor(() => {
      expect(result.current.selectedIds).toEqual(["n1", "n2"]);
    });

    act(() => {
      result.current.moveNote("n1", 24, 16);
    });

    await waitFor(() => {
      const moved = result.current.notes.find((note) => note.id === "n1");
      expect(moved.x).toBe(34);
      expect(moved.y).toBe(26);
    });

    let commitError = null;
    await act(async () => {
      try {
        await result.current.commitNotePosition("n1");
      } catch (error) {
        commitError = error;
      }
    });
    expect(commitError?.message).toBe("Note position update failed");

    await waitFor(() => {
      const after = result.current.notes.map((note) => ({
        id: note.id,
        x: note.x,
        y: note.y
      }));
      expect(after).toEqual(before);
    });
  });

  it("selects intersecting notes with marquee selection", async () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.startMarqueeSelection({ x: 0, y: 0 });
      result.current.updateMarqueeSelection({ x: 220, y: 120 });
    });

    await waitFor(() => {
      expect(useBoardUiStore.getState().selectedIds).toEqual(["n1", "n2"]);
      expect(result.current.selectionRect).toEqual({
        left: 0,
        top: 0,
        width: 220,
        height: 120
      });
    });

    act(() => {
      const { moved } = result.current.endMarqueeSelection();
      expect(moved).toBe(true);
    });

    expect(result.current.selectionRect).toBeNull();
  });
});
