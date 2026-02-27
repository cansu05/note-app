import { useMemo, useState } from "react";
import { ActivePagePanel } from "./components/ActivePagePanel";
import { ConfirmModal } from "./components/ConfirmModal";
import { CreatePageModal } from "./components/CreatePageModal";
import { NoteCard } from "./components/NoteCard";
import { NotesSidebar } from "./components/NotesSidebar";
import { NotesToolbar } from "./components/NotesToolbar";
import { useNotesBoard } from "./hooks/useNotesBoard";

export const NotesPage = () => {
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 1.8;
  const ZOOM_STEP = 0.1;
  const [uiError, setUiError] = useState("");
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Sil",
    onConfirm: null
  });
  const [createPageState, setCreatePageState] = useState({
    isOpen: false,
    draftName: "",
    parentPageId: null
  });

  const {
    notes,
    pages,
    activePageId,
    selectPage,
    createNewPage,
    renamePage,
    deletePage,
    colors,
    activeColor,
    setActiveColor,
    selectedId,
    setSelectedId,
    zoomLevel,
    setZoomLevel,
    bringNoteToFront,
    boardRef,
    createNote,
    removeNote,
    updateNote,
    moveNote,
    commitNotePosition,
    queueNoteResize
  } = useNotesBoard();

  const activePage = pages.find((page) => page.id === activePageId) ?? null;

  const openConfirm = ({ title, message, confirmText = "Sil", onConfirm }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const openCreatePage = (parentPageId = null) => {
    setCreatePageState({ isOpen: true, draftName: "", parentPageId });
  };

  const closeCreatePage = () => {
    setCreatePageState({ isOpen: false, draftName: "", parentPageId: null });
  };

  const submitCreatePage = () => {
    try {
      createNewPage(createPageState.draftName, createPageState.parentPageId);
      setUiError("");
      closeCreatePage();
    } catch {
      setUiError("Sayfa olusturulamadi. Lutfen tekrar dene.");
    }
  };

  const handleCreateNote = async () => {
    try {
      await createNote();
      setUiError("");
    } catch {
      setUiError("Not olusturulamadi. Lutfen tekrar dene.");
    }
  };

  const handleCreateModel = async () => {
    try {
      await createNote({ kind: "model" });
      setUiError("");
    } catch {
      setUiError("Model olusturulamadi. Lutfen tekrar dene.");
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const boardStage = useMemo(() => {
    const viewport = boardRef.current;
    const viewportWidth = viewport?.clientWidth ?? 1200;
    const viewportHeight = viewport?.clientHeight ?? 760;
    const padding = 360;

    const maxRight = notes.reduce(
      (max, note) => Math.max(max, (note.x ?? 0) + (note.width ?? 0)),
      0
    );
    const maxBottom = notes.reduce(
      (max, note) => Math.max(max, (note.y ?? 0) + (note.height ?? 0)),
      0
    );

    const unscaledWidth = Math.max(viewportWidth + padding, maxRight + padding);
    const unscaledHeight = Math.max(viewportHeight + padding, maxBottom + padding);

    return {
      stageWidth: Math.ceil(unscaledWidth * zoomLevel),
      stageHeight: Math.ceil(unscaledHeight * zoomLevel),
      unscaledWidth: Math.ceil(unscaledWidth),
      unscaledHeight: Math.ceil(unscaledHeight)
    };
  }, [boardRef, notes, zoomLevel]);

  return (
    <main className="app-shell">
      {uiError ? <p className="ui-error-banner">{uiError}</p> : null}

      <NotesToolbar
        colors={colors}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        createNote={handleCreateNote}
        createModel={handleCreateModel}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      <section className="workspace">
        <NotesSidebar
          pages={pages}
          activePageId={activePageId}
          selectPage={selectPage}
          onRequestCreatePage={openCreatePage}
          onRequestCreateSubPage={(parentId) => openCreatePage(parentId)}
        />

        <section className="board-column">
          <ActivePagePanel
            activePage={activePage}
            renamePage={renamePage}
            onRequestDelete={(page) =>
              openConfirm({
                title: "Sayfayi Sil",
                message: `"${page.name}" sayfasi, alt sayfalari ve iclerindeki tum notlar silinecek.`,
                confirmText: "Sayfayi Sil",
                onConfirm: async () => {
                  await deletePage(page.id);
                  closeConfirm();
                }
              })
            }
          />

          <section className="board" ref={boardRef} onClick={() => setSelectedId(null)}>
            <div
              className="board-zoom-stage"
              style={{ width: boardStage.stageWidth, height: boardStage.stageHeight }}
            >
              <div
                className="board-zoom"
                style={{
                  width: boardStage.unscaledWidth,
                  height: boardStage.unscaledHeight,
                  transform: `scale(${zoomLevel})`
                }}
              >
              {notes.length === 0 ? (
                <p className="empty-board">Bu sayfada not yok. + Not Ekle ile basla.</p>
              ) : null}

              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedId === note.id}
                  onSelect={() => bringNoteToFront(note.id)}
                  onDrag={(dx, dy) => moveNote(note.id, dx / zoomLevel, dy / zoomLevel)}
                  onDragEnd={async () => {
                    try {
                      await commitNotePosition(note.id);
                      setUiError("");
                    } catch {
                      setUiError("Not konumu kaydedilemedi. Lutfen tekrar dene.");
                    }
                  }}
                  onSave={async (changes) => {
                    try {
                      await updateNote(note.id, changes);
                      setUiError("");
                    } catch {
                      setUiError("Not kaydedilemedi. Lutfen tekrar dene.");
                      throw new Error("Note save failed");
                    }
                  }}
                  onResize={(size) => queueNoteResize(note.id, size)}
                  onDelete={() =>
                    openConfirm({
                      title: "Notu Sil",
                      message: `"${note.title || "Yeni Not"}" notu silinecek.`,
                      confirmText: "Notu Sil",
                      onConfirm: async () => {
                        await removeNote(note.id);
                        closeConfirm();
                      }
                    })
                  }
                  boardRef={boardRef}
                />
              ))}
              </div>
            </div>
          </section>
        </section>
      </section>

      <CreatePageModal
        isOpen={createPageState.isOpen}
        draftName={createPageState.draftName}
        parentPageId={createPageState.parentPageId}
        pages={pages}
        onChangeName={(value) =>
          setCreatePageState((prev) => ({ ...prev, draftName: value }))
        }
        onChangeParentPage={(value) =>
          setCreatePageState((prev) => ({ ...prev, parentPageId: value }))
        }
        onCancel={closeCreatePage}
        onCreate={submitCreatePage}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onCancel={closeConfirm}
        onConfirm={async () => {
          try {
            if (confirmState.onConfirm) {
              await confirmState.onConfirm();
            } else {
              closeConfirm();
            }
            setUiError("");
          } catch {
            setUiError("Islem tamamlanamadi. Lutfen tekrar dene.");
          }
        }}
      />
    </main>
  );
};
