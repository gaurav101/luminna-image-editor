import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import LuminaEditor from "lumina-editor";
import type {
  LuminaEditorClassNames,
  LuminaEditorHandle,
  LuminaFilterPreset,
  LuminaEditorStyleLibrary,
} from "lumina-editor";

const curatedFilters: LuminaFilterPreset[] = [
  { id: "none", label: "Original", ops: [] },
  { id: "grayscale", label: "Grayscale", ops: [{ fn: "grayscale" }] },
  { id: "sepia", label: "Sepia", ops: [{ fn: "sepia" }] },
  { id: "dramatic", label: "Dramatic", ops: [{ fn: "contrast", arg: 40 }, { fn: "brightness", arg: -20 }] },
];

const frameStyle: CSSProperties = {
  border: "1px solid #d9dee8",
  borderRadius: 8,
  padding: 16,
  background: "#fff",
};

const customClassNames: LuminaEditorClassNames = {
  root: "demo-custom-editor",
  header: "demo-custom-header",
  canvasArea: "demo-custom-canvas",
  dropzone: "demo-custom-dropzone",
  panel: "demo-custom-panel",
  btnSm: "demo-custom-button demo-custom-button-secondary",
  btnPrimary: "demo-custom-button demo-custom-button-primary",
};

function withStylePreset(
  styleLibrary: LuminaEditorStyleLibrary | undefined,
  classNames: LuminaEditorClassNames | undefined,
) {
  return { styleLibrary, classNames, inlineStyles: styleLibrary === "lumina" };
}

function ExecuteViaRefStory() {
  const editorRef = useRef<LuminaEditorHandle | null>(null);
  const [message, setMessage] = useState("Click execute after loading an image.");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={frameStyle}>
        <button
          type="button"
          onClick={() => {
            void editorRef.current?.execute().then((result) => {
              if (!result) {
                setMessage("No image loaded yet.");
                return;
              }
              setMessage(`Generated ${result.file.name} (${Math.round(result.blob.size / 1024)} KB).`);
              result.revokeObjectUrl();
            });
          }}
        >
          Run execute()
        </button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>

      <LuminaEditor ref={editorRef} filterPresets={curatedFilters}>
        <LuminaEditor.ToolbarLayout />
      </LuminaEditor>
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
          "Composition-first LuminaEditor API with provider state, atomic sub-components, and optional preset layouts.",
      },
    },
  },
  argTypes: {
    styleLibrary: {
      control: "select",
      options: ["lumina", "tailwind", "bootstrap", "material", "none"],
    },
    classNames: { control: false },
    inlineStyles: { control: "boolean" },
    filterPresets: {
      control: false,
      description: "Custom filter presets for thumbnails and applied operations.",
    },
    outputMimeType: {
      control: "select",
      options: ["image/png", "image/jpeg", "image/webp"],
    },
  },
} satisfies Meta<typeof LuminaEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SidebarPresetLayout: Story = {
  args: withStylePreset("lumina", undefined),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.SidebarLayout />
    </LuminaEditor>
  ),
};

export const ToolbarPresetLayout: Story = {
  args: withStylePreset("lumina", undefined),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.ToolbarLayout />
    </LuminaEditor>
  ),
};

export const FullyComposedLayout: Story = {
  args: withStylePreset("lumina", undefined),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.Header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LuminaEditor.Logo label="Custom Story Layout" />
        <LuminaEditor.ActionButton action="undo" />
        <LuminaEditor.ActionButton action="redo" />
        <LuminaEditor.ExecuteButton>Execute</LuminaEditor.ExecuteButton>
      </LuminaEditor.Header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        <LuminaEditor.CanvasArea />
        <LuminaEditor.Toolbar orientation="vertical">
          <LuminaEditor.FilterPresets />
          <LuminaEditor.Adjustments />
        </LuminaEditor.Toolbar>
      </div>
    </LuminaEditor>
  ),
};

export const ExecuteViaImperativeRef: Story = {
  render: () => <ExecuteViaRefStory />,
};

export const BootstrapPreset: Story = {
  args: withStylePreset("bootstrap", undefined),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.ToolbarLayout />
    </LuminaEditor>
  ),
};

export const TailwindPreset: Story = {
  args: withStylePreset("tailwind", undefined),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.ToolbarLayout />
    </LuminaEditor>
  ),
};

export const CustomClassMap: Story = {
  args: withStylePreset("none", customClassNames),
  render: (args) => (
    <LuminaEditor {...args} filterPresets={curatedFilters}>
      <LuminaEditor.SidebarLayout />
    </LuminaEditor>
  ),
};
