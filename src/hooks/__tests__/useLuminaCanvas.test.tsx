import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useLuminaCanvas } from "../useLuminaCanvas";

const toDataURL = vi.fn(async () => "data:image/png;base64,mock");
const chain = {
  grayscale: vi.fn(() => chain),
  sepia: vi.fn(() => chain),
  brightness: vi.fn(() => chain),
  contrast: vi.fn(() => chain),
  blur: vi.fn(() => chain),
  sharpen: vi.fn(() => chain),
  crop: vi.fn(() => chain),
  resize: vi.fn(() => chain),
  toDataURL,
};

vi.mock("@gks101/luminajs", () => ({
  lumina: vi.fn(() => chain),
}));

describe("useLuminaCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(
      async () => ({ blob: async () => new Blob(["x"], { type: "image/png" }) }) as Response,
    ) as typeof fetch;
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
  });

  it("renders with ops and transform", async () => {
    const { result } = renderHook(() => useLuminaCanvas());
    const file = new File(["a"], "a.png", { type: "image/png" });
    await result.current.render({
      file,
      ops: [{ fn: "grayscale" }, { fn: "contrast", arg: 10 }],
      adjustments: { brightness: 12, contrast: 8, blur: 2, sharpen: 1 },
      transform: { crop: { x: 1, y: 2, width: 3, height: 4 }, resize: { width: 100, height: 80 } },
    });
    expect(chain.grayscale).toHaveBeenCalled();
    expect(chain.contrast).toHaveBeenCalledWith(10);
    expect(chain.crop).toHaveBeenCalledWith(1, 2, 3, 4);
    expect(chain.resize).toHaveBeenCalledWith(100, 80);
  });

  it("builds previews and executes", async () => {
    const { result } = renderHook(() => useLuminaCanvas());
    const file = new File(["a"], "a.png", { type: "image/png" });
    const preview = await result.current.buildPreview({ file, ops: [{ fn: "sepia" }], size: 48 });
    expect(preview).toContain("data:image/png");
    const executed = await result.current.execute({
      file,
      ops: [],
      adjustments: { brightness: 0, contrast: 0, blur: 0, sharpen: 0 },
      transform: { crop: null, resize: null },
    });
    expect(executed.objectUrl).toBe("blob:test");
    executed.revokeObjectUrl();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
