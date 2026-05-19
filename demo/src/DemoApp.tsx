import { useEffect, useMemo, useRef, useState } from "react";
import LuminaEditor from "lumina-editor";
import type {
  LuminaEditorFilterPreset,
  LuminaEditorClassNames,
  LuminaEditorControlsPosition,
  LuminaEditorLayout,
  LuminaEditorProcessedImage,
  LuminaEditorStyleLibrary,
  LuminaEditorToolbarAction,
} from "lumina-editor";

type DemoThemeId = "lumina" | "tailwind" | "bootstrap" | "material" | "custom";
type DemoLayoutId = "sidebar" | "toolbar-bottom" | "toolbar-top";
type DemoActionId = "download" | "object-url" | "upload";

interface DemoTheme {
  id: DemoThemeId;
  label: string;
  description: string;
  styleLibrary: LuminaEditorStyleLibrary;
  inlineStyles: boolean;
  classNames?: LuminaEditorClassNames;
}

const CDN_ASSETS: Record<string, { tag: "link" | "script"; url: string }> = {
  bootstrap: {
    tag: "link",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
  },
  tailwind: {
    tag: "script",
    url: "https://cdn.tailwindcss.com",
  },
};

const CUSTOM_CLASSES: LuminaEditorClassNames = {
  root: "demo-custom-editor",
  header: "demo-custom-header",
  logo: "demo-custom-logo",
  badge: "demo-custom-badge",
  btnSm: "demo-custom-button demo-custom-button-secondary",
  btnPrimary: "demo-custom-button demo-custom-button-primary",
  body: "demo-custom-body",
  canvasArea: "demo-custom-canvas",
  dropzone: "demo-custom-dropzone",
  panel: "demo-custom-panel",
  tabs: "demo-custom-tabs",
  tab: "demo-custom-tab",
  tabActive: "demo-custom-tab-active",
  panelBody: "demo-custom-panel-body",
  numInput: "demo-custom-input",
  rangeInput: "demo-custom-range",
  presetBtn: "demo-custom-chip",
  applyBtn: "demo-custom-button demo-custom-button-primary demo-custom-button-block",
  resetBtn: "demo-custom-button demo-custom-button-secondary demo-custom-button-block",
  infoBar: "demo-custom-info",
  infoPill: "demo-custom-pill",
};

const THEMES: DemoTheme[] = [
  {
    id: "lumina",
    label: "Lumina",
    description: "Default inline styles shipped with the component.",
    styleLibrary: "lumina",
    inlineStyles: true,
  },
  {
    id: "tailwind",
    label: "Tailwind",
    description: "Loads Tailwind from CDN and applies the built-in Tailwind slot classes.",
    styleLibrary: "tailwind",
    inlineStyles: false,
  },
  {
    id: "bootstrap",
    label: "Bootstrap",
    description: "Loads Bootstrap from CDN and applies the built-in Bootstrap slot classes.",
    styleLibrary: "bootstrap",
    inlineStyles: false,
  },
  {
    id: "material",
    label: "Material",
    description: "Uses Material-style slot classes with local demo CSS for the global class names.",
    styleLibrary: "material",
    inlineStyles: false,
  },
  {
    id: "custom",
    label: "Custom CSS",
    description: "Demonstrates an app-owned class map without using a framework preset.",
    styleLibrary: "none",
    inlineStyles: false,
    classNames: CUSTOM_CLASSES,
  },
];
const DEFAULT_THEME = THEMES[0] as DemoTheme;
const LAYOUTS: Array<{
  id: DemoLayoutId;
  label: string;
  layout: LuminaEditorLayout;
  controlsPosition: LuminaEditorControlsPosition;
}> = [
  { id: "sidebar", label: "Sidebar", layout: "sidebar", controlsPosition: "bottom" },
  { id: "toolbar-bottom", label: "Toolbar below", layout: "toolbar", controlsPosition: "bottom" },
  { id: "toolbar-top", label: "Toolbar above", layout: "toolbar", controlsPosition: "top" },
];
const DEFAULT_LAYOUT = LAYOUTS[1] as (typeof LAYOUTS)[number];
const ACTIONS: Array<{
  id: DemoActionId;
  label: string;
  executeLabel: string;
  description: string;
}> = [
  {
    id: "download",
    label: "Download",
    executeLabel: "Download PNG",
    description: "The built-in execute button downloads the processed image locally.",
  },
  {
    id: "object-url",
    label: "Object URL preview",
    executeLabel: "Create preview URL",
    description: "The processed Blob is converted to an object URL and rendered below the editor.",
  },
  {
    id: "upload",
    label: "Simulated upload",
    executeLabel: "Upload image",
    description: "The processed File is handed to a callback where an app could upload it.",
  },
];
const DEFAULT_ACTION = ACTIONS[0] as (typeof ACTIONS)[number];
const DEMO_TOOLBAR_ACTIONS: LuminaEditorToolbarAction[] = [
  "undo",
  "execute",
  "exportJpg",
  "loadImage",
];
const DEMO_FILTERS: LuminaEditorFilterPreset[] = [
  { id: "none", label: "Original", ops: [] },
  { id: "grayscale", label: "Grayscale", ops: [{ fn: "grayscale" }] },
  { id: "warm", label: "Warm", ops: [{ fn: "brightness", arg: 15 }, { fn: "contrast", arg: 10 }] },
  { id: "dramatic", label: "Dramatic", ops: [{ fn: "contrast", arg: 40 }, { fn: "brightness", arg: -20 }] },
];

