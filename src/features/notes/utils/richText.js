const EMPTY_HTML_PATTERNS = new Set([
  "",
  "<br>",
  "<div><br></div>",
  "<p><br></p>"
]);

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "div",
  "span"
]);

const ALLOWED_MARKERS = new Set([
  "dot",
  "pink-heart",
  "hibiscus",
  "cherry",
  "blossom",
  "sparkles"
]);

const BLOCK_TEXT_TAGS = new Set(["p", "div", "li"]);
const HTML_NS = "http://www.w3.org/1999/xhtml";
const MAX_RICH_HTML_LENGTH = 20000;

const sanitizeRawHtml = (html = "") =>
  String(html)
    .slice(0, MAX_RICH_HTML_LENGTH)
    .replaceAll("\0", "");

const sanitizeNode = (doc, node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return doc.createDocumentFragment();
  }

  if (node.namespaceURI && node.namespaceURI !== HTML_NS) {
    return doc.createDocumentFragment();
  }

  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = doc.createDocumentFragment();
    node.childNodes.forEach((child) => {
      fragment.appendChild(sanitizeNode(doc, child));
    });
    return fragment;
  }

  const clean = doc.createElement(tag);

  if (tag === "ul") {
    const marker = node.getAttribute("data-marker");
    if (marker && ALLOWED_MARKERS.has(marker)) {
      clean.setAttribute("data-marker", marker);
    }
  }

  node.childNodes.forEach((child) => {
    clean.appendChild(sanitizeNode(doc, child));
  });

  return clean;
};

export const sanitizeRichHtml = (html = "") => {
  const safeInput = sanitizeRawHtml(html);
  if (typeof document === "undefined") {
    return safeInput.replace(/<[^>]+>/g, " ");
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<div>${safeInput}</div>`, "text/html");
  if (parsed.querySelector("parsererror")) {
    return "";
  }
  const sourceRoot = parsed.body.firstElementChild;

  const output = document.createElement("div");
  if (!sourceRoot) {
    return "";
  }

  sourceRoot.childNodes.forEach((child) => {
    output.appendChild(sanitizeNode(document, child));
  });

  return output.innerHTML;
};

export const normalizeHtml = (html = "") => {
  const sanitized = sanitizeRichHtml(html).trim();

  if (EMPTY_HTML_PATTERNS.has(sanitized)) {
    return "";
  }

  return sanitized;
};

export const htmlToText = (html = "") => {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ");
  }

  const extractText = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      return "\n";
    }

    const content = Array.from(node.childNodes)
      .map((child) => extractText(child))
      .join("");

    if (BLOCK_TEXT_TAGS.has(tag)) {
      return `${content}\n`;
    }

    return content;
  };

  const box = document.createElement("div");
  box.innerHTML = sanitizeRichHtml(html);
  return Array.from(box.childNodes)
    .map((child) => extractText(child))
    .join("")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
};
