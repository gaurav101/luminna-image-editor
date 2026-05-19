import type { CSSProperties } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface LogoProps {
  className?: string;
  style?: CSSProperties;
  label?: string;
}

export function Logo({ className, style, label = "LuminaEditor" }: LogoProps) {
  const { slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <strong className={[slotClassNames.logo, className].filter(Boolean).join(" ")} style={{ ...slotStyles.logo, ...style }}>
      {label}
    </strong>
  );
}
