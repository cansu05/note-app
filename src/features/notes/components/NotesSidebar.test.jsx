import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesSidebar } from "./NotesSidebar";

const createDataTransfer = () => ({
  effectAllowed: "",
  dropEffect: "",
  setData: vi.fn()
});

const basePages = [
  { id: "a", name: "A", parentId: null, sortOrder: 1 },
  { id: "a1", name: "A-1", parentId: "a", sortOrder: 1 },
  { id: "b", name: "B", parentId: null, sortOrder: 2 }
];

const setup = (onMovePage = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <NotesSidebar
      pages={basePages}
      activePageId="a"
      selectPage={vi.fn()}
      onRequestCreatePage={vi.fn()}
      onRequestCreateSubPage={vi.fn()}
      onMovePage={onMovePage}
      isHidden={false}
      onToggleSidebar={vi.fn()}
    />
  );
  return { onMovePage };
};

describe("NotesSidebar DnD", () => {
  it("toggles subpages with arrow button", () => {
    setup();
    expect(screen.getByRole("button", { name: "A-1" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A alt sayfalari kapat"));
    expect(screen.queryByRole("button", { name: "A-1" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A alt sayfalari ac"));
    expect(screen.getByRole("button", { name: "A-1" })).toBeInTheDocument();
  });

  it("calls move with inside mode when dropping in middle", async () => {
    const { onMovePage } = setup();
    const source = screen.getByRole("button", { name: "A" });
    const target = screen.getByRole("button", { name: "B" });
    const row = target.closest(".page-row");
    expect(row).not.toBeNull();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(source, { dataTransfer });
    row.getBoundingClientRect = () => ({ top: 0, height: 100 });
    fireEvent.dragOver(row, { clientY: 50, dataTransfer });
    fireEvent.drop(row, { clientY: 50, dataTransfer });

    await waitFor(() => {
      expect(onMovePage).toHaveBeenCalledWith("a", "b", "inside");
    });
  });

  it("does not call move when dropping onto the same page", async () => {
    const { onMovePage } = setup();
    const source = screen.getByRole("button", { name: "A" });
    const row = source.closest(".page-row");
    expect(row).not.toBeNull();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(row, { clientY: 50, dataTransfer });
    fireEvent.drop(row, { clientY: 50, dataTransfer });

    await waitFor(() => expect(onMovePage).not.toHaveBeenCalled());
  });
});
