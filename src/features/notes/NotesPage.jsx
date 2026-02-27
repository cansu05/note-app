import { useCallback } from "react";
import { ActivePagePanel } from "./components/ActivePagePanel";
import { ConfirmModal } from "./components/ConfirmModal";
import { CreatePageModal } from "./components/CreatePageModal";
import { NotesBoardCanvas } from "./components/NotesBoardCanvas";
import { NotesSidebar } from "./components/NotesSidebar";
import { NotesToolbar } from "./components/NotesToolbar";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { useNotesBoard } from "./hooks/useNotesBoard";
import { useNotesPageController } from "./hooks/useNotesPageController";
import { NOTES_UI_ERRORS } from "./notesMessages";
import { useBoardUiStore } from "./store/useBoardUiStore";

export const NotesPage = () => {
  const isSidebarHidden = useBoardUiStore((state) => state.isSidebarHidden);
  const toggleSidebar = useBoardUiStore((state) => state.toggleSidebar);
  const isShortcutsOpen = useBoardUiStore((state) => state.isShortcutsOpen);
  const openShortcuts = useBoardUiStore((state) => state.openShortcuts);
  const closeShortcuts = useBoardUiStore((state) => state.closeShortcuts);
  const board = useNotesBoard();
  const activePage = board.pages.find((page) => page.id === board.activePageId) ?? null;

  const controller = useNotesPageController({
    notes: board.notes,
    boardRef: board.boardRef,
    zoomLevel: board.zoomLevel,
    setZoomLevel: board.setZoomLevel,
    createNote: board.createNote,
    createNewPage: board.createNewPage,
    renamePage: board.renamePage,
    deletePage: board.deletePage,
    movePage: board.movePage
  });

  const handleToolbarColorSelect = useCallback(
    async (color) => {
      if (board.selectedIds.length > 0) {
        try {
          await Promise.all(
            board.selectedIds.map((noteId) => board.updateNote(noteId, { color }))
          );
          controller.setUiError("");
        } catch {
          controller.setUiError(NOTES_UI_ERRORS.saveNote);
          return;
        }
      }

      board.setActiveColor(color);
    },
    [board, controller]
  );

  return (
    <main className="app-shell">
      {controller.uiError ? <p className="ui-error-banner">{controller.uiError}</p> : null}

      <NotesToolbar
        colors={board.colors}
        activeColor={board.activeColor}
        setActiveColor={handleToolbarColorSelect}
        onOpenShortcuts={openShortcuts}
        createNote={controller.handleCreateNote}
        createModel={controller.handleCreateModel}
        zoomLevel={board.zoomLevel}
        onZoomIn={controller.handleZoomIn}
        onZoomOut={controller.handleZoomOut}
        onZoomReset={controller.handleZoomReset}
      />

      <section className={`workspace ${isSidebarHidden ? "sidebar-hidden" : ""}`}>
        <NotesSidebar
          pages={board.pages}
          activePageId={board.activePageId}
          selectPage={board.selectPage}
          onRequestCreatePage={controller.openCreatePage}
          onRequestCreateSubPage={controller.openCreatePage}
          onMovePage={controller.handleMovePage}
          isHidden={isSidebarHidden}
          onToggleSidebar={toggleSidebar}
        />

        <section className="board-column">
          <ActivePagePanel
            activePage={activePage}
            renamePage={controller.handleRenamePage}
            onRequestDelete={controller.requestDeletePage}
          />

          <NotesBoardCanvas
            notes={board.notes}
            selectedId={board.selectedId}
            selectedIds={board.selectedIds}
            boardRef={board.boardRef}
            boardStage={controller.boardStage}
            zoomLevel={board.zoomLevel}
            clearSelection={board.clearSelection}
            bringNoteToFront={board.bringNoteToFront}
            moveNote={board.moveNote}
            commitNotePosition={board.commitNotePosition}
            updateNote={board.updateNote}
            duplicateNotes={board.duplicateNotes}
            setSelectedIds={board.setSelectedIds}
            queueNoteResize={board.queueNoteResize}
            openConfirm={controller.openConfirm}
            closeConfirm={controller.closeConfirm}
            removeNote={board.removeNote}
            setUiError={controller.setUiError}
          />
        </section>
      </section>

      <CreatePageModal
        isOpen={controller.createPageState.isOpen}
        draftName={controller.createPageState.draftName}
        parentPageId={controller.createPageState.parentPageId}
        pages={board.pages}
        onChangeName={(value) =>
          controller.setCreatePageState((prev) => ({ ...prev, draftName: value }))
        }
        onChangeParentPage={(value) =>
          controller.setCreatePageState((prev) => ({ ...prev, parentPageId: value }))
        }
        onCancel={controller.closeCreatePage}
        onCreate={controller.submitCreatePage}
      />

      <ConfirmModal
        isOpen={controller.confirmState.isOpen}
        title={controller.confirmState.title}
        message={controller.confirmState.message}
        confirmText={controller.confirmState.confirmText}
        onCancel={controller.closeConfirm}
        onConfirm={async () => {
          try {
            if (controller.confirmState.onConfirm) {
              await controller.confirmState.onConfirm();
            } else {
              controller.closeConfirm();
            }
            controller.setUiError("");
          } catch {
            controller.setUiError(NOTES_UI_ERRORS.generic);
          }
        }}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
    </main>
  );
};
