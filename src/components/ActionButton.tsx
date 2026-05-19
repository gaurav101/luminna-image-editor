import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface ActionButtonProps {
  action: "undo" | "redo";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "disabled">;
}

export function ActionButton({
  action,
  className,
  style,
  children,
  buttonProps,
}: ActionButtonProps) {
  const { undo, redo, canUndo, canRedo, slotClassNames, slotStyles } = useLuminaEditor();
  const isUndo = action === "undo";
  const onClick = isUndo ? undo : redo;
  const disabled = isUndo ? !canUndo : !canRedo;

  return (
    <button
      type="button"
      className={[slotClassNames.btnSm, className].filter(Boolean).join(" ")}
      style={{ ...slotStyles.btnSm, ...style }}
      onClick={onClick}
      disabled={disabled}
      {...buttonProps}
    >
      {children ?? (isUndo ? "Undo" : "Redo")}
    </button>
  );
}
