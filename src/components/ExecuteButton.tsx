import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface ExecuteButtonProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;
}

export function ExecuteButton({ className, style, children, buttonProps }: ExecuteButtonProps) {
  const { execute, activeOperations, slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <button
      type="button"
      className={[slotClassNames.btnPrimary, className].filter(Boolean).join(" ")}
      style={{ ...slotStyles.btnPrimary, ...style }}
      onClick={() => void execute()}
      disabled={activeOperations.isExecuting}
      {...buttonProps}
    >
      {children ?? "Execute"}
    </button>
  );
}
