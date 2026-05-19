import type { CSSProperties, ComponentType } from "react";
import { useLuminaEditor } from "../hooks/useLuminaEditor";

export interface FilterPresetsSlots {
  ItemLabel?: ComponentType<{ label: string }>;
}

export interface FilterPresetsProps {
  className?: string;
  style?: CSSProperties;
  itemClassName?: string;
  itemStyle?: CSSProperties;
  slots?: FilterPresetsSlots;
}

export function FilterPresets({
  className,
  style,
  itemClassName,
  itemStyle,
  slots,
}: FilterPresetsProps) {
  const { filterPresets, selectedFilter, selectFilter, thumbnails, slotClassNames, slotStyles } =
    useLuminaEditor();
  const ItemLabel = slots?.ItemLabel;

  return (
    <div className={[slotClassNames.filterGrid, className].filter(Boolean).join(" ")} style={{ ...slotStyles.filterGrid, ...style }}>
      {filterPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={[slotClassNames.fThumb, selectedFilter === preset.id ? slotClassNames.fThumbSel : "", itemClassName].filter(Boolean).join(" ")}
          style={{
            ...slotStyles.fThumb,
            ...itemStyle,
            border: selectedFilter === preset.id ? "1px solid #7C6FF7" : "1px solid transparent",
          }}
          onClick={() => {
            selectFilter(preset.id);
          }}
          aria-pressed={selectedFilter === preset.id}
        >
          {thumbnails[preset.id] ? (
            <img
              src={thumbnails[preset.id]}
              alt={preset.label}
              className={slotClassNames.fThumbImg}
              style={{ width: 48, height: 48, objectFit: "cover", ...slotStyles.fThumbImg }}
            />
          ) : (
            <span className={slotClassNames.fThumbPh}>{preset.label}</span>
          )}
          {ItemLabel ? <ItemLabel label={preset.label} /> : <small className={slotClassNames.fLbl}>{preset.label}</small>}
        </button>
      ))}
    </div>
  );
}
