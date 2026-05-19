import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLuminaEditor } from "../useLuminaEditor";

describe("useLuminaEditor", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useLuminaEditor())).toThrowError(
      "useLuminaEditor must be used within <LuminaEditor> or <LuminaEditor.Provider>.",
    );
  });
});
