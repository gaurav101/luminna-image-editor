/**
 * LuminaEditor — React Image Editor Component
 * Powered by @gks101/luminajs  (https://github.com/gaurav101/LuminaJS)
 *
 * Install:
 *   npm install @gks101/luminajs
 *
 * Usage:
 *   import LuminaEditor from './LuminaEditor';
 *   <LuminaEditor onExport={(dataUrl) => console.log(dataUrl)} />
 *
 * All image processing (filters, adjustments, blur, crop, resize, sharpen,
 * emboss, edge-detection, watermark) is delegated to @gks101/luminajs.
 * This component is responsible for UI, live preview, undo history and export.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, MouseEvent, TouchEvent } from "react";
import { lumina } from "@gks101/luminajs";
import type { Lumina } from "@gks101/luminajs";
import {
  LUMINA_EDITOR_CLASS_PRESETS,
  LUMINA_EDITOR_DEFAULT_CLASS_NAMES,
  LUMINA_EDITOR_STYLE_SLOTS,
} from "../stylePresets";
import type {
  LuminaEditorClassNames,
  LuminaEditorStyleLibrary,
  LuminaEditorStyleSlot,
} from "../stylePresets";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ["filters", "adjust", "transform", "effects"] as const;
type Tab = (typeof TABS)[number];
const DEFAULT_TOOLBAR_ACTIONS = ["undo", "execute", "exportJpg", "loadImage"] as const;
export type LuminaEditorToolbarAction = (typeof DEFAULT_TOOLBAR_ACTIONS)[number];

/**
 * Preset filter combos expressed as lumina chain operations.
 * Each op: { fn: string, arg?: any }  → chain[fn](arg) or chain[fn]()
 */
type LuminaOpName =
  | "grayscale"
  | "sepia"
  | "contrast"
  | "brightness"
  | "sharpen"
  | "emboss"
  | "edgeDetection";

interface FilterOperation {
  fn: LuminaOpName;
  arg?: number;
}

interface FilterPreset {
  id: string;
  label: string;
  ops: FilterOperation[];
}
export type LuminaEditorFilterPreset = FilterPreset;
export type LuminaEditorTab = Tab;

const FILTER_PRESETS: FilterPreset[] = [
  { id: "none", label: "Original", ops: [] },
  { id: "grayscale", label: "Grayscale", ops: [{ fn: "grayscale" }] },
  { id: "sepia", label: "Sepia", ops: [{ fn: "sepia" }] },
  {
    id: "vintage",
    label: "Vintage",
    ops: [{ fn: "sepia" }, { fn: "contrast", arg: -15 }, { fn: "brightness", arg: 10 }],
  },
  {
    id: "warm",
    label: "Warm",
    ops: [
      { fn: "brightness", arg: 15 },
      { fn: "contrast", arg: 10 },
    ],
  },
  {
    id: "cool",
    label: "Cool",
    ops: [
      { fn: "contrast", arg: 10 },
      { fn: "brightness", arg: -10 },
    ],
  },
  { id: "sharpen", label: "Sharp", ops: [{ fn: "sharpen" }] },
  { id: "emboss", label: "Emboss", ops: [{ fn: "emboss" }] },
  { id: "edges", label: "Edges", ops: [{ fn: "edgeDetection" }] },
  {
    id: "dramatic",
    label: "Dramatic",
    ops: [
      { fn: "contrast", arg: 40 },
      { fn: "brightness", arg: -20 },
    ],
  },
];

export interface LuminaEditorAdjustmentState {
  brightness: number;
  contrast: number;
  blur: number;
  gaussianBlur: number;
}

