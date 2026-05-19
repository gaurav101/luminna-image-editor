import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LuminaEditorProvider } from "../LuminaEditorContext";
import { useLuminaEditor } from "../../hooks/useLuminaEditor";

const renderMock = vi.fn(async () => "data:image/png;base64,preview");
const buildPreviewMock = vi.fn(async (_args: unknown) => "data:image/png;base64,thumb");
const executeMock = vi.fn(async () => ({
  dataUrl: "data:image/png;base64,out",
  blob: new Blob(["x"], { type: "image/png" }),
  file: new File(["x"], "out.png", { type: "image/png" }),
  objectUrl: "blob:out",
  revokeObjectUrl: vi.fn(),
}));

vi.mock("../../hooks/useLuminaCanvas", () => ({
  useLuminaCanvas: () => ({
    render: renderMock,
    buildPreview: buildPreviewMock,
    execute: executeMock,
  }),
}));

function Probe() {
  const editor = useLuminaEditor();
  return (
    <div>
      <span data-testid="can-undo">{String(editor.canUndo)}</span>
      <button onClick={() => void editor.setFile(new File(["x"], "in.png", { type: "image/png" }))}>
        set-file
      </button>
      <button
        onClick={() => {
          editor.setAdjustment("brightness", 10);
        }}
      >
        set-adj
      </button>
      <button onClick={editor.undo}>undo</button>
      <button onClick={editor.redo}>redo</button>
      <button onClick={() => void editor.execute()}>execute</button>
    </div>
  );
}

describe("LuminaEditorProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("initializes and distributes context state", async () => {
    render(
      <LuminaEditorProvider>
        <Probe />
      </LuminaEditorProvider>,
    );
    await act(async () => {
      screen.getByText("set-file").click();
    });
    await waitFor(() => expect(buildPreviewMock).toHaveBeenCalled());
    expect(renderMock).toHaveBeenCalled();
  });

  it("supports history and execute", async () => {
    render(
      <LuminaEditorProvider>
        <Probe />
      </LuminaEditorProvider>,
    );
    await act(async () => {
      screen.getByText("set-file").click();
    });
    await act(async () => {
      screen.getByText("set-adj").click();
    });
    await waitFor(() => expect(screen.getByTestId("can-undo")).toHaveTextContent("true"));
    screen.getByText("undo").click();
    screen.getByText("redo").click();
    await act(async () => {
      screen.getByText("execute").click();
    });
    expect(executeMock).toHaveBeenCalled();
  });
});
