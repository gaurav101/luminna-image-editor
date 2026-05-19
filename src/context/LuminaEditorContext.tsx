import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLuminaCanvas } from "../hooks/useLuminaCanvas";
import {
  LUMINA_EDITOR_CLASS_PRESETS,
  LUMINA_EDITOR_DEFAULT_CLASS_NAMES,
  type LuminaEditorClassNames,
  type LuminaEditorStyleLibrary,
  type LuminaEditorStyleSlot,
} from "../stylePresets";

export interface LuminaAdjustmentState {
  brightness: number;
  contrast: number;
  blur: number;
  sharpen: number;
}

export interface LuminaFilterPreset {
  id: string;
  label: string;
  ops: Array<{ fn: string; arg?: number }>;
}

export interface LuminaTransformState {
  crop: { x: number; y: number; width: number; height: number } | null;
  resize: { width: number; height: number } | null;
}

export interface LuminaEditorConfig {
  filterPresets: LuminaFilterPreset[];
  outputMimeType: string;
  styleLibrary: LuminaEditorStyleLibrary;
  inlineStyles: boolean;
}

export interface LuminaActiveOperations {
  isRendering: boolean;
  isGeneratingPreviews: boolean;
  isExecuting: boolean;
}

export interface LuminaExecuteResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  objectUrl: string;
  revokeObjectUrl: () => void;
}

interface LuminaSnapshot {
  selectedFilter: string;
  adjustments: LuminaAdjustmentState;
  transform: LuminaTransformState;
}

export interface LuminaEditorContextValue {
  config: LuminaEditorConfig;
  file: File | null;
  previewUrl: string | null;
  activeOperations: LuminaActiveOperations;
  selectedFilter: string;
  adjustments: LuminaAdjustmentState;
  transform: LuminaTransformState;
  filterPresets: LuminaFilterPreset[];
  thumbnails: Record<string, string>;
  slotClassNames: Record<LuminaEditorStyleSlot, string>;
  slotStyles: Partial<Record<LuminaEditorStyleSlot, CSSProperties>>;
  canUndo: boolean;
  canRedo: boolean;
  setFile: (file: File | null) => Promise<void>;
  setCrop: (value: LuminaTransformState["crop"]) => void;
  setResize: (value: LuminaTransformState["resize"]) => void;
  selectFilter: (filterId: string) => void;
  setAdjustment: <K extends keyof LuminaAdjustmentState>(
    key: K,
    value: LuminaAdjustmentState[K],
  ) => void;
  undo: () => void;
  redo: () => void;
  execute: () => Promise<LuminaExecuteResult | null>;
  syncPreview: () => Promise<void>;
}

export interface LuminaEditorProviderProps {
  children: ReactNode;
  filterPresets?: LuminaFilterPreset[];
  outputMimeType?: string;
  styleLibrary?: LuminaEditorStyleLibrary;
  classNames?: LuminaEditorClassNames;
  styles?: Partial<Record<LuminaEditorStyleSlot, CSSProperties>>;
  inlineStyles?: boolean;
}

const DEFAULT_FILTERS: LuminaFilterPreset[] = [
  { id: "none", label: "Original", ops: [] },
  { id: "grayscale", label: "Grayscale", ops: [{ fn: "grayscale" }] },
  { id: "sepia", label: "Sepia", ops: [{ fn: "sepia" }] },
  {
    id: "warm",
    label: "Warm",
    ops: [
      { fn: "brightness", arg: 12 },
      { fn: "contrast", arg: 10 },
    ],
  },
  { id: "sharp", label: "Sharp", ops: [{ fn: "sharpen" }] },
];

const DEFAULT_ADJUSTMENTS: LuminaAdjustmentState = {
  brightness: 0,
  contrast: 0,
  blur: 0,
  sharpen: 0,
};

const LUMINA_BASE_SLOT_STYLES: Partial<Record<LuminaEditorStyleSlot, CSSProperties>> = {
  root: {
    minHeight: "560px",
    background: "#f8fafc",
    color: "#172033",
  },
  body: {
    width: "100%",
    alignItems: "stretch",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid #d9dee8",
    background: "#ffffff",
  },
  logo: { fontWeight: 700 },
  canvasArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 360,
    background: "#f5f7fb",
    padding: 16,
  },
  dropzone: {
    border: "1px dashed #4f46e5",
    borderRadius: 10,
    padding: "24px 18px",
    textAlign: "center",
    background: "#ffffff",
  },
  previewWrap: { width: "100%", display: "flex", justifyContent: "center" },
  panel: {
    borderLeft: "1px solid #d9dee8",
    background: "#ffffff",
    padding: 10,
    minWidth: 260,
  },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 },
  fThumb: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: 8,
    background: "#f8fafc",
  },
  fLbl: { fontSize: 12 },
  panelBody: { display: "grid", gap: 10 },
  sliderRow: { display: "grid", gap: 6 },
  sliderHdr: { display: "flex", justifyContent: "space-between", fontSize: 12 },
  sliderLbl: { fontWeight: 600 },
  sliderVal: { color: "#536178" },
  btnSm: {
    border: "1px solid #c9d1df",
    borderRadius: 8,
    background: "#ffffff",
    padding: "6px 10px",
    fontWeight: 600,
  },
  btnPrimary: {
    border: "1px solid #4f46e5",
    borderRadius: 8,
    background: "#4f46e5",
    color: "#ffffff",
    padding: "6px 10px",
    fontWeight: 700,
  },
};

