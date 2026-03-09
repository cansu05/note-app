import { useCallback } from "react";
import {
  LIST_STYLE_OPTIONS,
  MAX_NOTE_HEIGHT,
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

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote"
]);

const normalizeLineText = (value = "") =>
  String(value).replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

const extractLinesFromRange = (range) => {
  const fragment = range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);
  const lines = [];

  const pushLine = (value) => {
    lines.push(normalizeLineText(value));
  };

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent
        ?.replace(/\r/g, "")
        .split("\n")
        .forEach((line) => pushLine(line));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();

    if (tag === "br") {
      pushLine("");
      return;
    }

    if (tag === "ul" || tag === "ol") {
      Array.from(node.children).forEach((child) => {
        if (child.tagName?.toLowerCase() === "li") {
          pushLine(child.textContent || "");
        }
      });
      return;
    }

    if (BLOCK_TAGS.has(tag)) {
      pushLine(node.textContent || "");
      return;
    }

    const nestedBlocks = node.querySelectorAll("p,div,li,h1,h2,h3,h4,h5,h6,blockquote");
    if (nestedBlocks.length > 0) {
      nestedBlocks.forEach((block) => pushLine(block.textContent || ""));
      return;
    }

    pushLine(node.textContent || "");
  });

  return lines;
};

const createListFromSelection = (tagName) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);

  if (range.collapsed) {
    const list = document.createElement(tagName);
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);
    range.insertNode(list);
    placeCaretInside(item);
    return list;
  }

  const extractedLines = extractLinesFromRange(range);
  const text = range.toString().replace(/\r/g, "");
  const groupedLines = [];
  let currentGroup = [];

  const sourceLines = extractedLines.length > 0 ? extractedLines : text.split("\n");
  sourceLines.forEach((rawLine) => {
    const line = normalizeLineText(rawLine);
    if (!line) {
      if (currentGroup.length > 0) {
        groupedLines.push(currentGroup);
        currentGroup = [];
      }
      return;
    }
    currentGroup.push(line);
  });

  if (currentGroup.length > 0) {
    groupedLines.push(currentGroup);
  }

  if (groupedLines.length === 0) {
    groupedLines.push([(text || "").trim()]);
  }

  range.deleteContents();

  const fragment = document.createDocumentFragment();
  const lists = [];
  groupedLines.forEach((group, index) => {
    const list = document.createElement(tagName);
    if (tagName === "ol") {
      let nextAutoValue = 1;
      let groupStart = null;

      group.forEach((line) => {
        const item = document.createElement("li");
        const numbered = line.match(/^(\d+)[\.\)]\s+(.+)$/);
        const value = numbered
          ? Number.parseInt(numbered[1], 10)
          : nextAutoValue;
        const textValue = numbered ? numbered[2].trim() : line;

        item.textContent = textValue;
        item.setAttribute("value", String(value));
        list.appendChild(item);

        groupStart = groupStart ?? value;
        nextAutoValue = value + 1;
      });

      if (Number.isFinite(groupStart) && groupStart > 1) {
        list.setAttribute("start", String(groupStart));
      }
    } else {
      group.forEach((line) => {
        const item = document.createElement("li");
        item.textContent = line;
        list.appendChild(item);
      });
    }

    lists.push(list);
    fragment.appendChild(list);

    if (index < groupedLines.length - 1) {
      const spacer = document.createElement("p");
      spacer.appendChild(document.createElement("br"));
      fragment.appendChild(spacer);
    }
  });

  range.insertNode(fragment);
  const lastList = lists[lists.length - 1];
  if (lastList) {
    placeCaretInside(lastList.lastElementChild || lastList);
  }
  return lists[0] ?? null;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const buildHtmlFromPlainText = (text = "") => {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const blocks = [];
  let activeList = null;
  let activeOrderedStart = null;
  let listItems = [];

  const flushList = () => {
    if (!activeList || listItems.length === 0) {
      activeList = null;
      activeOrderedStart = null;
      listItems = [];
      return;
    }
    if (activeList === "ol") {
      const startAttr =
        Number.isFinite(activeOrderedStart) && activeOrderedStart > 1
          ? ` start="${activeOrderedStart}"`
          : "";
      blocks.push(`<ol${startAttr}>${listItems.join("")}</ol>`);
    } else {
      blocks.push(`<ul>${listItems.join("")}</ul>`);
    }
    activeList = null;
    activeOrderedStart = null;
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      blocks.push("<p><br></p>");
      return;
    }

    const orderedMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (orderedMatch) {
      const textValue = orderedMatch[2]?.trim() ?? "";
      const numberedValue = Number.parseInt(orderedMatch[1], 10) || 1;
      if (activeList !== "ol") {
        flushList();
        activeList = "ol";
        activeOrderedStart = numberedValue;
      }
      listItems.push(`<li value="${numberedValue}">${escapeHtml(textValue)}</li>`);
      return;
    }

    const unorderedMatch = line.match(/^([*•\-–—]|💗|💕|💖|🩷|❤️|🌺|🌸|🌼|✨)\s+(.+)$/);
    if (unorderedMatch) {
      const textValue = unorderedMatch[2]?.trim() ?? "";
      if (activeList !== "ul") {
        flushList();
        activeList = "ul";
      }
      listItems.push(`<li>${escapeHtml(textValue)}</li>`);
      return;
    }

    flushList();
    blocks.push(`<p>${escapeHtml(line)}</p>`);
  });

  flushList();
  return blocks.join("");
};

