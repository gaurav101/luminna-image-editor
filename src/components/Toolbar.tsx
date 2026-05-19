import type { CSSProperties, ReactNode } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface ToolbarProps {
  className?: string;
  style?: CSSProperties;
  orientation?: "horizontal" | "vertical";
  children?: ReactNode;
}

export function Toolbar({ className, style, orientation = "vertical", children }: ToolbarProps) {
  const { slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <aside
      className={[slotClassNames.panel, className].filter(Boolean).join(" ")}
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        gap: 8,
        ...slotStyles.panel,
        ...style,
      }}
    >
      {children}
    </aside>
  );
}
