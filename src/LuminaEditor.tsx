import { forwardRef, useImperativeHandle, type CSSProperties, type ReactNode } from "react";
import {
  LuminaEditorProvider,
  type LuminaEditorProviderProps,
  type LuminaFilterPreset,
} from "./context/LuminaEditorContext";
import { useLuminaEditor } from "./hooks/useLuminaEditor";
import { CanvasArea } from "./components/CanvasArea";
import { Header } from "./components/Header";
import { Logo } from "./components/Logo";
import { Toolbar } from "./components/Toolbar";
import { FilterPresets } from "./components/FilterPresets";
import { Adjustments } from "./components/Adjustments";
import { ActionButton } from "./components/ActionButton";
import { ExecuteButton } from "./components/ExecuteButton";
import { LuminaSidebarLayout } from "./layouts/LuminaSidebarLayout";
import { LuminaToolbarLayout } from "./layouts/LuminaToolbarLayout";

export interface LuminaEditorHandle {
  execute: () => ReturnType<ReturnType<typeof useLuminaEditor>["execute"]>;
}

export interface LuminaEditorProps extends Omit<LuminaEditorProviderProps, "children"> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function Root({
  className,
  style,
  children,
  filterPresets,
  outputMimeType,
  styleLibrary,
  classNames,
  styles,
  inlineStyles,
}: LuminaEditorProps) {
  return (
    <LuminaEditorProvider
      filterPresets={filterPresets}
      outputMimeType={outputMimeType}
      styleLibrary={styleLibrary}
      classNames={classNames}
      styles={styles}
      inlineStyles={inlineStyles}
    >
      <RootShell className={className} style={style}>
        {children}
      </RootShell>
    </LuminaEditorProvider>
  );
}

function RootShell({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const { slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <div className={[slotClassNames.root, className].filter(Boolean).join(" ")} style={{ ...slotStyles.root, ...style }}>
      {children}
    </div>
  );
}

function ImperativeBridge({ bindRef }: { bindRef: React.ForwardedRef<LuminaEditorHandle> }) {
  const { execute } = useLuminaEditor();
  useImperativeHandle(
    bindRef,
    () => ({
      execute,
    }),
    [execute],
  );
  return null;
}

type Compound = ReturnType<typeof forwardRef<LuminaEditorHandle, LuminaEditorProps>> & {
  Provider: typeof LuminaEditorProvider;
  CanvasArea: typeof CanvasArea;
  Header: typeof Header;
  Logo: typeof Logo;
  Toolbar: typeof Toolbar;
  FilterPresets: typeof FilterPresets;
  Adjustments: typeof Adjustments;
  ActionButton: typeof ActionButton;
  ExecuteButton: typeof ExecuteButton;
  SidebarLayout: typeof LuminaSidebarLayout;
  ToolbarLayout: typeof LuminaToolbarLayout;
};

const LuminaEditor = forwardRef<LuminaEditorHandle, LuminaEditorProps>(function LuminaEditor(
  { children, ...props },
  ref,
) {
  return (
    <Root {...props}>
      <ImperativeBridge bindRef={ref} />
      {children ?? <LuminaSidebarLayout />}
    </Root>
  );
}) as Compound;

LuminaEditor.Provider = LuminaEditorProvider;
LuminaEditor.CanvasArea = CanvasArea;
LuminaEditor.Header = Header;
LuminaEditor.Logo = Logo;
LuminaEditor.Toolbar = Toolbar;
LuminaEditor.FilterPresets = FilterPresets;
LuminaEditor.Adjustments = Adjustments;
LuminaEditor.ActionButton = ActionButton;
LuminaEditor.ExecuteButton = ExecuteButton;
LuminaEditor.SidebarLayout = LuminaSidebarLayout;
LuminaEditor.ToolbarLayout = LuminaToolbarLayout;

export type { LuminaFilterPreset };
export default LuminaEditor;
