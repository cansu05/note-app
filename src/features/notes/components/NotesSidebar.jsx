import { memo, useCallback, useMemo, useState } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const INDENT_STEP = 14;
const ROOT_PARENT_ID = "__root__";

const PageTreeNodeBase = ({
  page,
  depth,
  activePageId,
  selectPage,
  onRequestCreateSubPage,
  childrenByParentId,
  collapsedPageIds,
  dropTargetId,
  dropMode,
  onTogglePageChildren,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  const childPages = childrenByParentId.get(page.id) ?? [];
  const hasChildren = childPages.length > 0;
  const isCollapsed = collapsedPageIds.has(page.id);
  const isDropTarget = dropTargetId === page.id;

  return (
    <div className="page-node">
      <div
        className={`page-row ${isDropTarget ? `drop-${dropMode}` : ""}`}
        style={{ paddingLeft: depth * INDENT_STEP }}
        onDragOver={(event) => onDragOver(event, page.id)}
        onDrop={(event) => {
          void onDrop(event, page.id);
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="page-toggle"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onTogglePageChildren(page.id);
            }}
            aria-label={`${page.name} alt sayfalari ${isCollapsed ? "ac" : "kapat"}`}
            title={isCollapsed ? "Alt sayfalari ac" : "Alt sayfalari kapat"}
          >
            {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
          </button>
        ) : (
          <span className="page-toggle-spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          draggable
          className={`page-item ${page.id === activePageId ? "active" : ""}`}
          onClick={() => selectPage(page.id)}
          onDragStart={(event) => onDragStart(event, page.id)}
          onDragEnd={onDragEnd}
        >
          {page.name}
        </button>
        <button
          type="button"
          className="create-subpage"
          onClick={() => onRequestCreateSubPage(page.id)}
          title="Alt sayfa ekle"
          aria-label={`${page.name} icin alt sayfa ekle`}
        >
          +
        </button>
      </div>
      {!isCollapsed
        ? childPages.map((childPage) => (
            <PageTreeNode
              key={childPage.id}
              page={childPage}
              depth={depth + 1}
              activePageId={activePageId}
              selectPage={selectPage}
              onRequestCreateSubPage={onRequestCreateSubPage}
              childrenByParentId={childrenByParentId}
              collapsedPageIds={collapsedPageIds}
              dropTargetId={dropTargetId}
              dropMode={dropMode}
              onTogglePageChildren={onTogglePageChildren}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))
        : null}
    </div>
  );
};

const PageTreeNode = memo(PageTreeNodeBase);

export const NotesSidebar = ({
  pages,
  activePageId,
  selectPage,
  onRequestCreatePage,
  onRequestCreateSubPage,
  onMovePage,
  isHidden,
  onToggleSidebar
}) => {
  const [collapsedPageIds, setCollapsedPageIds] = useState(() => new Set());
  const [draggedPageId, setDraggedPageId] = useState(null);
  const [dropHint, setDropHint] = useState({ targetId: null, mode: null });

  const childrenByParentId = useMemo(() => {
    const map = new Map();
    pages.forEach((page) => {
      const key = page.parentId ?? ROOT_PARENT_ID;
      const siblings = map.get(key) ?? [];
      siblings.push(page);
      map.set(key, siblings);
    });
    map.forEach((siblings, key) => {
      map.set(
        key,
        siblings.slice().sort((a, b) => a.sortOrder - b.sortOrder)
      );
    });
    return map;
  }, [pages]);

  const rootPages = childrenByParentId.get(ROOT_PARENT_ID) ?? [];

  const togglePageChildren = useCallback((pageId) => {
    setCollapsedPageIds((previous) => {
      const next = new Set(previous);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }, []);

  const getDropMode = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    if (offsetY < rect.height * 0.25) return "before";
    if (offsetY > rect.height * 0.75) return "after";
    return "inside";
  }, []);

  const setDropHintIfChanged = useCallback((targetId, mode) => {
    setDropHint((previous) => {
      if (previous?.targetId === targetId && previous?.mode === mode) {
        return previous;
      }
      return { targetId, mode };
    });
  }, []);

  const handleDragStart = useCallback((event, pageId) => {
    setDraggedPageId(pageId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pageId);
  }, []);

  const handleDragOver = useCallback((event, targetId) => {
    if (!draggedPageId || draggedPageId === targetId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropHintIfChanged(targetId, getDropMode(event));
  }, [draggedPageId, getDropMode, setDropHintIfChanged]);

  const handleDrop = useCallback(async (event, targetId) => {
    event.preventDefault();
    if (!draggedPageId || draggedPageId === targetId || !onMovePage) {
      setDropHint({ targetId: null, mode: null });
      return;
    }

    try {
      await onMovePage(draggedPageId, targetId, getDropMode(event));
    } finally {
      setDraggedPageId(null);
      setDropHint({ targetId: null, mode: null });
    }
  }, [draggedPageId, getDropMode, onMovePage]);

  const handleDragEnd = useCallback(() => {
    setDraggedPageId(null);
    setDropHint({ targetId: null, mode: null });
  }, []);

  if (isHidden) {
    return (
      <aside className="sidebar sidebar-collapsed">
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleSidebar}
          title="Sayfalari goster"
          aria-label="Sayfalari goster"
        >
          <FiChevronRight size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h2>Sayfalar</h2>
        <div className="sidebar-actions">
          <button type="button" className="create-page" onClick={onRequestCreatePage}>
            + Sayfa
          </button>
          <button type="button" className="sidebar-hide-btn" onClick={onToggleSidebar}>
            <FiChevronLeft size={16} />
          </button>
        </div>
      </div>
      <div className="page-list">
        {rootPages.map((page) => (
          <PageTreeNode
            key={page.id}
            page={page}
            depth={0}
            activePageId={activePageId}
            selectPage={selectPage}
            onRequestCreateSubPage={onRequestCreateSubPage}
            childrenByParentId={childrenByParentId}
            collapsedPageIds={collapsedPageIds}
            dropTargetId={dropHint.targetId}
            dropMode={dropHint.mode}
            onTogglePageChildren={togglePageChildren}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </aside>
  );
};