interface CropState {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LuminaEditorEffectsState {
  sharpen: boolean;
  emboss: boolean;
  edgeDetection: boolean;
  watermarkText: string;
  watermarkX: number;
  watermarkY: number;
}

interface ResizeDims {
  w: number | "";
  h: number | "";
  lock: boolean;
}

interface ImageDims {
  w: number;
  h: number;
}

interface PreviewTransform {
  scale: number;
  tx: number;
  ty: number;
}

interface HistorySnapshot {
  file: File | null;
  selectedFilter: string;
  adj: AdjustmentState;
  fx: EffectsState;
  cropState: CropState;
}

interface NotificationState {
  msg: string;
  type: "info" | "success" | "error";
}

type CropHandle = "move" | "nw" | "ne" | "sw" | "se";

type AdjustmentState = LuminaEditorAdjustmentState;
type EffectsState = LuminaEditorEffectsState;

const DEFAULT_ADJ: AdjustmentState = { brightness: 0, contrast: 0, blur: 0, gaussianBlur: 0 };
const DEFAULT_CROP: CropState = { x: 0, y: 0, w: 100, h: 100 };
const DEFAULT_FX: EffectsState = {
  sharpen: false,
  emboss: false,
  edgeDetection: false,
  watermarkText: "",
  watermarkX: 20,
  watermarkY: 20,
};
const DEFAULT_PREVIEW_TRANSFORM: PreviewTransform = { scale: 1, tx: 0, ty: 0 };

export type LuminaEditorStyles = Partial<Record<LuminaEditorStyleSlot, CSSProperties>>;
export type LuminaEditorLayout = "sidebar" | "toolbar";
export type LuminaEditorControlsPosition = "top" | "bottom";
export type LuminaEditorOutputFormat = "png" | "jpg" | "jpeg" | "webp" | (string & {});

export interface LuminaEditorExecuteOptions {
  format?: LuminaEditorOutputFormat;
  fileName?: string;
  download?: boolean;
}

export interface LuminaEditorProcessedImage {
  dataUrl: string;
  blob: Blob;
  file: File;
  objectUrl: string;
  revokeObjectUrl: () => void;
  format: LuminaEditorOutputFormat;
  mimeType: string;
  fileName: string;
  width: number;
  height: number;
  selectedFilter: string;
  adjustments: AdjustmentState;
  effects: EffectsState;
}

export interface LuminaEditorHandle {
  execute: (options?: LuminaEditorExecuteOptions) => Promise<LuminaEditorProcessedImage | null>;
}

export interface LuminaEditorProps {
  onExport?: (dataUrl: string) => void;
  onExecute?: (
    processedImage: LuminaEditorProcessedImage,
    options: Required<LuminaEditorExecuteOptions>,
  ) => void | Promise<void>;
  executeLabel?: string;
  executeFormat?: LuminaEditorOutputFormat;
  autoDownload?: boolean;
  styleLibrary?: LuminaEditorStyleLibrary;
  classNames?: LuminaEditorClassNames;
  styles?: LuminaEditorStyles;
  inlineStyles?: boolean;
  className?: string;
  style?: CSSProperties;
  layout?: LuminaEditorLayout;
  controlsPosition?: LuminaEditorControlsPosition;
  responsive?: boolean;
  mobileBreakpoint?: number;
  fullScreen?: boolean;
  height?: CSSProperties["height"];
  minHeight?: CSSProperties["minHeight"];
  maxHeight?: CSSProperties["maxHeight"];
  panelWidth?: CSSProperties["width"];
  tabs?: LuminaEditorTab[];
  toolbarActions?: LuminaEditorToolbarAction[];
  filterPresets?: LuminaEditorFilterPreset[];
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function mergeClassNames(
  ...maps: Array<Partial<Record<LuminaEditorStyleSlot, string>> | undefined>
) {
  const merged: Record<LuminaEditorStyleSlot, string> = { ...LUMINA_EDITOR_DEFAULT_CLASS_NAMES };
  for (const map of maps) {
    if (!map) continue;
    for (const slot of LUMINA_EDITOR_STYLE_SLOTS) merged[slot] = cx(merged[slot], map[slot]);
  }
  return merged;
}

// ─── Helper: run the full lumina processing chain ────────────────────────────

type ImageSource = Parameters<typeof lumina>[0];

function applyFilterOp(chain: Lumina, op: FilterOperation): Lumina {
  if (op.fn === "brightness" || op.fn === "contrast") {
    return chain[op.fn](op.arg ?? 0);
  }
  return chain[op.fn]();
}

async function runChain(
  source: ImageSource,
  presetOps: FilterOperation[],
  adj: AdjustmentState,
  fx: EffectsState,
  mimeType = "image/png",
) {
  let chain = lumina(source);

  // 1. preset filter ops
  for (const op of presetOps) {
    chain = applyFilterOp(chain, op);
  }

  // 2. manual adjustments
  if (adj.brightness !== 0) chain = chain.brightness(adj.brightness);
  if (adj.contrast !== 0) chain = chain.contrast(adj.contrast);
  if (adj.gaussianBlur > 0) chain = chain.gaussianBlur(adj.gaussianBlur);
  else if (adj.blur > 0) chain = chain.blur(Math.round(adj.blur));

  // 3. convolution effects
  if (fx.sharpen) chain = chain.sharpen();
  if (fx.emboss) chain = chain.emboss();
  if (fx.edgeDetection) chain = chain.edgeDetection();

  // 4. watermark
  if (fx.watermarkText)
    chain = chain.watermark(fx.watermarkText, {
      x: fx.watermarkX,
      y: fx.watermarkY,
      font: "24px sans-serif",
      color: "rgba(255,255,255,0.6)",
    });

  return chain.toDataURL(mimeType);
}

function getMimeType(format: LuminaEditorOutputFormat) {
  const normalized = format.toLowerCase();
  if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
  if (normalized === "webp") return "image/webp";
  if (normalized.includes("/")) return normalized;
  return `image/${normalized || "png"}`;
}

function getFileExtension(format: LuminaEditorOutputFormat) {
  const normalized = format.toLowerCase();
  if (normalized.includes("/")) return normalized.split("/").at(-1) || "png";
  return normalized || "png";
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata = "", data = ""] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?)(;|$)/)?.[1] || "application/octet-stream";
  const isBase64 = metadata.includes(";base64");
  const binary = isBase64 ? window.atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

// ─── Helper: 80×80 filter thumbnail ─────────────────────────────────────────

