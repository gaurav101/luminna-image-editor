import type { CSSProperties, ReactNode } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface HeaderProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Header({ className, style, children }: HeaderProps) {
  const { slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <header className={[slotClassNames.header, className].filter(Boolean).join(" ")} style={{ ...slotStyles.header, ...style }}>
      {children}
    </header>
  );
}
