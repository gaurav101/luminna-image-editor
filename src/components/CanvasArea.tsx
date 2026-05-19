import type { CSSProperties, DragEvent, ReactNode, ComponentType } from "react";
import { useRef } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface CanvasAreaSlots {
  EmptyState?: ComponentType<{ onUploadClick: () => void }>;
  LoadingState?: ComponentType;
}

export interface CanvasAreaProps {
  className?: string;
  style?: CSSProperties;
  emptyState?: ReactNode;
  slots?: CanvasAreaSlots;
}

export function CanvasArea({ className, style, emptyState, slots }: CanvasAreaProps) {
  const { previewUrl, activeOperations, setFile, file, slotClassNames, slotStyles } = useLuminaEditor();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const EmptyStateSlot = slots?.EmptyState;
  const LoadingStateSlot = slots?.LoadingState;

  const handleDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const next = event.dataTransfer.files[0];
    if (next) await setFile(next);
  };

  return (
    <section
      className={[slotClassNames.canvasArea, className].filter(Boolean).join(" ")}
      style={{ ...slotStyles.canvasArea, ...style }}
      onDrop={(e) => void handleDrop(e)}
      onDragOver={(e) => e.preventDefault()}
    >
      {!file && (
        <div className={slotClassNames.dropzone} style={slotStyles.dropzone}>
          {EmptyStateSlot ? (
            <EmptyStateSlot onUploadClick={() => inputRef.current?.click()} />
          ) : (
            (emptyState ?? <p>Drop an image here or click to upload.</p>)
          )}
          <button type="button" onClick={() => inputRef.current?.click()} aria-label="Upload image">
            Upload
          </button>
        </div>
      )}
      {previewUrl && (
        <div className={slotClassNames.previewWrap} style={slotStyles.previewWrap}>
          {activeOperations.isRendering &&
            (LoadingStateSlot ? <LoadingStateSlot /> : <span className={slotClassNames.loadingOverlay}>Rendering…</span>)}
          <img
            src={previewUrl}
            alt="Lumina preview"
            className={slotClassNames.previewImg}
            style={{ display: "block", maxWidth: "100%", ...slotStyles.previewImg }}
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          void setFile(e.target.files?.[0] ?? null);
        }}
      />
    </section>
  );
}