async function buildThumb(source: ImageSource, ops: FilterOperation[]) {
  let chain = lumina(source).resize(48, 48);
  for (const op of ops) {
    chain = applyFilterOp(chain, op);
  }
  return chain.toDataURL("image/png");
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LuminaEditor = forwardRef<LuminaEditorHandle, LuminaEditorProps>(function LuminaEditor(
  {
    onExport,
    onExecute,
    executeLabel = "⬇ PNG",
    executeFormat = "png",
    autoDownload = true,
    styleLibrary = "lumina",
    classNames,
    styles,
    inlineStyles = true,
    className,
    style,
    layout = "sidebar",
    controlsPosition = "bottom",
    responsive = true,
    mobileBreakpoint = 760,
    fullScreen = true,
    height,
    minHeight,
    maxHeight,
    panelWidth = 290,
    tabs = [...TABS],
    toolbarActions = [...DEFAULT_TOOLBAR_ACTIONS],
    filterPresets = FILTER_PRESETS,
  },
  ref,
) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("filters");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [adj, setAdj] = useState(DEFAULT_ADJ);
  const [fx, setFx] = useState(DEFAULT_FX);
  const [cropState, setCropState] = useState(DEFAULT_CROP);
  const [resizeDims, setResizeDims] = useState<ResizeDims>({ w: "", h: "", lock: true });
  const [imgDims, setImgDims] = useState<ImageDims>({ w: 0, h: 0 });
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [previewTransform, setPreviewTransform] =
    useState<PreviewTransform>(DEFAULT_PREVIEW_TRANSFORM);
  const availableTabs = useMemo(() => {
    const valid = tabs.filter((tab): tab is Tab => TABS.includes(tab));
    return valid.length ? valid : [...TABS];
  }, [tabs]);
  const availableToolbarActions = useMemo(() => {
    const valid = toolbarActions.filter((action): action is LuminaEditorToolbarAction =>
      DEFAULT_TOOLBAR_ACTIONS.includes(action),
    );
    return valid.length ? valid : [...DEFAULT_TOOLBAR_ACTIONS];
  }, [toolbarActions]);
  const availableFilterPresets = useMemo(() => {
    const unique = new Set<string>();
    const valid = filterPresets.filter((preset) => {
      if (!preset.id || unique.has(preset.id)) return false;
      unique.add(preset.id);
      return true;
    });
    return valid.length ? valid : FILTER_PRESETS;
  }, [filterPresets]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropOverlayRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    handle: CropHandle;
    startCrop: CropState;
    startXY: { rx: number; ry: number };
  } | null>(null);
  // Track current render to avoid stale async updates
  const renderIdRef = useRef(0);
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startMidX: number;
    startMidY: number;
    startTx: number;
    startTy: number;
    panning: boolean;
    panStartX: number;
    panStartY: number;
  } | null>(null);
  const classes = useMemo(
    () => mergeClassNames(LUMINA_EDITOR_CLASS_PRESETS[styleLibrary], classNames),
    [styleLibrary, classNames],
  );

  const cn = useCallback(
    (slot: LuminaEditorStyleSlot, ...extra: Array<string | false | null | undefined>) =>
      cx(classes[slot], ...extra),
    [classes],
  );
  const sx = useCallback(
    (slot: LuminaEditorStyleSlot, extra?: CSSProperties): CSSProperties =>
      inlineStyles ? { ...S[slot], ...styles?.[slot], ...extra } : { ...styles?.[slot], ...extra },
    [inlineStyles, styles],
  );
  const sxVariant = useCallback(
    (
      slot: LuminaEditorStyleSlot,
      variantSlot: LuminaEditorStyleSlot,
      active: boolean,
      extra?: CSSProperties,
    ): CSSProperties =>
      inlineStyles
        ? {
            ...S[slot],
            ...(active ? S[variantSlot] : {}),
            ...styles?.[slot],
            ...(active ? styles?.[variantSlot] : {}),
            ...extra,
          }
        : { ...styles?.[slot], ...(active ? styles?.[variantSlot] : {}), ...extra },
    [inlineStyles, styles],
  );
  const effectiveLayout: LuminaEditorLayout = responsive && isCompactViewport ? "toolbar" : layout;
  const isToolbarLayout = effectiveLayout === "toolbar";
  const controlsOnTop = isToolbarLayout && controlsPosition === "top";
  const rootLayoutStyle: CSSProperties = {
    height,
    minHeight: minHeight ?? (fullScreen ? "100vh" : undefined),
    maxHeight,
  };
  const bodyLayoutStyle: CSSProperties = {
    flexDirection: isToolbarLayout ? "column" : "row",
    overflow: fullScreen ? "hidden" : "visible",
  };
  const canvasLayoutStyle: CSSProperties = {
    order: controlsOnTop ? 2 : 1,
    minHeight: isToolbarLayout ? (isCompactViewport ? "52svh" : 360) : undefined,
    overflow: isToolbarLayout || !fullScreen ? "visible" : "hidden",
  };
  const panelLayoutStyle: CSSProperties = isToolbarLayout
    ? {
        order: controlsOnTop ? 1 : 2,
        width: "100%",
        minWidth: 0,
        maxHeight: isCompactViewport ? "none" : 260,
        borderLeft: "none",
        borderTop: controlsOnTop ? "none" : "1px solid rgba(255,255,255,0.07)",
        borderBottom: controlsOnTop ? "1px solid rgba(255,255,255,0.07)" : "none",
      }
    : {
        width: panelWidth,
        minWidth: panelWidth,
      };
  const panelBodyLayoutStyle: CSSProperties = {
    maxHeight: isToolbarLayout ? (isCompactViewport ? "none" : 210) : undefined,
    padding: isToolbarLayout ? 12 : undefined,
  };
  const previewWrapLayoutStyle: CSSProperties = {
    maxHeight: isToolbarLayout ? (isCompactViewport ? "52svh" : "calc(100vh - 320px)") : undefined,
  };
  const previewImgLayoutStyle: CSSProperties = {
    maxHeight: isToolbarLayout ? (isCompactViewport ? "52svh" : "calc(100vh - 340px)") : undefined,
  };
  const gridLayoutStyle: CSSProperties = {
    gridTemplateColumns: isToolbarLayout ? "repeat(auto-fit, minmax(118px, 1fr))" : undefined,
  };
  const cropHandleSize = isCompactViewport ? 22 : 14;
  const cropHandleOffset = cropHandleSize / 2;

  useEffect(() => {
    if (!responsive || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setIsCompactViewport(false);
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const updateViewport = () => setIsCompactViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, [mobileBreakpoint, responsive]);

  // ── Notify ────────────────────────────────────────────────────────────────
  const notify = (msg: string, type: NotificationState["type"] = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  };

  // ── Render preview whenever edits change ──────────────────────────────────
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) setActiveTab(availableTabs[0] ?? "filters");
  }, [activeTab, availableTabs]);

  useEffect(() => {
    if (!availableFilterPresets.some((preset) => preset.id === selectedFilter)) {
      setSelectedFilter(availableFilterPresets[0]?.id ?? "none");
    }
  }, [availableFilterPresets, selectedFilter]);

  useEffect(() => {
    if (!file) return;
    const ops = availableFilterPresets.find((f) => f.id === selectedFilter)?.ops ?? [];
    const id = ++renderIdRef.current;
    setLoading(true);
    runChain(file, ops, adj, fx)
      .then((url) => {
        if (renderIdRef.current === id) {
          setPreviewUrl(url);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [file, selectedFilter, adj, fx, availableFilterPresets]);

  // ── Load image ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (f?: File) => {
    if (!f || !f.type.startsWith("image/")) {
      notify("Please select a valid image", "error");
      return;
    }
    // Reset all state
    setFile(f);
    setSelectedFilter("none");
    setAdj(DEFAULT_ADJ);
    setFx(DEFAULT_FX);
    setCropState(DEFAULT_CROP);
    setPreviewTransform(DEFAULT_PREVIEW_TRANSFORM);
    setHistory([]);
    setHistIdx(-1);
    setThumbs({});

    // Get natural size
    const url = await lumina(f).toDataURL();
    const img = new Image();
    img.onload = () => {
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      setResizeDims({ w: img.naturalWidth, h: img.naturalHeight, lock: true });
    };
    img.src = url;

    // Build thumbnails in background
    for (const preset of availableFilterPresets) {
      void buildThumb(f, preset.ops).then((dataUrl) =>
        setThumbs((t) => ({ ...t, [preset.id]: dataUrl })),
      );
    }
  }, [availableFilterPresets]);

  // ── History ───────────────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    setHistory((h) => {
      const snap = {
        file,
        selectedFilter,
        adj: { ...adj },
        fx: { ...fx },
        cropState: { ...cropState },
      };
      return [...h.slice(0, histIdx + 1), snap];
    });
    setHistIdx((i) => i + 1);
  }, [file, selectedFilter, adj, fx, cropState, histIdx]);

  const doUndo = useCallback(() => {
    if (histIdx <= 0) return;
    const snap = history[histIdx - 1];
    if (!snap) return;
    setFile(snap.file);
    setSelectedFilter(snap.selectedFilter);
    setAdj(snap.adj);
    setFx(snap.fx);
    setCropState(snap.cropState);
    setHistIdx((i) => i - 1);
    notify("Undo ↩");
  }, [history, histIdx]);

  // ── Apply crop via lumina.crop ────────────────────────────────────────────
  const applyCrop = useCallback(async () => {
    if (!file || !previewUrl) return;
    const img = new Image();
    img.src = previewUrl;
    await new Promise((res) => {
      img.onload = res;
    });
    const srcW = img.naturalWidth,
      srcH = img.naturalHeight;
    const cx = Math.round((cropState.x / 100) * srcW);
    const cy = Math.round((cropState.y / 100) * srcH);
    const cw = Math.round((cropState.w / 100) * srcW);
    const ch = Math.round((cropState.h / 100) * srcH);
    if (cw < 10 || ch < 10) {
      notify("Crop area too small", "error");
      return;
    }
    pushHistory();
    const blob = await lumina(file).crop(cx, cy, cw, ch).toBlob("image/png");
    setFile(new File([blob], "lumina-crop.png", { type: blob.type || "image/png" }));
    setImgDims({ w: cw, h: ch });
    setResizeDims({ w: cw, h: ch, lock: true });
    setCropState(DEFAULT_CROP);
    notify("Crop applied ✓", "success");
  }, [file, previewUrl, cropState, pushHistory]);

  // ── Apply resize via lumina.resize ────────────────────────────────────────
  const applyResize = useCallback(async () => {
    if (!file) return;
    const nw = Number.parseInt(String(resizeDims.w), 10);
    const nh = Number.parseInt(String(resizeDims.h), 10);
    if (!nw || !nh || nw < 1 || nh < 1) {
      notify("Enter valid dimensions", "error");
      return;
    }
    pushHistory();
    const blob = await lumina(file).resize(nw, nh).toBlob("image/png");
    setFile(new File([blob], "lumina-resize.png", { type: blob.type || "image/png" }));
    setImgDims({ w: nw, h: nh });
    setResizeDims({ w: nw, h: nh, lock: resizeDims.lock });
    notify(`Resized to ${nw}×${nh} ✓`, "success");
  }, [file, resizeDims, pushHistory]);

  // ── Execute processed image action ────────────────────────────────────────
  const execute = useCallback(
    async (options: LuminaEditorExecuteOptions = {}) => {
      if (!file) return null;

      const format = options.format ?? executeFormat;
      const mimeType = getMimeType(format);
      const extension = getFileExtension(format);
      const fileName = options.fileName ?? `lumina-export.${extension}`;
      const shouldDownload = options.download ?? autoDownload;
      const ops = availableFilterPresets.find((f) => f.id === selectedFilter)?.ops ?? [];
      const dataUrl = await runChain(file, ops, adj, fx, mimeType);
      const blob = dataUrlToBlob(dataUrl);
      const outputFile = new File([blob], fileName, { type: blob.type || mimeType });
      const objectUrl = URL.createObjectURL(blob);
      const processedImage: LuminaEditorProcessedImage = {
        dataUrl,
        blob,
        file: outputFile,
        objectUrl,
        revokeObjectUrl: () => URL.revokeObjectURL(objectUrl),
        format,
        mimeType,
        fileName,
        width: imgDims.w,
        height: imgDims.h,
        selectedFilter,
        adjustments: { ...adj },
        effects: { ...fx },
      };
      const normalizedOptions: Required<LuminaEditorExecuteOptions> = {
        format,
        fileName,
        download: shouldDownload,
      };

      if (shouldDownload) downloadDataUrl(dataUrl, fileName);
      await onExecute?.(processedImage, normalizedOptions);
      onExport?.(dataUrl);

      return processedImage;
    },
    [
      adj,
      autoDownload,
      executeFormat,
      file,
      fx,
      imgDims,
      onExecute,
      onExport,
      selectedFilter,
      availableFilterPresets,
    ],
  );

  useImperativeHandle(ref, () => ({ execute }), [execute]);

  const handleExecute = useCallback(
    async (format: LuminaEditorOutputFormat = executeFormat) => {
      if (!file) return;
      setExporting(true);
      try {
        await execute({ format });
        notify(autoDownload ? "Exported ✓" : "Processed image ready ✓", "success");
      } catch {
        notify("Could not process image", "error");
      } finally {
        setExporting(false);
      }
    },
    [autoDownload, execute, executeFormat, file],
  );

  // ── Crop drag ─────────────────────────────────────────────────────────────
  const getRelPct = (
    e:
      | MouseEvent<HTMLElement>
      | TouchEvent<HTMLElement>
      | globalThis.MouseEvent
      | globalThis.TouchEvent,
    el: HTMLElement,
  ) => {
    const r = el.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    if (!point) return { rx: 0, ry: 0 };
    const cx = point.clientX;
    const cy = point.clientY;
    return {
      rx: Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)),
      ry: Math.max(0, Math.min(100, ((cy - r.top) / r.height) * 100)),
    };
  };
  const startCropDrag = (
    e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>,
    handle: CropHandle,
  ) => {
    if (!cropOverlayRef.current) return;
    e.preventDefault();
    dragRef.current = {
      handle,
      startCrop: { ...cropState },
      startXY: getRelPct(e, cropOverlayRef.current),
    };
    e.stopPropagation();
  };
  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!dragRef.current || !cropOverlayRef.current) return;
      if (e.cancelable) e.preventDefault();
      const { rx, ry } = getRelPct(e, cropOverlayRef.current);
      const { handle, startCrop, startXY } = dragRef.current;
      const dx = rx - startXY.rx,
        dy = ry - startXY.ry;
      let { x, y, w, h } = startCrop;
      if (handle === "move") {
        x = Math.max(0, Math.min(100 - w, x + dx));
        y = Math.max(0, Math.min(100 - h, y + dy));
      } else if (handle === "se") {
        w = Math.max(5, Math.min(100 - x, w + dx));
        h = Math.max(5, Math.min(100 - y, h + dy));
      } else if (handle === "nw") {
        const nx = Math.min(x + w - 5, x + dx),
          ny = Math.min(y + h - 5, y + dy);
        w = w - (nx - x);
        h = h - (ny - y);
        x = nx;
        y = ny;
      } else if (handle === "ne") {
        w = Math.max(5, w + dx);
        const ny = Math.min(y + h - 5, y + dy);
        h = h - (ny - y);
        y = ny;
      } else if (handle === "sw") {
        h = Math.max(5, h + dy);
        const nx = Math.min(x + w - 5, x + dx);
        w = w - (nx - x);
        x = nx;
      }
      setCropState({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        w: Math.round(w * 10) / 10,
        h: Math.round(h * 10) / 10,
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [cropState]);

  const handleResizeDim = (dim: "w" | "h", val: string) => {
    const n = Number.parseInt(val, 10) || 0;
    if (resizeDims.lock && imgDims.w && imgDims.h) {
      const ratio = imgDims.w / imgDims.h;
      if (dim === "w") setResizeDims((d) => ({ ...d, w: n, h: Math.round(n / ratio) }));
      else setResizeDims((d) => ({ ...d, h: n, w: Math.round(n * ratio) }));
    } else {
      setResizeDims((d) => ({ ...d, [dim]: n }));
    }
  };

  const clampPreviewOffset = useCallback((scale: number, tx: number, ty: number) => {
    const wrap = previewWrapRef.current;
    if (!wrap || scale <= 1) return { tx: 0, ty: 0 };
    const maxX = ((scale - 1) * wrap.clientWidth) / 2;
    const maxY = ((scale - 1) * wrap.clientHeight) / 2;
    return {
      tx: Math.max(-maxX, Math.min(maxX, tx)),
      ty: Math.max(-maxY, Math.min(maxY, ty)),
    };
  }, []);

  const getTouchDistance = (
    a: { clientX: number; clientY: number },
    b: { clientX: number; clientY: number },
  ) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

  const startPreviewTouch = (e: TouchEvent<HTMLDivElement>) => {
    if (activeTab === "transform") return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      if (!a || !b) return;
      pinchRef.current = {
        startDistance: getTouchDistance(a, b),
        startScale: previewTransform.scale,
        startMidX: (a.clientX + b.clientX) / 2,
        startMidY: (a.clientY + b.clientY) / 2,
        startTx: previewTransform.tx,
        startTy: previewTransform.ty,
        panning: false,
        panStartX: 0,
        panStartY: 0,
      };
    } else if (e.touches.length === 1 && previewTransform.scale > 1) {
      const touch = e.touches[0];
      if (!touch) return;
      pinchRef.current = {
        startDistance: 0,
        startScale: previewTransform.scale,
        startMidX: 0,
        startMidY: 0,
        startTx: previewTransform.tx,
        startTy: previewTransform.ty,
        panning: true,
        panStartX: touch.clientX,
        panStartY: touch.clientY,
      };
      e.preventDefault();
    }
  };

  const movePreviewTouch = (e: TouchEvent<HTMLDivElement>) => {
    if (activeTab === "transform" || !pinchRef.current) return;
    if (e.touches.length === 2 && pinchRef.current.startDistance > 0) {
      const [a, b] = [e.touches[0], e.touches[1]];
      if (!a || !b) return;
      const currentDistance = getTouchDistance(a, b);
      const nextScale = Math.max(
        1,
        Math.min(
          3,
          (currentDistance / pinchRef.current.startDistance) * pinchRef.current.startScale,
        ),
      );
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      const driftX = midX - pinchRef.current.startMidX;
      const driftY = midY - pinchRef.current.startMidY;
      const clamped = clampPreviewOffset(
        nextScale,
        pinchRef.current.startTx + driftX,
        pinchRef.current.startTy + driftY,
      );
      setPreviewTransform({ scale: nextScale, tx: clamped.tx, ty: clamped.ty });
      e.preventDefault();
      return;
    }

    if (e.touches.length === 1 && pinchRef.current.panning) {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - pinchRef.current.panStartX;
      const dy = touch.clientY - pinchRef.current.panStartY;
      const clamped = clampPreviewOffset(
        previewTransform.scale,
        pinchRef.current.startTx + dx,
        pinchRef.current.startTy + dy,
      );
      setPreviewTransform((prev) => ({ ...prev, tx: clamped.tx, ty: clamped.ty }));
      e.preventDefault();
    }
  };

  const endPreviewTouch = () => {
    if (previewTransform.scale <= 1.01) {
      setPreviewTransform(DEFAULT_PREVIEW_TRANSFORM);
    }
    pinchRef.current = null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cx(cn("root"), className)} style={sx("root", { ...rootLayoutStyle, ...style })}>
      {/* Header */}
      <header className={cn("header")} style={sx("header")}>
        <div className={cn("logo")} style={sx("logo")}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#7C6FF7" strokeWidth="1.5" />
            <path d="M7 11 Q11 5 15 11 Q11 17 7 11Z" fill="#7C6FF7" opacity="0.8" />
            <circle cx="11" cy="11" r="2" fill="#fff" />
          </svg>
          <span className={cn("logoText")} style={sx("logoText")}>
            LuminaEditor
          </span>
          <span className={cn("badge")} style={sx("badge")}>
            @gks101/luminajs
          </span>
        </div>
        <div className={cn("headerRight")} style={sx("headerRight")}>
          {file && (
            <>
              {availableToolbarActions.includes("undo") && (
                <button
                  className={cn("btnSm")}
                  style={sx("btnSm")}
                  onClick={doUndo}
                  disabled={histIdx <= 0}
                >
                  ↩ Undo
                </button>
              )}
              {availableToolbarActions.includes("execute") && (
                <button
                  className={cn("btnPrimary")}
                  style={sx("btnPrimary")}
                  onClick={() => void handleExecute(executeFormat)}
                  disabled={exporting || loading}
                >
                  {exporting ? "Processing…" : executeLabel}
                </button>
              )}
              {availableToolbarActions.includes("exportJpg") && (
                <button
                  className={cn("btnSm")}
                  style={sx("btnSm")}
                  onClick={() => void handleExecute("jpg")}
                  disabled={exporting || loading}
                >
                  JPG
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div
          className={cn("notif", `lumina-editor__notif--${notification.type}`)}
          style={sx("notif", {
            background:
              notification.type === "error"
                ? "#fee2e2"
                : notification.type === "success"
                  ? "#d1fae5"
                  : "#ede9fe",
          })}
        >
          <span
            style={{
              color:
                notification.type === "error"
                  ? "#b91c1c"
                  : notification.type === "success"
                    ? "#065f46"
                    : "#4c1d95",
              fontSize: 13,
            }}
          >
            {notification.msg}
          </span>
        </div>
      )}

      <div
        className={cn("body", isToolbarLayout && "is-toolbar-layout")}
        style={sx("body", bodyLayoutStyle)}
      >
        {/* Canvas area */}
        <div
          className={cn("canvasArea")}
          style={sx("canvasArea", canvasLayoutStyle)}
          onDrop={(e) => {
            e.preventDefault();
            void handleFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {!file ? (
            <div
              className={cn("dropzone")}
              style={sx("dropzone")}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className={cn("dropIcon")}
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                style={sx("dropIcon")}
              >
                <rect width="48" height="48" rx="12" fill="#7C6FF7" opacity="0.15" />
                <path
                  d="M24 16v16M16 24l8-8 8 8"
                  stroke="#7C6FF7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M14 34h20" stroke="#7C6FF7" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className={cn("dropTitle")} style={sx("dropTitle")}>
                Drop an image here
              </p>
              <p className={cn("dropSub")} style={sx("dropSub")}>
                or click to browse · PNG, JPG, WEBP, GIF
              </p>
            </div>
          ) : (
            <div
              ref={previewWrapRef}
              className={cn("previewWrap")}
              style={sx("previewWrap", previewWrapLayoutStyle)}
              onTouchStart={startPreviewTouch}
              onTouchMove={movePreviewTouch}
              onTouchEnd={endPreviewTouch}
              onTouchCancel={endPreviewTouch}
            >
              {loading && (
                <div className={cn("loadingOverlay")} style={sx("loadingOverlay")}>
                  <span className={cn("spinner")} style={sx("spinner")} /> Processing with LuminaJS…
                </div>
              )}
              {previewUrl && (
                <img
                  className={cn("previewImg")}
                  src={previewUrl}
                  alt="Preview"
                  style={sx("previewImg", {
                    ...previewImgLayoutStyle,
                    opacity: loading ? 0.4 : 1,
                    transform: `translate(${previewTransform.tx}px, ${previewTransform.ty}px) scale(${previewTransform.scale})`,
                    transformOrigin: "center center",
                    transition: pinchRef.current ? "none" : "opacity 0.2s, transform 0.2s",
                    touchAction: activeTab === "transform" ? "auto" : "none",
                  })}
                />
              )}

              {/* Crop overlay shown only on Transform tab */}
              {activeTab === "transform" && (
                <div ref={cropOverlayRef} className={cn("cropOverlay")} style={sx("cropOverlay")}>
                  <svg
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
                  >
                    <defs>
                      <mask id="cm">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                          x={`${cropState.x}%`}
                          y={`${cropState.y}%`}
                          width={`${cropState.w}%`}
                          height={`${cropState.h}%`}
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cm)" />
                    <rect
                      x={`${cropState.x}%`}
                      y={`${cropState.y}%`}
                      width={`${cropState.w}%`}
                      height={`${cropState.h}%`}
                      fill="none"
                      stroke="#7C6FF7"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    {[1 / 3, 2 / 3].map((t, i) => (
                      <g key={i}>
                        <line
                          x1={`${cropState.x + cropState.w * t}%`}
                          y1={`${cropState.y}%`}
                          x2={`${cropState.x + cropState.w * t}%`}
                          y2={`${cropState.y + cropState.h}%`}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.5"
                        />
                        <line
                          x1={`${cropState.x}%`}
                          y1={`${cropState.y + cropState.h * t}%`}
                          x2={`${cropState.x + cropState.w}%`}
                          y2={`${cropState.y + cropState.h * t}%`}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.5"
                        />
                      </g>
                    ))}
                  </svg>
                  {/* Move handle */}
                  <div
                    className={cn("cropBox")}
                    style={sx("cropBox", {
                      left: `${cropState.x}%`,
                      top: `${cropState.y}%`,
                      width: `${cropState.w}%`,
                      height: `${cropState.h}%`,
                    })}
                    onMouseDown={(e) => startCropDrag(e, "move")}
                    onTouchStart={(e) => startCropDrag(e, "move")}
                  />
                  {/* Corner handles */}
                  {[
                    { id: "nw", tx: cropState.x, ty: cropState.y },
                    { id: "ne", tx: cropState.x + cropState.w, ty: cropState.y },
                    { id: "sw", tx: cropState.x, ty: cropState.y + cropState.h },
                    { id: "se", tx: cropState.x + cropState.w, ty: cropState.y + cropState.h },
                  ].map((hd) => (
                    <div
                      key={hd.id}
                      onMouseDown={(e) => startCropDrag(e, hd.id as CropHandle)}
                      onTouchStart={(e) => startCropDrag(e, hd.id as CropHandle)}
                      className={cn("cropHandle", `lumina-editor__cropHandle--${hd.id}`)}
                      style={sx("cropHandle", {
                        left: `calc(${hd.tx}% - ${cropHandleOffset}px)`,
                        top: `calc(${hd.ty}% - ${cropHandleOffset}px)`,
                        width: cropHandleSize,
                        height: cropHandleSize,
                        cursor: hd.id === "nw" || hd.id === "se" ? "nwse-resize" : "nesw-resize",
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {file && availableToolbarActions.includes("loadImage") && (
            <button
              className={cn("changeBtn")}
              style={sx("changeBtn")}
              onClick={() => fileInputRef.current?.click()}
            >
              ↑ Load new image
            </button>
          )}
        </div>

        {/* Side Panel */}
        {file && (
          <div
            className={cn("panel", isToolbarLayout && "is-toolbar-panel")}
            style={sx("panel", panelLayoutStyle)}
          >
            <div className={cn("tabs")} style={sx("tabs")}>
              {availableTabs.map((t) => (
                <button
                  key={t}
                  className={cn(
                    "tab",
                    activeTab === t && "is-active",
                    activeTab === t && classes.tabActive,
                  )}
                  style={sxVariant("tab", "tabActive", activeTab === t)}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className={cn("panelBody")} style={sx("panelBody", panelBodyLayoutStyle)}>
              {/* ─── FILTERS ─── */}
              {activeTab === "filters" && (
                <>
                  <p className={cn("plabel")} style={sx("plabel")}>
                    Presets
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    Applied via lumina() chainable API
                  </p>
                  <div className={cn("filterGrid")} style={sx("filterGrid", gridLayoutStyle)}>
                    {availableFilterPresets.map((f) => (
                      <button
                        key={f.id}
                        className={cn(
                          "fThumb",
                          selectedFilter === f.id && "is-selected",
                          selectedFilter === f.id && classes.fThumbSel,
                        )}
                        style={sxVariant("fThumb", "fThumbSel", selectedFilter === f.id)}
                        onClick={() => {
                          setSelectedFilter(f.id);
                          pushHistory();
                        }}
                      >
                        {thumbs[f.id] ? (
                          <img
                            className={cn("fThumbImg")}
                            src={thumbs[f.id]}
                            alt={f.label}
                            style={sx("fThumbImg")}
                          />
                        ) : (
                          <div className={cn("fThumbPh")} style={sx("fThumbPh")} />
                        )}
                        <span className={cn("fLbl")} style={sx("fLbl")}>
                          {f.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ─── ADJUST ─── */}
              {activeTab === "adjust" && (
                <>
                  <p className={cn("plabel")} style={sx("plabel")}>
                    Adjustments
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    lumina().brightness() / .contrast() / .blur() / .gaussianBlur()
                  </p>
                  {(
                    [
                      { key: "brightness", label: "Brightness", min: -255, max: 255, step: 1 },
                      { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
                      { key: "blur", label: "Box Blur", min: 0, max: 20, step: 1 },
                      { key: "gaussianBlur", label: "Gaussian Blur", min: 0, max: 10, step: 0.5 },
                    ] as const
                  ).map(({ key, label, min, max, step }) => (
                    <div key={key} className={cn("sliderRow")} style={sx("sliderRow")}>
                      <div className={cn("sliderHdr")} style={sx("sliderHdr")}>
                        <span className={cn("sliderLbl")} style={sx("sliderLbl")}>
                          {label}
                        </span>
                        <span className={cn("sliderVal")} style={sx("sliderVal")}>
                          {adj[key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={adj[key]}
                        className={cn("rangeInput")}
                        style={sx("rangeInput")}
                        onChange={(e) => setAdj((a) => ({ ...a, [key]: +e.target.value }))}
                        onMouseUp={pushHistory}
                        onTouchEnd={pushHistory}
                      />
                      <div className={cn("ticks")} style={sx("ticks")}>
                        <span>{min}</span>
                        <span>0</span>
                        <span>{max}</span>
                      </div>
                    </div>
                  ))}
                  <button
                    className={cn("resetBtn")}
                    style={sx("resetBtn")}
                    onClick={() => {
                      setAdj(DEFAULT_ADJ);
                      pushHistory();
                    }}
                  >
                    Reset adjustments
                  </button>
                </>
              )}

              {/* ─── TRANSFORM ─── */}
              {activeTab === "transform" && (
                <>
                  <p className={cn("plabel")} style={sx("plabel")}>
                    Crop
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    Drag handles on preview · uses lumina().crop(x,y,w,h)
                  </p>
                  <div className={cn("cropGrid")} style={sx("cropGrid", gridLayoutStyle)}>
                    {(
                      [
                        { k: "x", l: "Left %", max: 99 },
                        { k: "y", l: "Top %", max: 99 },
                        { k: "w", l: "Width %", max: 100 },
                        { k: "h", l: "Height %", max: 100 },
                      ] as const
                    ).map(({ k, l, max }) => (
                      <div key={k} className={cn("cropField")} style={sx("cropField")}>
                        <label className={cn("cropLbl")} style={sx("cropLbl")}>
                          {l}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={Math.round(cropState[k])}
                          className={cn("numInput")}
                          style={sx("numInput")}
                          onChange={(e) => setCropState((c) => ({ ...c, [k]: +e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={cn("presetBtns")} style={sx("presetBtns")}>
                    <span className={cn("sliderLbl")} style={sx("sliderLbl", { marginRight: 2 })}>
                      Ratio:
                    </span>
                    {(
                      [
                        ["Free", 0, 0, 100, 100],
                        ["1:1", 25, 25, 50, 50],
                        ["16:9", 0, 22, 100, 56],
                        ["4:3", 0, 12, 100, 75],
                        ["3:2", 0, 16, 100, 67],
                      ] as const
                    ).map(([l, ...a]) => (
                      <button
                        key={l}
                        className={cn("presetBtn")}
                        style={sx("presetBtn")}
                        onClick={() => setCropState({ x: a[0], y: a[1], w: a[2], h: a[3] })}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    className={cn("applyBtn")}
                    style={sx("applyBtn")}
                    onClick={() => void applyCrop()}
                    disabled={loading}
                  >
                    ✓ Apply Crop
                  </button>

                  <div className={cn("divider")} style={sx("divider")} />

                  <p className={cn("plabel")} style={sx("plabel")}>
                    Resize
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    Current: {imgDims.w} × {imgDims.h} px · uses lumina().resize(w,h)
                  </p>
                  <div className={cn("cropGrid")} style={sx("cropGrid", gridLayoutStyle)}>
                    <div className={cn("cropField")} style={sx("cropField")}>
                      <label className={cn("cropLbl")} style={sx("cropLbl")}>
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={resizeDims.w}
                        className={cn("numInput")}
                        style={sx("numInput")}
                        onChange={(e) => handleResizeDim("w", e.target.value)}
                      />
                    </div>
                    <div className={cn("cropField")} style={sx("cropField")}>
                      <label className={cn("cropLbl")} style={sx("cropLbl")}>
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={resizeDims.h}
                        className={cn("numInput")}
                        style={sx("numInput")}
                        onChange={(e) => handleResizeDim("h", e.target.value)}
                      />
                    </div>
                  </div>
                  <label className={cn("lockRow")} style={sx("lockRow")}>
                    <input
                      type="checkbox"
                      checked={resizeDims.lock}
                      onChange={(e) => setResizeDims((d) => ({ ...d, lock: e.target.checked }))}
                    />
                    <span className={cn("sliderLbl")} style={sx("sliderLbl")}>
                      Lock aspect ratio
                    </span>
                  </label>
                  <div className={cn("presetBtns")} style={sx("presetBtns", { margin: "10px 0" })}>
                    {(
                      [
                        ["640×480", 640, 480],
                        ["800×600", 800, 600],
                        ["1280×720", 1280, 720],
                        ["1920×1080", 1920, 1080],
                      ] as const
                    ).map(([l, w, h]) => (
                      <button
                        key={l}
                        className={cn("presetBtn")}
                        style={sx("presetBtn")}
                        onClick={() => setResizeDims({ w, h, lock: false })}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    className={cn("applyBtn")}
                    style={sx("applyBtn")}
                    onClick={() => void applyResize()}
                    disabled={loading}
                  >
                    ✓ Apply Resize
                  </button>
                </>
              )}

              {/* ─── EFFECTS ─── */}
              {activeTab === "effects" && (
                <>
                  <p className={cn("plabel")} style={sx("plabel")}>
                    Convolution Effects
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    lumina().sharpen() / .emboss() / .edgeDetection()
                  </p>
                  {(
                    [
                      { key: "sharpen", label: "Sharpen", desc: "Crisp details via convolution" },
                      { key: "emboss", label: "Emboss", desc: "Raised relief look" },
                      { key: "edgeDetection", label: "Edge Detection", desc: "Highlight outlines" },
                    ] as const
                  ).map(({ key, label, desc }) => (
                    <div key={key} className={cn("effectRow")} style={sx("effectRow")}>
                      <div>
                        <div className={cn("sliderLbl")} style={sx("sliderLbl")}>
                          {label}
                        </div>
                        <div className={cn("effectDesc")} style={sx("effectDesc")}>
                          {desc}
                        </div>
                      </div>
                      <label className={cn("toggle")} style={sx("toggle")}>
                        <input
                          type="checkbox"
                          checked={fx[key]}
                          onChange={(e) => {
                            setFx((f) => ({ ...f, [key]: e.target.checked }));
                            pushHistory();
                          }}
                          style={{ display: "none" }}
                        />
                        <div
                          className={cn("toggleTrack", fx[key] && "is-checked")}
                          style={sx("toggleTrack", {
                            background: fx[key] ? "#7C6FF7" : "rgba(255,255,255,0.1)",
                          })}
                        >
                          <div
                            className={cn("toggleThumb")}
                            style={sx("toggleThumb", {
                              transform: fx[key] ? "translateX(16px)" : "translateX(0)",
                            })}
                          />
                        </div>
                      </label>
                    </div>
                  ))}

                  <div className={cn("divider")} style={sx("divider")} />

                  <p className={cn("plabel")} style={sx("plabel")}>
                    Watermark
                  </p>
                  <p className={cn("hint")} style={sx("hint")}>
                    lumina().watermark(text, options)
                  </p>
                  <input
                    type="text"
                    placeholder="© Your Name 2025"
                    value={fx.watermarkText}
                    className={cn("numInput")}
                    style={sx("numInput", { width: "100%", marginBottom: 8 })}
                    onChange={(e) => setFx((f) => ({ ...f, watermarkText: e.target.value }))}
                    onBlur={pushHistory}
                  />
                  <div className={cn("cropGrid")} style={sx("cropGrid")}>
                    <div className={cn("cropField")} style={sx("cropField")}>
                      <label className={cn("cropLbl")} style={sx("cropLbl")}>
                        X position
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={fx.watermarkX}
                        className={cn("numInput")}
                        style={sx("numInput")}
                        onChange={(e) => setFx((f) => ({ ...f, watermarkX: +e.target.value }))}
                      />
                    </div>
                    <div className={cn("cropField")} style={sx("cropField")}>
                      <label className={cn("cropLbl")} style={sx("cropLbl")}>
                        Y position
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={fx.watermarkY}
                        className={cn("numInput")}
                        style={sx("numInput")}
                        onChange={(e) => setFx((f) => ({ ...f, watermarkY: +e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Info bar */}
            <div className={cn("infoBar")} style={sx("infoBar")}>
              <span className={cn("infoPill")} style={sx("infoPill")}>
                {imgDims.w} × {imgDims.h} px
              </span>
              <span className={cn("infoPill")} style={sx("infoPill")}>
                {selectedFilter !== "none" ? selectedFilter : "No filter"}
              </span>
              {loading && (
                <span
                  className={cn("infoPill", "is-loading")}
                  style={sx("infoPill", { color: "#a59df5" })}
                >
                  ⟳ rendering…
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default LuminaEditor;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<LuminaEditorStyleSlot, CSSProperties> = {
  root: {
    fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    background: "#0f0f11",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#e8e6f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "#16151a",
    flexShrink: 0,
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.3px", color: "#f0eeff" },
  badge: {
    fontSize: 10,
    padding: "2px 8px",
    background: "rgba(124,111,247,0.2)",
    color: "#a59df5",
    borderRadius: 20,
    fontWeight: 600,
  },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  btnSm: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#a09ec0",
    cursor: "pointer",
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 500,
  },
  btnPrimary: {
    background: "#7C6FF7",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 600,
  },
  notif: { padding: "7px 20px", textAlign: "center", flexShrink: 0 },
  body: { display: "flex", flex: 1, overflow: "hidden", minHeight: 0 },
  canvasArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
    background: "#0f0f11",
    position: "relative",
    overflow: "hidden",
  },
  dropzone: {
    border: "1.5px dashed rgba(124,111,247,0.4)",
    borderRadius: 16,
    padding: "42px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    background: "rgba(124,111,247,0.04)",
    textAlign: "center",
  },
  dropIcon: { marginBottom: 14, opacity: 0.45 },
  dropTitle: { fontSize: 16, fontWeight: 600, color: "#c4c0e0", margin: "0 0 6px" },
  dropSub: { fontSize: 12, color: "#6b6882", margin: 0 },
  previewWrap: {
    position: "relative",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 180px)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  },
  previewImg: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 220px)",
    objectFit: "contain",
    transition: "opacity 0.2s",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.4)",
    color: "#a59df5",
    fontSize: 13,
    gap: 8,
    zIndex: 5,
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(165,157,245,0.3)",
    borderTopColor: "#7C6FF7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  cropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    touchAction: "none",
    userSelect: "none",
  },
  cropBox: { position: "absolute", cursor: "move", touchAction: "none" },
  cropHandle: {
    position: "absolute",
    width: 14,
    height: 14,
    background: "#7C6FF7",
    borderRadius: 3,
    boxShadow: "0 0 0 2px white",
    zIndex: 10,
    touchAction: "none",
  },
  changeBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#7a7898",
    fontSize: 12,
    cursor: "pointer",
    padding: "5px 14px",
    marginTop: 4,
  },
  panel: {
    width: 250,
    minWidth: 250,
    background: "#16151a",
    borderLeft: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabs: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 },
  tab: {
    flex: 1,
    background: "none",
    border: "none",
    color: "#6b6882",
    fontSize: 10,
    fontWeight: 500,
    padding: "9px 0",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: { color: "#a59df5", borderBottom: "2px solid #7C6FF7" },
  panelBody: { flex: 1, overflowY: "auto", padding: 12 },
  plabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.8px",
    color: "#6b6882",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },
  hint: { fontSize: 10, color: "#5c5a70", margin: "0 0 12px", fontStyle: "italic" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 },
  fThumb: {
    background: "#1d1c24",
    borderWidth: 1.5,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: 4,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  fThumbSel: { borderColor: "#7C6FF7", background: "rgba(124,111,247,0.1)" },
  fThumbImg: { width: "100%", aspectRatio: "1", borderRadius: 4, objectFit: "cover" },
  fThumbPh: { width: "100%", aspectRatio: "1", borderRadius: 4, background: "#2a2830" },
  fLbl: { fontSize: 8, color: "#9490b0", fontWeight: 500 },
  sliderRow: { marginBottom: 12 },
  sliderHdr: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  sliderLbl: { fontSize: 11, color: "#9490b0", fontWeight: 500 },
  sliderVal: { fontSize: 11, color: "#c4c0e0", fontWeight: 600, minWidth: 24, textAlign: "right" },
  rangeInput: { width: "100%", accentColor: "#7C6FF7" },
  ticks: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#4a4860",
    marginTop: 2,
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#6b6882",
    fontSize: 11,
    cursor: "pointer",
    padding: "7px 0",
    width: "100%",
    marginTop: 4,
  },
  cropGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 },
  cropField: { display: "flex", flexDirection: "column", gap: 4 },
  cropLbl: { fontSize: 9, color: "#6b6882", fontWeight: 500 },
  numInput: {
    background: "#1d1c24",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#e8e6f0",
    fontSize: 11,
    padding: "5px 7px",
    boxSizing: "border-box",
  },
  presetBtns: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10, alignItems: "center" },
  presetBtn: {
    background: "#1d1c24",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#9490b0",
    fontSize: 9,
    cursor: "pointer",
    padding: "4px 7px",
    fontWeight: 500,
  },
  applyBtn: {
    background: "#7C6FF7",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "8px 0",
    width: "100%",
    marginTop: 4,
  },
  lockRow: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 4 },
  divider: { borderTop: "1px solid rgba(255,255,255,0.07)", margin: "14px 0 10px" },
  effectRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  effectDesc: { fontSize: 11, color: "#6b6882" },
  toggle: { cursor: "pointer", flexShrink: 0 },
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: "relative",
    transition: "background 0.2s",
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    background: "#fff",
    borderRadius: "50%",
    transition: "transform 0.2s",
  },
  infoBar: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "10px 16px",
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    flexShrink: 0,
  },
  infoPill: {
    fontSize: 10,
    padding: "3px 8px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    color: "#6b6882",
  },
};
