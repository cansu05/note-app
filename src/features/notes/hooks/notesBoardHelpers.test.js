import { describe, expect, it } from "vitest";
import { movePageInTree } from "./notesBoardHelpers";

const pickLayout = (pages) =>
  pages.map((page) => ({
    id: page.id,
    parentId: page.parentId ?? null,
    sortOrder: page.sortOrder
  }));

describe("movePageInTree", () => {
  it("moves page inside target as child", () => {
    const pages = [
      { id: "a", parentId: null, sortOrder: 1 },
      { id: "b", parentId: null, sortOrder: 2 },
      { id: "c", parentId: "a", sortOrder: 1 }
    ];

    const { nextPages, changesById } = movePageInTree(pages, "b", "a", "inside");
    const layout = pickLayout(nextPages);

    expect(layout).toEqual([
      { id: "a", parentId: null, sortOrder: 1 },
      { id: "c", parentId: "a", sortOrder: 1 },
      { id: "b", parentId: "a", sortOrder: 2 }
    ]);
    expect(changesById).toEqual({
      b: { parentId: "a", sortOrder: 2 }
    });
  });

  it("reorders page before target in same level", () => {
    const pages = [
      { id: "a", parentId: null, sortOrder: 1 },
      { id: "b", parentId: null, sortOrder: 2 },
      { id: "c", parentId: null, sortOrder: 3 }
    ];

    const { nextPages, changesById } = movePageInTree(pages, "c", "a", "before");
    const layout = pickLayout(nextPages);

    expect(layout).toEqual([
      { id: "c", parentId: null, sortOrder: 1 },
      { id: "a", parentId: null, sortOrder: 2 },
      { id: "b", parentId: null, sortOrder: 3 }
    ]);
    expect(changesById).toEqual({
      a: { parentId: null, sortOrder: 2 },
      b: { parentId: null, sortOrder: 3 },
      c: { parentId: null, sortOrder: 1 }
    });
  });

  it("prevents moving page into its own descendant", () => {
    const pages = [
      { id: "a", parentId: null, sortOrder: 1 },
      { id: "b", parentId: "a", sortOrder: 1 },
      { id: "c", parentId: null, sortOrder: 2 }
    ];

    const { nextPages, changesById } = movePageInTree(pages, "a", "b", "inside");

    expect(pickLayout(nextPages)).toEqual(pickLayout(pages));
    expect(changesById).toEqual({});
  });
});
