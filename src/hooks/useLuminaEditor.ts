import { useContext } from "react";
import { LuminaEditorContext } from "../context/LuminaEditorContext";

export function useLuminaEditor() {
  const context = useContext(LuminaEditorContext);
  if (!context) {
    throw new Error(
      "useLuminaEditor must be used within <LuminaEditor> or <LuminaEditor.Provider>.",
    );
  }
  return context;
}