const insertHtmlAtSelection = (html) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;

  range.insertNode(fragment);
  if (!lastNode) return true;

  const nextRange = document.createRange();
  nextRange.setStartAfter(lastNode);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  return true;
};

const isCaretAtListItemStart = (selection, listItem) => {
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed || !listItem) {
    return false;
  }

  const range = selection.getRangeAt(0);
  if (!listItem.contains(range.startContainer)) return false;

  const probe = range.cloneRange();
  probe.selectNodeContents(listItem);
  probe.setEnd(range.startContainer, range.startOffset);
  return normalizeLineText(probe.toString()).length === 0;
};

const splitListWithParagraph = (listItem) => {
  const list = listItem?.closest?.("ul,ol");
  if (!list) return null;

  const tagName = list.tagName.toLowerCase();
  const originalStart = tagName === "ol" ? Number.parseInt(list.getAttribute("start") ?? "1", 10) || 1 : 1;
  const items = Array.from(list.children).filter((child) => child.tagName?.toLowerCase() === "li");
  const pivotIndex = items.indexOf(listItem);
  if (pivotIndex < 0) return null;

  const beforeItems = items.slice(0, pivotIndex);
  const afterItems = items.slice(pivotIndex + 1);
  const paragraph = document.createElement("p");
  paragraph.innerHTML = listItem.innerHTML?.trim() ? listItem.innerHTML : "<br>";

  const makeList = (startValue = 1) => {
    const next = document.createElement(tagName);
    if (tagName === "ul" && list.dataset.marker) {
      next.dataset.marker = list.dataset.marker;
    }
    if (tagName === "ol" && startValue > 1) {
      next.setAttribute("start", String(startValue));
    }
    return next;
  };

  const fragment = document.createDocumentFragment();

  if (beforeItems.length > 0) {
    const beforeList = makeList(originalStart);
    beforeItems.forEach((item) => beforeList.appendChild(item));
    fragment.appendChild(beforeList);
  }

  fragment.appendChild(paragraph);

  if (afterItems.length > 0) {
    const afterStart = tagName === "ol" ? originalStart + beforeItems.length + 1 : 1;
    const afterList = makeList(afterStart);
    afterItems.forEach((item) => afterList.appendChild(item));
    fragment.appendChild(afterList);
  }

  list.replaceWith(fragment);
  return paragraph;
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
  const MIN_EDITABLE_CARD_HEIGHT = 400;
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

    const currentHtml =
      isEditing && editorRef.current
        ? normalizeHtml(editorRef.current.innerHTML)
        : draftContent;
    const plainContent = htmlToText(currentHtml);
    const autoSize = getAutoSize(draftTitle, plainContent, getMaxWidthByBoard());

    if (!lockAutoWidth && autoSize.width !== note.width) {
      onResize({ width: autoSize.width });
    }

    const contentHeight = contentBox ? Math.ceil(contentBox.scrollHeight) : 0;
    const chromeHeight = isEditing ? (hasTitle ? 118 : 92) : (hasTitle ? 64 : 40);
    const minHeightByMode = isEditing ? MIN_EDITABLE_CARD_HEIGHT : MIN_NOTE_HEIGHT;
    const measuredHeight = Math.max(minHeightByMode, contentHeight + chromeHeight);
    const targetHeight = Math.max(measuredHeight, autoSize.height);
    const nextHeight = Math.min(MAX_NOTE_HEIGHT, Math.max(minHeightByMode, targetHeight));
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
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorElement =
      anchorNode?.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode;
    const listItem = anchorElement?.closest?.("li");
    const orderedList = listItem?.closest?.("ol") ?? null;

    if (
      orderedList &&
      listItem &&
      /^\d$/.test(event.key) &&
      isCaretAtListItemStart(selection, listItem)
    ) {
      event.preventDefault();
      listItem.setAttribute("value", event.key);
      setDraftContent(normalizeHtml(editorRef.current.innerHTML));
      return;
    }

    if (
      orderedList &&
      listItem &&
      event.key === "." &&
      isCaretAtListItemStart(selection, listItem)
    ) {
      // Let users type "2." at line start without inserting a literal dot.
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace" && listItem && isCaretAtListItemStart(selection, listItem)) {
      event.preventDefault();
      const paragraph = splitListWithParagraph(listItem);
      if (!paragraph) return;

      const range = document.createRange();
      range.selectNodeContents(paragraph);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      setDraftContent(normalizeHtml(editorRef.current.innerHTML));
      return;
    }

    if (event.key === "Tab" && listItem) {
      event.preventDefault();
      const parentList = listItem.closest("ul,ol");
      if (!parentList) return;

      if (event.shiftKey) {
        const parentListItem = parentList.closest("li");
        if (!parentListItem) return;

        parentListItem.insertAdjacentElement("afterend", listItem);
        if (!parentList.querySelector("li")) {
          parentList.remove();
        }

        placeCaretInside(listItem);
        setDraftContent(normalizeHtml(editorRef.current.innerHTML));
        return;
      }

      const previousSibling = listItem.previousElementSibling;
      if (!previousSibling || previousSibling.tagName?.toLowerCase() !== "li") return;

      const listTag = parentList.tagName.toLowerCase();
      let nestedList = Array.from(previousSibling.children).find((child) => {
        const tag = child.tagName?.toLowerCase();
        return tag === "ul" || tag === "ol";
      });

      if (!nestedList) {
        nestedList = document.createElement(listTag);
        if (listTag === "ul" && parentList.dataset.marker) {
          nestedList.dataset.marker = parentList.dataset.marker;
        }
        previousSibling.appendChild(nestedList);
      }

      nestedList.appendChild(listItem);
      placeCaretInside(listItem);
      setDraftContent(normalizeHtml(editorRef.current.innerHTML));
      return;
    }

    if (event.key !== "Enter") return;
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

  const handleEditorPaste = (event) => {
    if (!editorRef.current) return;

    const clipboard = event?.clipboardData;
    const text = clipboard?.getData("text/plain") ?? "";
    if (!text.trim()) {
      requestAnimationFrame(() => {
        setDraftContent(normalizeHtml(editorRef.current.innerHTML));
      });
      return;
    }

    event.preventDefault();
    const html = buildHtmlFromPlainText(text);
    const inserted = insertHtmlAtSelection(html);
    if (!inserted) return;
    setDraftContent(normalizeHtml(editorRef.current.innerHTML));
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
