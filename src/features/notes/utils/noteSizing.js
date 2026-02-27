import {
  MAX_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH
} from "../constants";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const getAutoSize = (title, contentText, maxWidth = MAX_NOTE_WIDTH) => {
  const safeTitle = (title ?? "").trim();
  const lines = (contentText ?? "").split("\n");
  const longestLine = Math.max(
    safeTitle.length,
    ...lines.map((line) => line.length),
    12
  );

  const width = clamp(Math.round(180 + longestLine * 7.2), MIN_NOTE_WIDTH, maxWidth);
  const charsPerLine = Math.max(12, Math.floor((width - 48) / 8.2));

  const visualLineCount = lines.reduce((sum, line) => {
    const len = Math.max(line.length, 1);
    return sum + Math.max(1, Math.ceil(len / charsPerLine));
  }, 0);

  const height = Math.max(MIN_NOTE_HEIGHT, 132 + visualLineCount * 24);

  return { width, height };
};
