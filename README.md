# LuminaEditor

A typed React image editor powered by **[@gks101/luminajs](https://github.com/gaurav101/LuminaJS)**. It provides image upload, live preview, filter presets, adjustments, crop, resize, effects, watermarking, export, undo support, and a configurable styling API for Tailwind, Bootstrap, Material-style classes, or your own CSS system.

## Install

```bash
npm install lumina-editor @gks101/luminajs
```

`react` and `react-dom` are peer dependencies. Most React apps already have them installed:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import LuminaEditor from "lumina-editor";

export default function App() {
  return (
    <LuminaEditor
      onExport={(dataUrl) => {
        console.log("Exported image:", dataUrl);
      }}
    />
  );
}
```

## Styling

LuminaEditor ships with inline default styles, so it works without adding CSS. You can also map its UI slots to a CSS library.

```tsx
<LuminaEditor styleLibrary="tailwind" />
<LuminaEditor styleLibrary="bootstrap" />
<LuminaEditor styleLibrary="material" />
```

The presets only add class names. You still need to load the matching CSS library in your app.

For full control, disable inline styles and provide classes for the slots you want to own:

```tsx
<LuminaEditor
  inlineStyles={false}
  classNames={{
    root: "min-h-screen flex flex-col bg-white text-slate-950",
    header: "flex items-center justify-between border-b px-4 py-3",
    btnPrimary: "btn btn-primary",
    btnSm: "btn btn-outline-secondary btn-sm",
    panel: "w-80 border-start",
    numInput: "form-control form-control-sm",
  }}
/>
```

You can keep the default layout and override individual inline styles:

```tsx
<LuminaEditor
  styles={{
    root: { background: "#ffffff", color: "#111827" },
    btnPrimary: { background: "#0d6efd" },
  }}
/>
```

Common slot keys include `root`, `header`, `logo`, `btnSm`, `btnPrimary`, `body`, `canvasArea`, `dropzone`, `previewWrap`, `panel`, `tabs`, `tab`, `tabActive`, `panelBody`, `filterGrid`, `fThumb`, `fThumbSel`, `sliderRow`, `rangeInput`, `numInput`, `presetBtn`, `applyBtn`, `effectRow`, `toggleTrack`, `infoBar`, and `infoPill`.

## Props

| Prop               | Type                                                                      | Default     | Description                                                                           |
| ------------------ | ------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `onExport`         | `(dataUrl: string) => void`                                               | `undefined` | Called after the user exports the image.                                              |
| `onExecute`        | `(processedImage, options) => void \| Promise<void>`                      | `undefined` | Runs with the processed image payload for uploads, previews, downloads, or app logic. |
| `executeLabel`     | `string`                                                                  | `'⬇ PNG'`   | Label for the primary execute button.                                                 |
| `executeFormat`    | `'png' \| 'jpg' \| 'jpeg' \| 'webp' \| string`                            | `'png'`     | Default output format for the primary execute button and `execute()`.                 |
| `autoDownload`     | `boolean`                                                                 | `true`      | Downloads the processed image automatically after execute.                            |
| `styleLibrary`     | `'lumina' \| 'tailwind' \| 'bootstrap' \| 'material' \| 'none' \| string` | `'lumina'`  | Selects a built-in class preset. Unknown values keep the default Lumina slot classes. |
| `classNames`       | `Partial<Record<LuminaEditorStyleSlot, string>>`                          | `{}`        | Adds classes per UI slot so any CSS library can style the editor.                     |
| `styles`           | `Partial<Record<LuminaEditorStyleSlot, CSSProperties>>`                   | `{}`        | Overrides inline styles per UI slot.                                                  |
| `inlineStyles`     | `boolean`                                                                 | `true`      | Set `false` when your CSS library should own all visual styling.                      |
| `className`        | `string`                                                                  | `undefined` | Extra class for the root element.                                                     |
| `style`            | `CSSProperties`                                                           | `undefined` | Extra inline style for the root element.                                              |
| `layout`           | `'sidebar' \| 'toolbar'`                                                  | `'sidebar'` | Shows settings in a side panel or a compact toolbar above/below the image.            |
| `controlsPosition` | `'top' \| 'bottom'`                                                       | `'bottom'`  | Toolbar placement when `layout="toolbar"`.                                            |
| `responsive`       | `boolean`                                                                 | `true`      | Automatically switches to toolbar layout below `mobileBreakpoint`.                    |
| `mobileBreakpoint` | `number`                                                                  | `760`       | Viewport width, in pixels, where responsive toolbar layout is used.                   |
| `fullScreen`       | `boolean`                                                                 | `true`      | Uses viewport-height sizing. Set `false` when embedding inside forms or sidebars.     |
| `height`           | `CSSProperties['height']`                                                 | `undefined` | Explicit root height for embedded layouts.                                            |
| `minHeight`        | `CSSProperties['minHeight']`                                              | `undefined` | Explicit root minimum height.                                                         |
| `maxHeight`        | `CSSProperties['maxHeight']`                                              | `undefined` | Explicit root maximum height.                                                         |
| `panelWidth`       | `CSSProperties['width']`                                                  | `290`       | Width of the side panel when `layout="sidebar"`.                                      |

Embedded form/sidebar example:

```tsx
<LuminaEditor fullScreen={false} height={520} layout="toolbar" controlsPosition="bottom" />
```

Custom processed-image action:

```tsx
<LuminaEditor
  autoDownload={false}
  executeLabel="Upload image"
  onExecute={async ({ file, blob, dataUrl, objectUrl, revokeObjectUrl }) => {
    const formData = new FormData();
    formData.append("image", file);
    await fetch("/api/upload", { method: "POST", body: formData });
    revokeObjectUrl();
  }}
/>
```

Imperative execute method:

```tsx
import { useRef } from "react";
import LuminaEditor from "lumina-editor";
import type { LuminaEditorHandle } from "lumina-editor";

function FormEditor() {
  const editorRef = useRef<LuminaEditorHandle | null>(null);

  return (
    <>
      <LuminaEditor ref={editorRef} autoDownload={false} />
      <button
        onClick={async () => {
          const result = await editorRef.current?.execute({
            format: "webp",
            fileName: "profile.webp",
            download: false,
          });
          if (result) {
            console.log(result.blob, result.dataUrl, result.objectUrl);
            result.revokeObjectUrl();
          }
        }}
      >
        Save processed image
      </button>
    </>
  );
}
```

## Exports

```tsx
import LuminaEditor, {
  LUMINA_EDITOR_CLASS_PRESETS,
  LUMINA_EDITOR_DEFAULT_CLASS_NAMES,
  LUMINA_EDITOR_TAILWIND_CLASS_NAMES,
  LUMINA_EDITOR_STYLE_SLOTS,
} from "lumina-editor";

import type {
  LuminaEditorClassNames,
  LuminaEditorControlsPosition,
  LuminaEditorExecuteOptions,
  LuminaEditorHandle,
  LuminaEditorLayout,
  LuminaEditorOutputFormat,
  LuminaEditorProcessedImage,
  LuminaEditorProps,
  LuminaEditorStyleLibrary,
  LuminaEditorStyles,
  LuminaEditorStyleSlot,
} from "lumina-editor";
```

Styling presets also have a dedicated subpath so consumers can import preset metadata without importing the editor component:

```tsx
import {
  LUMINA_EDITOR_BOOTSTRAP_CLASS_NAMES,
  LUMINA_EDITOR_MATERIAL_CLASS_NAMES,
  LUMINA_EDITOR_TAILWIND_CLASS_NAMES,
} from "lumina-editor/style-presets";
```

## Features

| Editor Feature    | LuminaJS API                                          |
| ----------------- | ----------------------------------------------------- |
| Filter presets    | `lumina(src).grayscale()`, `.sepia()`, chained combos |
| Brightness        | `lumina(src).brightness(level)`                       |
| Contrast          | `lumina(src).contrast(level)`                         |
| Box blur          | `lumina(src).blur(radius)`                            |
| Gaussian blur     | `lumina(src).gaussianBlur(sigma)`                     |
| Sharpen           | `lumina(src).sharpen()`                               |
| Emboss            | `lumina(src).emboss()`                                |
| Edge detection    | `lumina(src).edgeDetection()`                         |
| Watermark         | `lumina(src).watermark(text, { x, y, font, color })`  |
| Crop              | `lumina(src).crop(x, y, w, h).toBlob()`               |
| Resize            | `lumina(src).resize(w, h).toBlob()`                   |
| Export            | `lumina(src).[chain].toDataURL("image/png")`          |
| Filter thumbnails | `lumina(src).resize(80, 80).[filter]().toDataURL()`   |

## Development

```bash
npm install
npm run dev
npm run demo
npm run storybook
npm run lint
npm run format:check
npm run test
npm run build
```

Useful scripts:

| Script                    | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run dev`             | Start the Vite playground.                                       |
| `npm run demo`            | Start the CSS library switching demo at `http://localhost:5174`. |
| `npm run demo:build`      | Build the CSS library switching demo.                            |
| `npm run storybook`       | Start Storybook for LuminaEditor prop and layout stories.        |
| `npm run storybook:build` | Build Storybook into `demo/storybook-static`.                    |
| `npm run build`           | Type-check, build ES/UMD bundles, and emit declarations.         |
| `npm run lint`            | Run ESLint.                                                      |
| `npm run format`          | Format files with Prettier.                                      |
| `npm run format:check`    | Verify Prettier formatting.                                      |
| `npm run test`            | Run the Vitest test suite once.                                  |
| `npm run test:watch`      | Run Vitest in watch mode.                                        |
| `npm run clean`           | Remove build output and TypeScript build info.                   |
| `npm run prepublishOnly`  | Run lint, format check, tests, and build before npm publishing.  |



Before publishing, confirm the npm package name is the one you want. If publishing under a scope, update `name`, `repository`, `homepage`, and `bugs` in `package.json`.

## CSS Library Demo

The `demo/` app demonstrates the same `LuminaEditor` instance with different styling implementations. Use the buttons in the toolbar to load and apply:

- Lumina default inline styling
- Tailwind CDN plus the built-in Tailwind class preset
- Bootstrap CDN plus the built-in Bootstrap class preset
- Material-style class names with local demo CSS
- A fully custom `classNames` map

```bash
npm run demo
```

Open `http://localhost:5174`, choose a CSS implementation, then upload an image to compare the editor UI across styling systems.

## Storybook

Storybook lives in `demo/.storybook` and stories live in `demo/src`. The stories cover every public `LuminaEditor` prop through controls and dedicated examples:

- Fullscreen sidebar
- Embedded form layout
- Toolbar above and below the image
- Narrow sidebar
- Responsive/mobile mode
- Tailwind, Bootstrap, Material-style, and custom class map styling
- Inline style overrides
- All props configured together

```bash
npm run storybook
```

Open `http://localhost:6006` to inspect the stories and adjust props from the controls panel.

## License

MIT