export const LuminaEditorContext = createContext<LuminaEditorContextValue | null>(null);

export function LuminaEditorProvider({
  children,
  filterPresets = DEFAULT_FILTERS,
  outputMimeType = "image/png",
  styleLibrary = "lumina",
  classNames,
  styles,
  inlineStyles = true,
}: LuminaEditorProviderProps) {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeOperations, setActiveOperations] = useState<LuminaActiveOperations>({
    isRendering: false,
    isGeneratingPreviews: false,
    isExecuting: false,
  });
  const [selectedFilter, setSelectedFilter] = useState(filterPresets[0]?.id ?? "none");
  const [adjustments, setAdjustments] = useState<LuminaAdjustmentState>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] = useState<LuminaTransformState>({ crop: null, resize: null });
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<LuminaSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<LuminaSnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const canvas = useLuminaCanvas();

  const slotClassNames = useMemo(() => {
    const preset = LUMINA_EDITOR_CLASS_PRESETS[styleLibrary] ?? {};
    const merged = { ...LUMINA_EDITOR_DEFAULT_CLASS_NAMES } as Record<LuminaEditorStyleSlot, string>;
    for (const key of Object.keys(merged) as LuminaEditorStyleSlot[]) {
      merged[key] = [merged[key], preset[key], classNames?.[key]].filter(Boolean).join(" ");
    }
    return merged;
  }, [classNames, styleLibrary]);

  const slotStyles = useMemo(() => {
    if (!inlineStyles) return {};
    const base = styleLibrary === "lumina" ? LUMINA_BASE_SLOT_STYLES : {};
    return { ...base, ...(styles ?? {}) };
  }, [inlineStyles, styleLibrary, styles]);

  const commitHistoryState = useCallback((nextHistory: LuminaSnapshot[], nextIndex: number) => {
    historyRef.current = nextHistory;
    historyIndexRef.current = nextIndex;
    setHistory(nextHistory);
    setHistoryIndex(nextIndex);
  }, []);

  const renderSnapshot = useCallback(
    async (targetFile: File, snapshot: LuminaSnapshot) => {
      const preset =
        filterPresets.find((candidate) => candidate.id === snapshot.selectedFilter) ?? filterPresets[0];
      if (!preset) return;
      setActiveOperations((prev) => ({ ...prev, isRendering: true }));
      try {
        const dataUrl = await canvas.render({
          file: targetFile,
          ops: preset.ops,
          adjustments: snapshot.adjustments,
          transform: snapshot.transform,
          mimeType: outputMimeType,
        });
        setPreviewUrl(dataUrl);
      } finally {
        setActiveOperations((prev) => ({ ...prev, isRendering: false }));
      }
    },
    [canvas, filterPresets, outputMimeType],
  );

  const pushHistorySnapshot = useCallback(
    (snapshot: LuminaSnapshot) => {
      const nextHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), snapshot];
      commitHistoryState(nextHistory, nextHistory.length - 1);
    },
    [commitHistoryState],
  );

  const applySnapshot = useCallback(
    async (snapshot: LuminaSnapshot, options?: { pushHistory?: boolean }) => {
      setSelectedFilter(snapshot.selectedFilter);
      setAdjustments(snapshot.adjustments);
      setTransform(snapshot.transform);
      if (file) {
        await renderSnapshot(file, snapshot);
        if (options?.pushHistory ?? true) {
          pushHistorySnapshot(snapshot);
        }
      }
    },
    [file, pushHistorySnapshot, renderSnapshot],
  );

  const setFile = useCallback(
    async (nextFile: File | null) => {
      setFileState(nextFile);
      commitHistoryState([], -1);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setTransform({ crop: null, resize: null });
      const initialFilter = filterPresets[0]?.id ?? "none";
      setSelectedFilter(initialFilter);
      if (!nextFile) {
        setPreviewUrl(null);
        setThumbnails({});
        return;
      }
      setActiveOperations((prev) => ({ ...prev, isGeneratingPreviews: true, isRendering: true }));
      try {
        const [entries, dataUrl] = await Promise.all([
          Promise.all(
            filterPresets.map(async (preset) => {
              const thumb = await canvas.buildPreview({ file: nextFile, ops: preset.ops });
              return [preset.id, thumb] as const;
            }),
          ),
          canvas.render({
            file: nextFile,
            ops: filterPresets[0]?.ops ?? [],
            adjustments: DEFAULT_ADJUSTMENTS,
            transform: { crop: null, resize: null },
            mimeType: outputMimeType,
          }),
        ]);
        setThumbnails(Object.fromEntries(entries));
        setPreviewUrl(dataUrl);
        const initialSnapshot: LuminaSnapshot = {
          selectedFilter: initialFilter,
          adjustments: DEFAULT_ADJUSTMENTS,
          transform: { crop: null, resize: null },
        };
        commitHistoryState([initialSnapshot], 0);
      } finally {
        setActiveOperations((prev) => ({
          ...prev,
          isGeneratingPreviews: false,
          isRendering: false,
        }));
      }
    },
    [canvas, commitHistoryState, filterPresets, outputMimeType],
  );

  const selectFilter = useCallback(
    (filterId: string) => {
      const snapshot: LuminaSnapshot = {
        selectedFilter: filterId,
        adjustments,
        transform,
      };
      void applySnapshot(snapshot);
    },
    [adjustments, applySnapshot, transform],
  );

  const setAdjustment = useCallback(
    <K extends keyof LuminaAdjustmentState>(key: K, value: LuminaAdjustmentState[K]) => {
      const nextAdjustments = { ...adjustments, [key]: value };
      const snapshot: LuminaSnapshot = {
        selectedFilter,
        adjustments: nextAdjustments,
        transform,
      };
      void applySnapshot(snapshot);
    },
    [adjustments, applySnapshot, selectedFilter, transform],
  );

  const setCrop = useCallback(
    (value: LuminaTransformState["crop"]) => {
      const snapshot: LuminaSnapshot = {
        selectedFilter,
        adjustments,
        transform: { ...transform, crop: value },
      };
      void applySnapshot(snapshot);
    },
    [adjustments, applySnapshot, selectedFilter, transform],
  );

  const setResize = useCallback(
    (value: LuminaTransformState["resize"]) => {
      const snapshot: LuminaSnapshot = {
        selectedFilter,
        adjustments,
        transform: { ...transform, resize: value },
      };
      void applySnapshot(snapshot);
    },
    [adjustments, applySnapshot, selectedFilter, transform],
  );

  const syncPreview = useCallback(async () => {
    const snapshot: LuminaSnapshot = { selectedFilter, adjustments, transform };
    await applySnapshot(snapshot);
  }, [adjustments, applySnapshot, selectedFilter, transform]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    commitHistoryState(historyRef.current, nextIndex);
    void applySnapshot(snapshot, { pushHistory: false });
  }, [applySnapshot, commitHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    commitHistoryState(historyRef.current, nextIndex);
    void applySnapshot(snapshot, { pushHistory: false });
  }, [applySnapshot, commitHistoryState]);

  const execute = useCallback(async () => {
    if (!file) return null;
    const activePreset =
      filterPresets.find((candidate) => candidate.id === selectedFilter) ?? filterPresets[0];
    if (!activePreset) return null;
    setActiveOperations((prev) => ({ ...prev, isExecuting: true }));
    try {
      return await canvas.execute({
        file,
        ops: activePreset.ops,
        adjustments,
        transform,
        mimeType: outputMimeType,
      });
    } finally {
      setActiveOperations((prev) => ({ ...prev, isExecuting: false }));
    }
  }, [adjustments, canvas, file, filterPresets, outputMimeType, selectedFilter, transform]);

  const value = useMemo<LuminaEditorContextValue>(
    () => ({
      config: {
        filterPresets,
        outputMimeType,
        styleLibrary,
        inlineStyles,
      },
      file,
      previewUrl,
      activeOperations,
      selectedFilter,
      adjustments,
      transform,
      filterPresets,
      thumbnails,
      slotClassNames,
      slotStyles,
      canUndo: historyIndex > 0,
      canRedo: historyIndex >= 0 && historyIndex < history.length - 1,
      setFile,
      setCrop,
      setResize,
      selectFilter,
      setAdjustment,
      undo,
      redo,
      execute,
      syncPreview,
    }),
    [
      activeOperations,
      adjustments,
      filterPresets,
      outputMimeType,
      styleLibrary,
      inlineStyles,
      execute,
      file,
      history.length,
      historyIndex,
      previewUrl,
      redo,
      selectFilter,
      setAdjustment,
      setCrop,
      setFile,
      setResize,
      syncPreview,
      thumbnails,
      slotClassNames,
      slotStyles,
      transform,
      undo,
      selectedFilter,
    ],
  );

  return <LuminaEditorContext.Provider value={value}>{children}</LuminaEditorContext.Provider>;
}
