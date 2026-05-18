export const LUMINA_EDITOR_STYLE_SLOTS = [
  "root",
  "header",
  "logo",
  "logoText",
  "badge",
  "headerRight",
  "btnSm",
  "btnPrimary",
  "notif",
  "body",
  "canvasArea",
  "dropzone",
  "dropIcon",
  "dropTitle",
  "dropSub",
  "previewWrap",
  "previewImg",
  "loadingOverlay",
  "spinner",
  "cropOverlay",
  "cropBox",
  "cropHandle",
  "changeBtn",
  "panel",
  "tabs",
  "tab",
  "tabActive",
  "panelBody",
  "plabel",
  "hint",
  "filterGrid",
  "fThumb",
  "fThumbSel",
  "fThumbImg",
  "fThumbPh",
  "fLbl",
  "sliderRow",
  "sliderHdr",
  "sliderLbl",
  "sliderVal",
  "rangeInput",
  "ticks",
  "resetBtn",
  "cropGrid",
  "cropField",
  "cropLbl",
  "numInput",
  "presetBtns",
  "presetBtn",
  "applyBtn",
  "lockRow",
  "divider",
  "effectRow",
  "effectDesc",
  "toggle",
  "toggleTrack",
  "toggleThumb",
  "infoBar",
  "infoPill",
] as const;

export type LuminaEditorStyleSlot = (typeof LUMINA_EDITOR_STYLE_SLOTS)[number];
export type LuminaEditorClassNames = Partial<Record<LuminaEditorStyleSlot, string>>;
export type LuminaEditorStyleLibrary =
  | "lumina"
  | "tailwind"
  | "bootstrap"
  | "material"
  | "none"
  | (string & {});

export const LUMINA_EDITOR_DEFAULT_CLASS_NAMES = Object.fromEntries(
  LUMINA_EDITOR_STYLE_SLOTS.map((slot) => [slot, `lumina-editor__${slot}`]),
) as Record<LuminaEditorStyleSlot, string>;

export const LUMINA_EDITOR_NONE_CLASS_NAMES = Object.fromEntries(
  LUMINA_EDITOR_STYLE_SLOTS.map((slot) => [slot, ""]),
) as LuminaEditorClassNames;

export const LUMINA_EDITOR_TAILWIND_CLASS_NAMES = {
  root: "min-h-screen flex flex-col bg-neutral-950 text-zinc-100 font-sans",
  header: "flex items-center justify-between border-b border-white/10 bg-zinc-900 px-5 py-3",
  logo: "flex items-center gap-2.5",
  logoText: "text-sm font-semibold text-zinc-100",
  badge: "rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300",
  headerRight: "flex items-center gap-2",
  btnSm:
    "rounded-md border border-white/15 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-400",
  btnPrimary: "rounded-md bg-violet-500 px-3.5 py-2 text-xs font-semibold text-white",
  body: "flex min-h-0 flex-1 overflow-hidden",
  canvasArea:
    "relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden bg-neutral-950 p-6",
  dropzone:
    "flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-violet-400/40 bg-violet-500/5 px-10 py-14 text-center",
  panel: "flex w-72 min-w-72 flex-col overflow-hidden border-l border-white/10 bg-zinc-900",
  tabs: "flex border-b border-white/10",
  tab: "flex-1 border-b-2 border-transparent px-0 py-3 text-xs font-medium text-zinc-500",
  tabActive: "border-violet-500 text-violet-300",
  panelBody: "flex-1 overflow-y-auto p-4",
  filterGrid: "grid grid-cols-2 gap-2",
  fThumb:
    "flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-white/10 bg-zinc-800 p-1.5",
  fThumbSel: "border-violet-500 bg-violet-500/10",
  numInput:
    "box-border rounded-md border border-white/10 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100",
  presetBtn:
    "rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-400",
  applyBtn: "mt-1 w-full rounded-md bg-violet-500 py-2 text-sm font-semibold text-white",
  resetBtn:
    "mt-1 w-full rounded-md border border-white/10 bg-transparent py-2 text-xs text-zinc-500",
} satisfies LuminaEditorClassNames;

export const LUMINA_EDITOR_BOOTSTRAP_CLASS_NAMES = {
  root: "lumina-editor bg-dark text-light min-vh-100 d-flex flex-column",
  header:
    "d-flex align-items-center justify-content-between border-bottom border-secondary px-3 py-2",
  logo: "d-flex align-items-center gap-2",
  badge: "badge text-bg-primary",
  headerRight: "d-flex align-items-center gap-2",
  btnSm: "btn btn-outline-secondary btn-sm",
  btnPrimary: "btn btn-primary btn-sm",
  notif: "text-center py-2",
  body: "d-flex flex-grow-1 overflow-hidden",
  canvasArea:
    "position-relative d-flex flex-column align-items-center justify-content-center flex-grow-1 gap-2 p-4 overflow-hidden",
  dropzone: "border border-primary border-2 rounded-3 p-5 text-center",
  panel: "d-flex flex-column border-start border-secondary overflow-hidden",
  tabs: "nav nav-tabs",
  tab: "nav-link flex-fill",
  tabActive: "active",
  panelBody: "p-3 overflow-auto flex-grow-1",
  filterGrid: "row row-cols-2 g-2",
  fThumb: "btn btn-outline-secondary p-1 d-flex flex-column align-items-center gap-1",
  fThumbSel: "active",
  numInput: "form-control form-control-sm",
  rangeInput: "form-range",
  presetBtn: "btn btn-outline-secondary btn-sm",
  applyBtn: "btn btn-primary btn-sm w-100 mt-1",
  resetBtn: "btn btn-outline-secondary btn-sm w-100 mt-1",
  infoBar: "border-top border-secondary p-2 d-flex gap-1 flex-wrap",
  infoPill: "badge text-bg-secondary",
} satisfies LuminaEditorClassNames;

export const LUMINA_EDITOR_MATERIAL_CLASS_NAMES = {
  root: "MuiBox-root lumina-editor",
  header: "MuiPaper-root MuiToolbar-root",
  logo: "MuiStack-root",
  logoText: "MuiTypography-root MuiTypography-subtitle2",
  badge: "MuiChip-root MuiChip-sizeSmall",
  headerRight: "MuiStack-root",
  btnSm: "MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-sizeSmall",
  btnPrimary: "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-sizeSmall",
  panel: "MuiPaper-root",
  tab: "MuiButtonBase-root MuiTab-root",
  tabActive: "Mui-selected",
  fThumb: "MuiButtonBase-root MuiButton-root MuiButton-outlined",
  fThumbSel: "Mui-selected",
  numInput: "MuiInputBase-input",
  presetBtn: "MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-sizeSmall",
  applyBtn: "MuiButtonBase-root MuiButton-root MuiButton-contained",
  resetBtn: "MuiButtonBase-root MuiButton-root MuiButton-outlined",
} satisfies LuminaEditorClassNames;

export const LUMINA_EDITOR_CLASS_PRESETS: Record<string, LuminaEditorClassNames> = {
  lumina: {},
  none: LUMINA_EDITOR_NONE_CLASS_NAMES,
  tailwind: LUMINA_EDITOR_TAILWIND_CLASS_NAMES,
  bootstrap: LUMINA_EDITOR_BOOTSTRAP_CLASS_NAMES,
  material: LUMINA_EDITOR_MATERIAL_CLASS_NAMES,
};
