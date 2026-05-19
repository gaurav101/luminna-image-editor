import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterPresets } from "../FilterPresets";

const selectFilter = vi.fn();

vi.mock("../../hooks/useLuminaEditor", () => ({
  useLuminaEditor: () => ({
    filterPresets: [
      { id: "none", label: "Original", ops: [] },
      { id: "sepia", label: "Sepia", ops: [{ fn: "sepia" }] },
    ],
    selectedFilter: "none",
    selectFilter,
    thumbnails: { sepia: "data:image/png;base64,sepia" },
    slotClassNames: {
      filterGrid: "",
      fThumb: "",
      fThumbSel: "",
      fThumbImg: "",
      fThumbPh: "",
      fLbl: "",
    },
    slotStyles: {},
  }),
}));

describe("FilterPresets", () => {
  it("renders preset list and custom classes", () => {
    render(<FilterPresets className="root" itemClassName="item" />);
    expect(screen.getByRole("button", { name: /Original/i })).toHaveClass("item");
    expect(screen.getByRole("button", { name: /Sepia/i })).toHaveClass("item");
    expect(screen.getByRole("img", { name: "Sepia" })).toBeInTheDocument();
  });

  it("triggers selection", () => {
    render(<FilterPresets />);
    fireEvent.click(screen.getByRole("button", { name: /Sepia/i }));
    expect(selectFilter).toHaveBeenCalledWith("sepia");
  });
});
