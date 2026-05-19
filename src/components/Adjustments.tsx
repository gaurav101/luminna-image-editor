import type { CSSProperties } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface AdjustmentsProps {
  className?: string;
  style?: CSSProperties;
}

export function Adjustments({ className, style }: AdjustmentsProps) {
  const { adjustments, setAdjustment, slotClassNames, slotStyles } = useLuminaEditor();

  const rows = [
    { key: "brightness", label: "Brightness", min: -255, max: 255, value: adjustments.brightness },
    { key: "contrast", label: "Contrast", min: -100, max: 100, value: adjustments.contrast },
    { key: "blur", label: "Blur", min: 0, max: 30, value: adjustments.blur },
    { key: "sharpen", label: "Sharpen", min: 0, max: 5, value: adjustments.sharpen },
  ] as const;

  return (
    <div className={[slotClassNames.panelBody, className].filter(Boolean).join(" ")} style={{ ...slotStyles.panelBody, ...style }}>
      {rows.map((row) => (
        <div key={row.key} className={slotClassNames.sliderRow} style={slotStyles.sliderRow}>
          <div className={slotClassNames.sliderHdr} style={slotStyles.sliderHdr}>
            <span className={slotClassNames.sliderLbl} style={slotStyles.sliderLbl}>
              {row.label}
            </span>
            <span className={slotClassNames.sliderVal} style={slotStyles.sliderVal}>
              {row.value}
            </span>
          </div>
          <input
            className={slotClassNames.rangeInput}
            style={slotStyles.rangeInput}
            aria-label={row.label}
            type="range"
            min={row.min}
            max={row.max}
            value={row.value}
            onChange={(e) =>
              setAdjustment(row.key, Number(e.target.value) as (typeof adjustments)[typeof row.key])
            }
          />
        </div>
      ))}
    </div>
  );
}
