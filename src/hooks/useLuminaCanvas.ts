import { useMemo } from "react";
import { lumina } from "@gks101/luminajs";
import type {
  LuminaAdjustmentState,
  LuminaExecuteResult,
  LuminaFilterPreset,
  LuminaTransformState,
} from "../context/LuminaEditorContext";

type LuminaChain = Record<string, (...args: unknown[]) => LuminaChain> & {
  toDataURL: (mimeType?: string) => Promise<string>;
};

type Ops = LuminaFilterPreset["ops"];

function callIfAvailable(chain: LuminaChain, fn: string, ...args: unknown[]): LuminaChain {
  if (typeof chain[fn] !== "function") return chain;
  return chain[fn](...args) as LuminaChain;
}

function applyOps(chain: LuminaChain, ops: Ops): LuminaChain {
  let next = chain;
  for (const op of ops) {
    next = callIfAvailable(next, op.fn, op.arg);
  }
  return next;
}

export interface RenderOptions {
  file: File;
  ops: Ops;
  adjustments: LuminaAdjustmentState;
  transform: LuminaTransformState;
  mimeType?: string;
}

export interface BuildPreviewOptions {
  file: File;
  ops: Ops;
  size?: number;
}

export function useLuminaCanvas() {
  return useMemo(() => {
    const render = async ({
      file,
      ops,
      adjustments,
      transform,
      mimeType = "image/png",
    }: RenderOptions): Promise<string> => {
      let chain = applyOps(lumina(file) as unknown as LuminaChain, ops);
      chain = callIfAvailable(chain, "brightness", adjustments.brightness);
      chain = callIfAvailable(chain, "contrast", adjustments.contrast);
      if (adjustments.blur > 0) chain = callIfAvailable(chain, "blur", Math.round(adjustments.blur));
      if (adjustments.sharpen > 0) chain = callIfAvailable(chain, "sharpen", Math.round(adjustments.sharpen));
      if (transform.crop) {
        chain = callIfAvailable(
          chain,
          "crop",
          transform.crop.x,
          transform.crop.y,
          transform.crop.width,
          transform.crop.height,
        );
      }
      if (transform.resize) {
        chain = callIfAvailable(chain, "resize", transform.resize.width, transform.resize.height);
      }
      return chain.toDataURL(mimeType);
    };

    return {
      render,
      async buildPreview({ file, ops, size = 56 }: BuildPreviewOptions): Promise<string> {
        let chain = lumina(file) as unknown as LuminaChain;
        chain = callIfAvailable(chain, "resize", size, size);
        chain = applyOps(chain, ops);
        return chain.toDataURL("image/png");
      },
      async execute({
        file,
        ops,
        adjustments,
        transform,
        mimeType = "image/png",
      }: RenderOptions): Promise<LuminaExecuteResult> {
        const dataUrl = await render({ file, ops, adjustments, transform, mimeType });
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const output = new File([blob], `lumina-output.${mimeType.split("/")[1] ?? "png"}`, {
          type: blob.type || mimeType,
        });
        const objectUrl = URL.createObjectURL(blob);
        return {
          dataUrl,
          blob,
          file: output,
          objectUrl,
          revokeObjectUrl: () => URL.revokeObjectURL(objectUrl),
        };
      },
    };
  }, []);
}
