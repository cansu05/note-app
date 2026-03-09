import { memo, useEffect, useRef, useState } from "react";
import { MAX_NOTE_HEIGHT, MIN_NOTE_HEIGHT } from "../constants";
import { getAutoSize } from "../utils/noteSizing";
import { htmlToText, normalizeHtml } from "../utils/richText";
import { useNoteEditor } from "../hooks/useNoteEditor";

export const NoteCard = memo(({
  note,
  isSelected,
  onSelect,
  onDrag,
  onDragEnd,
  onSave,
  onResize,
  onDelete,
  boardRef
}) => {
  const MIN_EDITABLE_CARD_HEIGHT = 400;
  const isModel = note.kind === "model";
  const dragState = useRef({ dragging: false, x: 0, y: 0 });
  const cardRef = useRef(null);
  const editorRef = useRef(null);
  const [isEditing, setIsEditing] = useState(Boolean(note.isNew));
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(normalizeHtml(note.content || ""));
  const [listStyle, setListStyle] = useState("choose");

  const {
    getMaxWidthByBoard,
    syncSize,
    applyFormat,
    applyListStyle,
    handleEditorPaste,
    handleEditorKeyDown,
    formatButtons
  } = useNoteEditor({
    draftTitle,
    draftContent,
    isEditing,
    note,
    boardRef,
    editorRef,
    cardRef,
    hasTitle: !isModel,
    lockAutoWidth: isModel,
    onResize,
    setDraftContent
  });

  useEffect(() => {
    setDraftTitle(note.title);
    setDraftContent(normalizeHtml(note.content || ""));
  }, [note.title, note.content]);

  useEffect(() => {
    if (note.isNew) {
      setIsEditing(true);
    }
  }, [note.isNew]);

  useEffect(() => {
    if (isEditing && editorRef.current && editorRef.current.innerHTML !== draftContent) {
      editorRef.current.innerHTML = draftContent;
    }
  }, [isEditing, draftContent]);

  useEffect(() => {
    syncSize();
  }, [syncSize, isEditing]);

  const handlePointerDown = (e) => {
    const isButton = Boolean(e.target.closest("button"));
    const isField = Boolean(e.target.closest("input, [contenteditable='true'], select"));

    if (isButton) return;
    if (isEditing && isField) return;

    dragState.current = {
      dragging: true,
      x: e.clientX,
      y: e.clientY
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(note.id, e);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;

    dragState.current.x = e.clientX;
    dragState.current.y = e.clientY;

    onDrag(note.id, dx, dy);
  };

  const handlePointerUp = (e) => {
    if (dragState.current.dragging) {
      onDragEnd(note.id);
    }

    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragState.current.dragging = false;
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    const normalizedContent = normalizeHtml(draftContent);
    const autoSize = getAutoSize(
      draftTitle,
      htmlToText(normalizedContent),
      getMaxWidthByBoard()
    );
    const contentHeight = Math.ceil(editorRef.current?.scrollHeight ?? 0);
    const chromeHeight = !isModel ? 118 : 92;
    const measuredHeight = Math.max(MIN_NOTE_HEIGHT, contentHeight + chromeHeight);
    const clampedHeight = Math.min(Math.max(autoSize.height, measuredHeight), MAX_NOTE_HEIGHT);

    try {
      await onSave({
        id: note.id,
        title: isModel ? "" : draftTitle.trim() || "Yeni Not",
        content: normalizedContent,
        ...(isModel
          ? { height: clampedHeight }
          : { ...autoSize, height: clampedHeight }),
        isNew: false
      });

      setDraftContent(normalizedContent);
      setIsEditing(false);
    } catch {
      // Error feedback is handled by the page container.
    }
  };

  const handleFieldPointerDown = (e) => {
    if (isEditing && !e.altKey) {
      e.stopPropagation();
    }
  };

  const editorChromeHeight = !isModel ? 118 : 92;
  const minEditableHeight = Math.max(editorChromeHeight + 92, MIN_EDITABLE_CARD_HEIGHT);
  const baseHeight = note.height ?? MIN_NOTE_HEIGHT;
  const constrainedHeight = Math.min(
    MAX_NOTE_HEIGHT,
    Math.max(baseHeight, isEditing ? minEditableHeight : MIN_NOTE_HEIGHT)
  );
  const editorMaxHeight = Math.max(92, constrainedHeight - editorChromeHeight);
  const viewChromeHeight = !isModel ? 64 : 40;
  const viewMaxHeight = Math.max(64, constrainedHeight - viewChromeHeight);

  return (
    <article
      ref={cardRef}
      className={`note-card ${isSelected ? "selected" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        backgroundColor: note.color,
        width: note.width,
        zIndex: note.zIndex ?? 1,
        minHeight: constrainedHeight,
        height: constrainedHeight
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {!isModel || isSelected || isEditing ? (
        <div className="note-head">
          {!isModel ? (
            <input
              className="note-title"
              value={draftTitle}
              aria-label="Not basligi"
              readOnly={!isEditing}
              onPointerDown={handleFieldPointerDown}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          ) : (
            <div className="note-head-spacer" />
          )}

          {(isSelected || isEditing) ? (
            <div className="note-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="note-edit"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    onSelect(note.id, e);
                  }}
                >
                  Düzenle
                </button>
              ) : null}
              {isEditing ? (
                <button
                  type="button"
                  className="note-save"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={handleSave}
                >
                  Kaydet
                </button>
              ) : null}
              <button
                type="button"
                className="note-delete"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
              >
                Sil
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isEditing && !isModel ? (
        <div
          className="note-editor-toolbar"
          onPointerDown={(e) => {
            if (!e.altKey) {
              e.stopPropagation();
            }
          }}
        >
          <button
            type="button"
            className="format-btn"
            aria-label="Kalini uygula"
            onClick={() => applyFormat("bold")}
          >
            B
          </button>
          <button
            type="button"
            className="format-btn"
            aria-label="Italik uygula"
            onClick={() => applyFormat("italic")}
          >
            I
          </button>
          <select
            className="list-style-select"
            value={listStyle}
            aria-label="Liste stili secimi"
            onChange={(e) => {
              const nextStyle = e.target.value;
              applyListStyle(nextStyle);
              setListStyle("choose");
            }}
          >
            {formatButtons.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {isEditing ? (
        <div
          ref={editorRef}
          className="note-content note-content-editor"
          style={{ maxHeight: `${editorMaxHeight}px` }}
          contentEditable
          role="textbox"
          aria-label="Not icerigi"
          suppressContentEditableWarning
          data-placeholder="Buraya notunu yaz. Liste stili seçip hemen uygulayabilirsin."
          onPointerDown={handleFieldPointerDown}
          onKeyDown={(e) => {
            // Prevent literal space insertion while using pan combo in editor.
            if (e.code === "Space" && e.altKey) {
              e.preventDefault();
              return;
            }
            handleEditorKeyDown(e);
          }}
          onPaste={(e) => {
            handleEditorPaste(e);
            requestAnimationFrame(() => syncSize());
          }}
          onInput={(e) => {
            setDraftContent(normalizeHtml(e.currentTarget.innerHTML));
            requestAnimationFrame(() => syncSize());
          }}
        />
      ) : (
        <div
          className="note-content note-content-view"
          style={{ maxHeight: `${viewMaxHeight}px` }}
          dangerouslySetInnerHTML={{ __html: draftContent || "<p></p>" }}
        />
      )}
    </article>
  );
});
