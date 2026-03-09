export const NOTE_COLORS = [
  "#c66f80",
  "#f4c7d0",
  "#fcebf1",
  "#4a6644",
  "#9faa74",
  "#d7d0b3",
  "#ece3d2"
];

export const createNewNote = (partial = {}) => ({
    id: crypto.randomUUID(),
    kind: "note",
    title: "Yeni Not",
    content: "",
    color: NOTE_COLORS[0],
    x: 24,
    y: 24,
    width: 450,
    height: 220,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial
});