function ensureCdnAsset(key: keyof typeof CDN_ASSETS) {
  const asset = CDN_ASSETS[key];
  if (!asset) return;

  const id = `lumina-demo-${key}`;

  if (document.getElementById(id)) return;

  if (asset.tag === "link") {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = asset.url;
    document.head.appendChild(link);
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = asset.url;
  document.head.appendChild(script);
}

export default function DemoApp() {
  const [activeThemeId, setActiveThemeId] = useState<DemoThemeId>("lumina");
  const [activeLayoutId, setActiveLayoutId] = useState<DemoLayoutId>("toolbar-bottom");
  const [activeActionId, setActiveActionId] = useState<DemoActionId>("download");
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("Export actions will appear here.");
  const previewUrlRef = useRef<string | null>(null);
  const activeTheme = useMemo(
    () => THEMES.find((theme) => theme.id === activeThemeId) ?? DEFAULT_THEME,
    [activeThemeId],
  );
  const activeLayout = useMemo(
    () => LAYOUTS.find((layout) => layout.id === activeLayoutId) ?? DEFAULT_LAYOUT,
    [activeLayoutId],
  );
  const activeAction = useMemo(
    () => ACTIONS.find((action) => action.id === activeActionId) ?? DEFAULT_ACTION,
    [activeActionId],
  );

  useEffect(() => {
    if (activeTheme.id === "bootstrap" || activeTheme.id === "tailwind") {
      ensureCdnAsset(activeTheme.id);
    }
  }, [activeTheme.id]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleProcessedImage = async (processedImage: LuminaEditorProcessedImage) => {
    if (activeAction.id === "object-url") {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = processedImage.objectUrl;
      setProcessedPreviewUrl(processedImage.objectUrl);
      setActionMessage(
        `Created object URL for ${processedImage.fileName} (${Math.round(processedImage.blob.size / 1024)} KB).`,
      );
      return;
    }

    if (activeAction.id === "upload") {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      processedImage.revokeObjectUrl();
      setActionMessage(
        `Simulated upload complete: ${processedImage.file.name}, ${processedImage.mimeType}, ${Math.round(processedImage.blob.size / 1024)} KB.`,
      );
      return;
    }

    processedImage.revokeObjectUrl();
    setActionMessage(`Downloaded ${processedImage.fileName}.`);
  };

  return (
    <main className="demo-shell">
      <section className="demo-toolbar">
        <div>
          <p className="demo-eyebrow">LuminaEditor styling demo</p>
          <h1>Switch CSS libraries at runtime</h1>
          <p className="demo-copy">{activeTheme.description}</p>
        </div>

        <div className="demo-action-groups">
          <div className="demo-actions" aria-label="CSS library options">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={theme.id === activeTheme.id ? "demo-action is-active" : "demo-action"}
                onClick={() => setActiveThemeId(theme.id)}
              >
                {theme.label}
              </button>
            ))}
          </div>
          <div className="demo-actions demo-layout-actions" aria-label="Editor layout options">
            {LAYOUTS.map((layoutOption) => (
              <button
                key={layoutOption.id}
                type="button"
                className={
                  layoutOption.id === activeLayout.id ? "demo-action is-active" : "demo-action"
                }
                onClick={() => setActiveLayoutId(layoutOption.id)}
              >
                {layoutOption.label}
              </button>
            ))}
          </div>
          <div className="demo-actions demo-layout-actions" aria-label="Processed image actions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={action.id === activeAction.id ? "demo-action is-active" : "demo-action"}
                onClick={() => setActiveActionId(action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-action-summary">
        <span>{activeAction.description}</span>
        <strong>{actionMessage}</strong>
      </section>

      <section className="demo-action-summary">
        <span>
          Use LuminaEditor directly in app screens or inside forms where users need to upload and
          edit images before submit.
        </span>
        <strong>
          Source:{" "}
          <a
            href="https://github.com/gaurav101/luminna-image-editor"
            target="_blank"
            rel="noreferrer"
          >
            github.com/gaurav101/luminna-image-editor
          </a>{" "}
          · Processing library:{" "}
          <a href="https://www.npmjs.com/package/@gks101/luminajs" target="_blank" rel="noreferrer">
            @gks101/luminajs
          </a>
        </strong>
      </section>

      <section className={`demo-editor-frame demo-theme-${activeTheme.id}`}>
        <LuminaEditor
          key={`${activeTheme.id}-${activeLayout.id}`}
          styleLibrary={activeTheme.styleLibrary}
          inlineStyles={activeTheme.inlineStyles}
          classNames={activeTheme.classNames}
          fullScreen
          layout={activeLayout.layout}
          controlsPosition={activeLayout.controlsPosition}
          responsive
          mobileBreakpoint={820}
          executeLabel={activeAction.executeLabel}
          executeFormat="png"
          autoDownload={activeAction.id === "download"}
          tabs={["filters", "adjust", "transform", "effects"]}
          toolbarActions={DEMO_TOOLBAR_ACTIONS}
          filterPresets={DEMO_FILTERS}
          onExecute={handleProcessedImage}
        />
      </section>

      {processedPreviewUrl && (
        <section className="demo-processed-preview">
          <div>
            <p className="demo-eyebrow">Processed object URL</p>
            <h2>Preview generated by execute()</h2>
          </div>
          <img src={processedPreviewUrl} alt="Processed output preview" />
        </section>
      )}
    </main>
  );
}
