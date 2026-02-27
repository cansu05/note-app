import { beforeEach, describe, expect, it } from "vitest";
import { NOTE_COLORS } from "../../../domain/note";
import { useBoardDataStore } from "./useBoardDataStore";

const initialState = useBoardDataStore.getInitialState();

describe("useBoardDataStore", () => {
  beforeEach(() => {
    useBoardDataStore.setState(initialState, true);
  });

  it("starts with default active color", () => {
    expect(useBoardDataStore.getState().activeColor).toBe(NOTE_COLORS[0]);
  });

  it("supports updater functions for notes and pages", () => {
    useBoardDataStore.getState().setNotes([{ id: "n1" }]);
    useBoardDataStore.getState().setNotes((prev) => [...prev, { id: "n2" }]);

    useBoardDataStore.getState().setPages([{ id: "p1" }]);
    useBoardDataStore.getState().setPages((prev) => [...prev, { id: "p2" }]);

    expect(useBoardDataStore.getState().notes).toEqual([{ id: "n1" }, { id: "n2" }]);
    expect(useBoardDataStore.getState().pages).toEqual([{ id: "p1" }, { id: "p2" }]);
  });
});
