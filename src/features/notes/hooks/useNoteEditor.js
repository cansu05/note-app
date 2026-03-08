import { useCallback } from "react";
import {
  LIST_STYLE_OPTIONS,
  MAX_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH
} from "../constants";
import { getAutoSize } from "../utils/noteSizing";
import { htmlToText, normalizeHtml } from "../utils/richText";

const getMarkerList = (selection) => {
  const anchorNode = selection?.anchorNode;
  const anchorElement =
    anchorNode?.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
  return anchorElement?.closest?.("ul") ?? null;
};

const placeCaretInside = (element) => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

const wrapSelectionWithTag = (tagName) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);

  if (range.collapsed) {
    const wrapper = document.createElement(tagName);
    wrapper.appendChild(document.createTextNode("\u200b"));
    range.insertNode(wrapper);
    placeCaretInside(wrapper);
    return true;
  }

  const fragment = range.extractContents();
  const wrapper = document.createElement(tagName);
  wrapper.appendChild(fragment);
  range.insertNode(wrapper);
  selection.removeAllRanges();
  const nextRange = document.createRange();
  nextRange.selectNodeContents(wrapper);
  nextRange.collapse(false);
  selection.addRange(nextRange);
  return true;
};

const replaceListTag = (list, tagName) => {
  if (!list || list.tagName.toLowerCase() === tagName.toLowerCase()) {
    return list;
  }
  const replacement = document.createElement(tagName);
  Array.from(list.children).forEach((child) => {
    if (child.tagName?.toLowerCase() === "li") {
      replacement.appendChild(child.cloneNode(true));
    }
  });
  list.replaceWith(replacement);
  return replacement;
};

const createListFromSelection = (tagName) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const list = document.createElement(tagName);

  if (range.collapsed) {
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);
    range.insertNode(list);
    placeCaretInside(item);
    return list;
  }

  const text = range.toString();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    const item = document.createElement("li");
    item.textContent = text || "";
    list.appendChild(item);
  } else {
    lines.forEach((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      list.appendChild(item);
    });
  }

  range.deleteContents();
  range.insertNode(list);
  placeCaretInside(list.lastElementChild || list);
  return list;
};

export const useNoteEditor = ({
  draftTitle,
  draftContent,
  isEditing,
  note,
  boardRef,
  editorRef,
  cardRef,
  hasTitle = true,
  lockAutoWidth = false,
  onResize,
  setDraftContent
}) => {
  const getMaxWidthByBoard = useCallback(() => {
    const board = boardRef?.current;
    return board
      ? Math.max(MIN_NOTE_WIDTH, Math.min(MAX_NOTE_WIDTH, board.clientWidth - note.x - 20))
      : MAX_NOTE_WIDTH;
  }, [boardRef, note.x]);

  const syncSize = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const contentBox = editorRef.current ?? card.querySelector(".note-content");

    const plainContent = htmlToText(draftContent);
    const autoSize = getAutoSize(draftTitle, plainContent, getMaxWidthByBoard());

    if (!lockAutoWidth && autoSize.width !== note.width) {
      onResize({ width: autoSize.width });
    }

    const contentHeight = contentBox ? Math.ceil(contentBox.scrollHeight) : 0;
    const chromeHeight = isEditing ? (hasTitle ? 118 : 92) : (hasTitle ? 64 : 40);
    const measuredHeight = Math.max(MIN_NOTE_HEIGHT, contentHeight + chromeHeight);
    const targetHeight = Math.max(measuredHeight, autoSize.height);
    const nextHeight = Math.max(MIN_NOTE_HEIGHT, targetHeight);
    if (nextHeight !== note.height) {
      onResize({ height: nextHeight });
    }
  }, [
    cardRef,
    draftContent,
    draftTitle,
    editorRef,
    getMaxWidthByBoard,
    hasTitle,
    isEditing,
    lockAutoWidth,
    note.height,
    note.width,
    onResize
  ]);

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Enter" || !editorRef.current) return;

    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorElement =
      anchorNode?.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
    const listItem = anchorElement?.closest?.("li");

    if (!listItem) return;

    const itemText = (listItem.textContent || "").replace(/\u00A0/g, " ").trim();
    if (itemText.length > 0) return;

    event.preventDefault();
    const list = listItem.closest("ul,ol");
    if (!list) return;

    listItem.remove();
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    list.insertAdjacentElement("afterend", paragraph);

    if (!list.querySelector("li")) {
      list.remove();
    }

    const range = document.createRange();
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    setDraftContent(normalizeHtml(editorRef.current.innerHTML));
  };

  const applyFormat = (command) => {
    if (!isEditing || !editorRef.current) return;
    editorRef.current.focus();

    if (command === "bold") {
      wrapSelectionWithTag("strong");
    } else if (command === "italic") {
      wrapSelectionWithTag("em");
    }

    setDraftContent(normalizeHtml(editorRef.current.innerHTML));
  };

  const applyListStyle = (style) => {
    if (!isEditing || !editorRef.current || style === "choose") return;
    editorRef.current.focus();
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorElement =
      anchorNode?.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
    let list = anchorElement?.closest?.("ul,ol") ?? null;

    if (style === "ordered") {
      list = list ? replaceListTag(list, "ol") : createListFromSelection("ol");
      setDraftContent(normalizeHtml(editorRef.current.innerHTML));
      return;
    }

    list = list ? replaceListTag(list, "ul") : getMarkerList(selection);
    if (!list) {
      list = createListFromSelection("ul");
    }

    if (list && list.tagName.toLowerCase() !== "ul") {
      list = replaceListTag(list, "ul");
    }

    if (list) {
      list.dataset.marker = style;
    }

    editorRef.current.querySelectorAll("ul:not([data-marker])").forEach((ul) => {
      ul.dataset.marker = style;
    });

    setDraftContent(normalizeHtml(editorRef.current.innerHTML));
  };

  const handleEditorPaste = () => {
    if (!editorRef.current) return;
    requestAnimationFrame(() => {
      setDraftContent(normalizeHtml(editorRef.current.innerHTML));
    });
  };

  const formatButtons = LIST_STYLE_OPTIONS;

  return {
    getMaxWidthByBoard,
    syncSize,
    applyFormat,
    applyListStyle,
    handleEditorPaste,
    handleEditorKeyDown,
    formatButtons
  };
};
