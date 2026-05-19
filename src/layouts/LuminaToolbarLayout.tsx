import { CanvasArea } from "../components/CanvasArea";
import { FilterPresets } from "../components/FilterPresets";
import { Header } from "../components/Header";
import { Logo } from "../components/Logo";
import { Toolbar } from "../components/Toolbar";
import { Adjustments } from "../components/Adjustments";
import { ActionButton } from "../components/ActionButton";
import { ExecuteButton } from "../components/ExecuteButton";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export function LuminaToolbarLayout() {
  const { slotClassNames, slotStyles } = useLuminaEditor();
  return (
    <>
      <Header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Logo />
        <ActionButton action="undo" />
        <ActionButton action="redo" />
        <ExecuteButton />
      </Header>
      <div className={slotClassNames.body} style={{ ...slotStyles.body, display: "flex", flexDirection: "column", gap: 12 }}>
        <Toolbar orientation="horizontal" style={{ marginBottom: 12 }}>
          <FilterPresets />
          <Adjustments />
        </Toolbar>
        <CanvasArea />
      </div>
    </>
  );
}
