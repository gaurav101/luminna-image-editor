import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CanvasArea } from "../CanvasArea";

const setFile = vi.fn(async () => {});

vi.mock("../../hooks/useLuminaEditor", () => ({
  useLuminaEditor: () => ({
    file: null,
    previewUrl: null,
    activeOperations: { isRendering: false, isGeneratingPreviews: false, isExecuting: false },
    setFile,
    slotClassNames: {
      canvasArea: "",
      dropzone: "",
      previewWrap: "",
      loadingOverlay: "",
      previewImg: "",
    },
    slotStyles: {},
  }),
}));

describe("CanvasArea", () => {
  it("renders empty state and applies class/style", () => {
    render(<CanvasArea className="canvas" style={{ padding: 4 }} />);
    expect(screen.getByText("Drop an image here or click to upload.")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload image")).toBeInTheDocument();
    expect(screen.getByText("Drop an image here or click to upload.").closest("section")).toHaveClass("canvas");
  });

  it("handles drop upload", async () => {
    render(<CanvasArea />);
    const section = screen.getByText("Drop an image here or click to upload.").closest("section");
    const file = new File(["x"], "test.png", { type: "image/png" });
    fireEvent.drop(section!, { dataTransfer: { files: [file] } });
    expect(setFile).toHaveBeenCalledWith(file);
  });
});
