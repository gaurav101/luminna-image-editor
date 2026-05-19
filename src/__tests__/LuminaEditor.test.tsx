import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LuminaEditor, { type LuminaEditorHandle } from "../LuminaEditor";

vi.mock("../hooks/useLuminaCanvas", () => ({
  useLuminaCanvas: () => ({
    render: async () => "data:image/png;base64,preview",
    buildPreview: async () => "data:image/png;base64,thumb",
    execute: async () => ({
      dataUrl: "data:image/png;base64,out",
      blob: new Blob(["x"], { type: "image/png" }),
      file: new File(["x"], "out.png", { type: "image/png" }),
      objectUrl: "blob:out",
      revokeObjectUrl: vi.fn(),
    }),
  }),
}));

describe("LuminaEditor compound API", () => {
  it("renders default composed layout", () => {
    render(<LuminaEditor />);
    expect(screen.getByText("LuminaEditor")).toBeInTheDocument();
    expect(screen.getByText("Drop an image here or click to upload.")).toBeInTheDocument();
  });

  it("supports ref execute bridge", async () => {
    const ref = createRef<LuminaEditorHandle>();
    render(<LuminaEditor ref={ref} />);
    expect(ref.current).toBeTruthy();
    await ref.current?.execute();
  });
});
