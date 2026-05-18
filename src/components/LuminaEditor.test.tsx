import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LuminaEditor from "./LuminaEditor";
import {
  LUMINA_EDITOR_CLASS_PRESETS,
  LUMINA_EDITOR_DEFAULT_CLASS_NAMES,
  LUMINA_EDITOR_STYLE_SLOTS,
  LUMINA_EDITOR_TAILWIND_CLASS_NAMES,
} from "../stylePresets";

vi.mock("@gks101/luminajs", () => ({
  lumina: () => ({
    resize: () => ({
      toDataURL: () => Promise.resolve("data:image/png;base64,test"),
    }),
    toDataURL: () => Promise.resolve("data:image/png;base64,test"),
  }),
}));

describe("LuminaEditor", () => {
  it("renders the default upload state", () => {
    render(<LuminaEditor />);

    expect(screen.getByText("LuminaEditor")).toBeInTheDocument();
    expect(screen.getByText("Drop an image here")).toBeInTheDocument();
  });

  it("applies built-in library classes and custom slot classes", () => {
    const { container } = render(
      <LuminaEditor
        styleLibrary="bootstrap"
        className="custom-root"
        classNames={{ dropzone: "custom-dropzone" }}
        inlineStyles={false}
        fullScreen={false}
      />,
    );

    const root = container.firstElementChild;
    const dropzone = screen.getByText("Drop an image here").parentElement;

    expect(root).toHaveClass("lumina-editor__root", "bg-dark", "custom-root");
    expect(dropzone).toHaveClass("lumina-editor__dropzone", "rounded-3", "custom-dropzone");
    expect(root).not.toHaveStyle({ minHeight: "100vh" });
  });

  it("exports styling metadata for design-system adapters", () => {
    expect(LUMINA_EDITOR_STYLE_SLOTS).toContain("btnPrimary");
    expect(LUMINA_EDITOR_DEFAULT_CLASS_NAMES.btnPrimary).toBe("lumina-editor__btnPrimary");
    expect(LUMINA_EDITOR_CLASS_PRESETS.tailwind?.btnPrimary).toContain("bg-violet-500");
    expect(LUMINA_EDITOR_TAILWIND_CLASS_NAMES.btnPrimary).toContain("bg-violet-500");
  });
});
