import { useEffect, useMemo, useRef, useState } from "react";
import LuminaEditor from "lumina-editor";
import type { LuminaEditorClassNames, LuminaEditorHandle, LuminaFilterPreset, LuminaEditorStyleLibrary } from "lumina-editor";

type DemoLayoutId = "sidebar" | "toolbar" | "custom";
type DemoThemeId = "lumina" | "tailwind" | "bootstrap" | "material" | "custom";

const CUSTOM_CLASSES: LuminaEditorClassNames = {
  root: "demo-custom-editor",
  header: "demo-custom-header",
  canvasArea: "demo-custom-canvas",
  dropzone: "demo-custom-dropzone",
  panel: "demo-custom-panel",
  btnSm: "demo-custom-button demo-custom-button-secondary",
  btnPrimary: "demo-custom-button demo-custom-button-primary",
};

const FILTERS: LuminaFilterPreset[] = [
  { id: "none", label: "Original", ops: [] },
  { id: "grayscale", label: "Grayscale", ops: [{ fn: "grayscale" }] },
  { id: "warm", label: "Warm", ops: [{ fn: "brightness", arg: 15 }, { fn: "contrast", arg: 10 }] },
  { id: "dramatic", label: "Dramatic", ops: [{ fn: "contrast", arg: 40 }, { fn: "brightness", arg: -20 }] },
];

const CDN_ASSETS: Record<"bootstrap" | "tailwind", { tag: "link" | "script"; url: string }> = {
  bootstrap: {
    tag: "link",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
  },
  tailwind: {
    tag: "script",
    url: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
  },
};

function ensureCdnAsset(key: keyof typeof CDN_ASSETS): Promise<void> {
  const asset = CDN_ASSETS[key];
  const id = `lumina-demo-${key}`;
  const existing = document.getElementById(id);
  if (existing) return Promise.resolve();

  if (asset.tag === "link") {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = asset.url;
    return new Promise((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${asset.url}`));
      document.head.appendChild(link);
    });
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = asset.url;
  return new Promise((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${asset.url}`));
    document.head.appendChild(script);
  });
}

function DemoLayout({ layout }: { layout: DemoLayoutId }) {
  if (layout === "toolbar") return <LuminaEditor.ToolbarLayout />;
  if (layout === "custom") {
    return (
      <>
        <LuminaEditor.Header style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LuminaEditor.Logo label="Lumina Custom Layout" />
          <LuminaEditor.ActionButton action="undo" />
          <LuminaEditor.ActionButton action="redo" />
          <LuminaEditor.ExecuteButton>Run</LuminaEditor.ExecuteButton>
        </LuminaEditor.Header>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
          <LuminaEditor.CanvasArea />
          <LuminaEditor.Toolbar orientation="vertical">
            <LuminaEditor.FilterPresets />
            <LuminaEditor.Adjustments />
          </LuminaEditor.Toolbar>
        </div>
      </>
    );
  }
  return <LuminaEditor.SidebarLayout />;
}

export default function DemoApp() {
  const [layout, setLayout] = useState<DemoLayoutId>("toolbar");
  const [theme, setTheme] = useState<DemoThemeId>("lumina");
  const [activeTheme, setActiveTheme] = useState<DemoThemeId>("lumina");
  const [message, setMessage] = useState("Load an image and run execute().");
  const editorRef = useRef<LuminaEditorHandle | null>(null);
  const key = useMemo(() => `${layout}-${activeTheme}`, [layout, activeTheme]);
  const styleLibrary: LuminaEditorStyleLibrary = activeTheme === "custom" ? "none" : activeTheme;
  const classNames = activeTheme === "custom" ? CUSTOM_CLASSES : undefined;
  const inlineStyles = activeTheme === "lumina";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (theme === "bootstrap" || theme === "tailwind") {
          await ensureCdnAsset(theme);
        }
        if (!cancelled) setActiveTheme(theme);
      } catch (error) {
        if (!cancelled) {
          setActiveTheme("lumina");
          setMessage(error instanceof Error ? error.message : "Could not load selected CSS library.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theme]);

  return (
    <main className="demo-shell">
      <section className="demo-toolbar">
        <div>
          <p className="demo-eyebrow">LuminaEditor Composition Demo</p>
          <h1>Compound component layouts</h1>
          <p className="demo-copy">
            Switch between preset layouts and a custom tree-composed layout.
          </p>
        </div>
        <div className="demo-actions" aria-label="Layout options">
          <button
            type="button"
            className={layout === "sidebar" ? "demo-action is-active" : "demo-action"}
            onClick={() => setLayout("sidebar")}
          >
            Sidebar
          </button>
          <button
            type="button"
            className={layout === "toolbar" ? "demo-action is-active" : "demo-action"}
            onClick={() => setLayout("toolbar")}
          >
            Toolbar
          </button>
          <button
            type="button"
            className={layout === "custom" ? "demo-action is-active" : "demo-action"}
            onClick={() => setLayout("custom")}
          >
            Custom
          </button>
        </div>
        <div className="demo-actions" aria-label="Theme options">
          {(["lumina", "tailwind", "bootstrap", "material", "custom"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={activeTheme === id ? "demo-action is-active" : "demo-action"}
              onClick={() => setTheme(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </section>

      <section className="demo-action-summary">
        <strong>{message}</strong>
      </section>

      <section className="demo-action-summary">
        <button
          type="button"
          className="demo-action is-active"
          onClick={() => {
            void editorRef.current?.execute().then((result) => {
              if (!result) {
                setMessage("No image loaded yet.");
                return;
              }
              setMessage(
                `execute() returned ${result.file.name} (${Math.round(result.blob.size / 1024)} KB).`,
              );
              result.revokeObjectUrl();
            });
          }}
        >
          Execute via ref
        </button>
      </section>

      <section className={`demo-editor-frame demo-theme-${activeTheme}`}>
        <LuminaEditor
          ref={editorRef}
          key={key}
          filterPresets={FILTERS}
          styleLibrary={styleLibrary}
          classNames={classNames}
          inlineStyles={inlineStyles}
        >
          <DemoLayout layout={layout} />
        </LuminaEditor>
      </section>
    </main>
  );
}
