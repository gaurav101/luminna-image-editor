import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import LuminaEditor from "lumina-editor";
import type {
  LuminaEditorClassNames,
  LuminaEditorHandle,
  LuminaEditorProcessedImage,
  LuminaEditorProps,
} from "lumina-editor";

type StoryTheme = "lumina" | "tailwind" | "bootstrap" | "material" | "custom";

const CDN_ASSETS = {
  bootstrap: {
    tag: "link",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
  },
  tailwind: {
    tag: "script",
    url: "https://cdn.tailwindcss.com",
  },
} as const;

const customClassNames: LuminaEditorClassNames = {
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

const compactStyles = {
  root: {
    borderRadius: 8,
    border: "1px solid #d9dee8",
    overflow: "hidden",
  },
  canvasArea: {
    background: "#f8fafc",
  },
  btnPrimary: {
    background: "#2563eb",
  },
} satisfies LuminaEditorProps["styles"];

const embeddedContainerStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  minHeight: 620,
  padding: 24,
  background: "#eef2f7",
};

const formPanelStyle: CSSProperties = {
  border: "1px solid #d9dee8",
  borderRadius: 8,
  background: "#ffffff",
  padding: 18,
};

function ensureCdnAsset(key: keyof typeof CDN_ASSETS) {
  const asset = CDN_ASSETS[key];
  const id = `storybook-lumina-${key}`;

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

function ThemeFrame({ children, theme = "lumina" }: { children: ReactNode; theme?: StoryTheme }) {
  useEffect(() => {
    if (theme === "bootstrap" || theme === "tailwind") {
      ensureCdnAsset(theme);
    }
  }, [theme]);

  return <div className={`demo-editor-frame demo-theme-${theme}`}>{children}</div>;
}

function ExportLogger(dataUrl: string) {
  console.log("LuminaEditor exported image:", dataUrl.slice(0, 64));
}

function ExecuteLogger(processedImage: LuminaEditorProcessedImage) {
  console.log("LuminaEditor execute payload:", {
    fileName: processedImage.fileName,
    mimeType: processedImage.mimeType,
    size: processedImage.blob.size,
    dimensions: `${processedImage.width}x${processedImage.height}`,
  });
  processedImage.revokeObjectUrl();
}

function ObjectUrlActionExample(args: LuminaEditorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <LuminaEditor
        {...args}
        autoDownload={false}
        executeLabel="Create object URL"
        onExecute={(processedImage) => {
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = processedImage.objectUrl;
          setPreviewUrl(processedImage.objectUrl);
        }}
      />
      {previewUrl && (
        <div style={formPanelStyle}>
          <h2 style={{ marginTop: 0 }}>Processed preview</h2>
          <img
            src={previewUrl}
            alt="Processed output"
            style={{ display: "block", maxHeight: 360, maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}

function ImperativeExecuteExample(args: LuminaEditorProps) {
  const editorRef = useRef<LuminaEditorHandle | null>(null);
  const [message, setMessage] = useState("Load an image, then run execute() from the outer form.");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={formPanelStyle}>
        <button
          type="button"
          onClick={() => {
            void editorRef.current
              ?.execute({ format: "webp", fileName: "story-output.webp", download: false })
              .then((result) => {
                if (!result) {
                  setMessage("No image loaded yet.");
                  return;
                }
                setMessage(
                  `execute() returned ${result.file.name}, ${result.mimeType}, ${Math.round(result.blob.size / 1024)} KB.`,
                );
                result.revokeObjectUrl();
              });
          }}
        >
          Run ref.execute()
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
      <LuminaEditor ref={editorRef} {...args} />
    </div>
  );
}

const meta = {
  title: "Demo/LuminaEditor",
  component: LuminaEditor,
  parameters: {
    docs: {
      description: {
        component:
          "Stories cover every public LuminaEditor prop: export callback, style library, class map, inline style overrides, layout, controls position, responsive behavior, sizing, panel width, root class, and root style.",
      },
    },
  },
  args: {
    onExport: ExportLogger,
    onExecute: ExecuteLogger,
    executeLabel: "Process PNG",
    executeFormat: "png",
    autoDownload: true,
    styleLibrary: "lumina",
    inlineStyles: true,
    layout: "sidebar",
    controlsPosition: "bottom",
    responsive: true,
    mobileBreakpoint: 760,
    fullScreen: true,
    panelWidth: 290,
  },
  argTypes: {
    onExport: {
      control: false,
      description: "Called with the exported image data URL after export.",
    },
    onExecute: {
      control: false,
      description:
        "Called with the processed image payload. Use it to upload, download, preview, or store the result.",
    },
    executeLabel: {
      control: "text",
    },
    executeFormat: {
      control: "select",
      options: ["png", "jpg", "jpeg", "webp"],
    },
    autoDownload: {
      control: "boolean",
    },
    styleLibrary: {
      control: "select",
      options: ["lumina", "tailwind", "bootstrap", "material", "none"],
    },
    classNames: {
      control: "object",
      description: "Slot class overrides for app-owned CSS or external CSS libraries.",
    },
    styles: {
      control: "object",
      description: "Inline style overrides per LuminaEditor slot.",
    },
    inlineStyles: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
    style: {
      control: "object",
      description: "Inline style for the root element.",
    },
    layout: {
      control: "inline-radio",
      options: ["sidebar", "toolbar"],
    },
    controlsPosition: {
      control: "inline-radio",
      options: ["top", "bottom"],
    },
    responsive: {
      control: "boolean",
    },
    mobileBreakpoint: {
      control: { type: "number", min: 320, max: 1280, step: 20 },
    },
    fullScreen: {
      control: "boolean",
    },
    height: {
      control: "text",
    },
    minHeight: {
      control: "text",
    },
    maxHeight: {
      control: "text",
    },
    panelWidth: {
      control: "text",
    },
  },
} satisfies Meta<typeof LuminaEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ThemeFrame theme={(args.styleLibrary as StoryTheme) ?? "lumina"}>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const DefaultFullScreenSidebar: Story = {
  args: {
    styleLibrary: "lumina",
    inlineStyles: true,
    layout: "sidebar",
    fullScreen: true,
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const EmbeddedInAForm: Story = {
  args: {
    fullScreen: false,
    height: 520,
    layout: "toolbar",
    controlsPosition: "bottom",
    styles: compactStyles,
  },
  render: (args) => (
    <div style={embeddedContainerStyle}>
      <LuminaEditor {...args} />
      <aside style={formPanelStyle}>
        <h2 style={{ marginTop: 0 }}>Product form</h2>
        <label>
          Title
          <input
            style={{ display: "block", marginTop: 6, width: "100%" }}
            defaultValue="Hero image"
          />
        </label>
        <label style={{ display: "block", marginTop: 14 }}>
          Description
          <textarea
            style={{ display: "block", marginTop: 6, minHeight: 120, width: "100%" }}
            defaultValue="The editor can sit inside a form without taking the full screen."
          />
        </label>
      </aside>
    </div>
  ),
};

export const ExecuteCreatesObjectUrlPreview: Story = {
  args: {
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    controlsPosition: "bottom",
    autoDownload: false,
    executeFormat: "png",
  },
  render: (args) => (
    <ThemeFrame>
      <ObjectUrlActionExample {...args} />
    </ThemeFrame>
  ),
};

export const ExecuteSimulatesUpload: Story = {
  args: {
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    executeLabel: "Upload processed image",
    autoDownload: false,
    onExecute: async (processedImage) => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      console.log("Simulated upload payload:", processedImage.file);
      processedImage.revokeObjectUrl();
    },
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const ImperativeExecuteRef: Story = {
  args: {
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    autoDownload: false,
  },
  render: (args) => (
    <ThemeFrame>
      <ImperativeExecuteExample {...args} />
    </ThemeFrame>
  ),
};

export const ToolbarControlsAboveImage: Story = {
  args: {
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    controlsPosition: "top",
    panelWidth: 320,
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const ToolbarControlsBelowImage: Story = {
  args: {
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    controlsPosition: "bottom",
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const NarrowSidebarPanel: Story = {
  args: {
    fullScreen: false,
    height: 600,
    layout: "sidebar",
    panelWidth: 240,
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const ResponsiveMobileMode: Story = {
  args: {
    fullScreen: false,
    height: "auto",
    minHeight: 620,
    layout: "sidebar",
    responsive: true,
    mobileBreakpoint: 1200,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const TailwindPreset: Story = {
  args: {
    styleLibrary: "tailwind",
    inlineStyles: false,
    fullScreen: false,
    height: 620,
    layout: "toolbar",
  },
  render: (args) => (
    <ThemeFrame theme="tailwind">
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const BootstrapPreset: Story = {
  args: {
    styleLibrary: "bootstrap",
    inlineStyles: false,
    fullScreen: false,
    height: 620,
    layout: "sidebar",
  },
  render: (args) => (
    <ThemeFrame theme="bootstrap">
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const MaterialClassPreset: Story = {
  args: {
    styleLibrary: "material",
    inlineStyles: false,
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    controlsPosition: "top",
  },
  render: (args) => (
    <ThemeFrame theme="material">
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const CustomClassNames: Story = {
  args: {
    styleLibrary: "none",
    inlineStyles: false,
    classNames: customClassNames,
    fullScreen: false,
    height: 620,
    layout: "toolbar",
    controlsPosition: "bottom",
  },
  render: (args) => (
    <ThemeFrame theme="custom">
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const InlineStyleOverrides: Story = {
  args: {
    fullScreen: false,
    height: 560,
    minHeight: 480,
    maxHeight: 720,
    className: "storybook-inline-style-example",
    style: {
      borderRadius: 12,
      overflow: "hidden",
    },
    styles: {
      root: { background: "#ffffff", color: "#111827" },
      header: { background: "#f8fafc" },
      canvasArea: { background: "#eef2ff" },
      btnPrimary: { background: "#059669" },
    },
  },
  render: (args) => (
    <ThemeFrame>
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};

export const AllPropsConfigured: Story = {
  args: {
    onExport: ExportLogger,
    onExecute: ExecuteLogger,
    executeLabel: "Run custom action",
    executeFormat: "webp",
    autoDownload: false,
    styleLibrary: "none",
    classNames: customClassNames,
    styles: compactStyles,
    inlineStyles: true,
    className: "storybook-all-props",
    style: { boxShadow: "0 14px 40px rgba(15, 23, 42, 0.18)" },
    layout: "toolbar",
    controlsPosition: "top",
    responsive: true,
    mobileBreakpoint: 900,
    fullScreen: false,
    height: 640,
    minHeight: 520,
    maxHeight: 760,
    panelWidth: 340,
  },
  render: (args) => (
    <ThemeFrame theme="custom">
      <LuminaEditor {...args} />
    </ThemeFrame>
  ),
};
