import { useCallback, useMemo, useState } from "react";
import { NOTES_UI_ERRORS, NOTES_UI_TEXT } from "../notesMessages";

export const useNotesPageController = ({
  notes,
  boardRef,
  zoomLevel,
  setZoomLevel,
  createNote,
  createNewPage,
  renamePage,
  deletePage,
  movePage
}) => {
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 1.8;
  const ZOOM_STEP = 0.1;

  const [uiError, setUiError] = useState("");
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: NOTES_UI_TEXT.confirmDefault,
    onConfirm: null
  });
  const [createPageState, setCreatePageState] = useState({
    isOpen: false,
    draftName: "",
    parentPageId: null
  });

  const openConfirm = useCallback(
    ({ title, message, confirmText = NOTES_UI_TEXT.confirmDefault, onConfirm }) => {
      setConfirmState({ isOpen: true, title, message, confirmText, onConfirm });
    },
    []
  );

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  const openCreatePage = useCallback((parentPageId = null) => {
    const normalizedParentId =
      typeof parentPageId === "string" && parentPageId.trim() ? parentPageId : null;
    setCreatePageState({ isOpen: true, draftName: "", parentPageId: normalizedParentId });
  }, []);

  const closeCreatePage = useCallback(() => {
    setCreatePageState({ isOpen: false, draftName: "", parentPageId: null });
  }, []);

  const submitCreatePage = useCallback(async () => {
    try {
      await createNewPage(createPageState.draftName, createPageState.parentPageId);
      setUiError("");
      closeCreatePage();
    } catch {
      setUiError(NOTES_UI_ERRORS.createPage);
    }
  }, [closeCreatePage, createNewPage, createPageState.draftName, createPageState.parentPageId]);

  const handleCreateNote = useCallback(async () => {
    try {
      await createNote();
      setUiError("");
    } catch {
      setUiError(NOTES_UI_ERRORS.createNote);
    }
  }, [createNote]);

  const handleCreateModel = useCallback(async () => {
    try {
      await createNote({ kind: "model" });
      setUiError("");
    } catch {
      setUiError(NOTES_UI_ERRORS.createModel);
    }
  }, [createNote]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  }, [setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
  }, [setZoomLevel]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, [setZoomLevel]);

  const handleRenamePage = useCallback(
    async (id, nextName) => {
      try {
        await renamePage(id, nextName);
        setUiError("");
      } catch {
        setUiError(NOTES_UI_ERRORS.renamePage);
      }
    },
    [renamePage]
  );

  const requestDeletePage = useCallback(
    (page) => {
      openConfirm({
        title: NOTES_UI_TEXT.deletePageTitle,
        message: `"${page.name}" sayfası, alt sayfaları ve içlerindeki tüm notlar silinecek.`,
        confirmText: NOTES_UI_TEXT.deletePageConfirm,
        onConfirm: async () => {
          await deletePage(page.id);
          closeConfirm();
        }
      });
    },
    [closeConfirm, deletePage, openConfirm]
  );

  const handleMovePage = useCallback(
    async (sourceId, targetId, position) => {
      try {
        await movePage(sourceId, targetId, position);
        setUiError("");
      } catch {
        setUiError(NOTES_UI_ERRORS.generic);
      }
    },
    [movePage]
  );

  const boardStage = useMemo(() => {
    const viewport = boardRef.current;
    const viewportWidth = viewport?.clientWidth ?? 1200;
    const viewportHeight = viewport?.clientHeight ?? 760;
    const padding = 140;

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

  return {
    uiError,
    setUiError,
    confirmState,
    openConfirm,
    closeConfirm,
    createPageState,
    setCreatePageState,
    openCreatePage,
    closeCreatePage,
    submitCreatePage,
    handleCreateNote,
    handleCreateModel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleRenamePage,
    handleMovePage,
    requestDeletePage,
    boardStage
  };
};

