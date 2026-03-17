# SVG Overlay Editor

A browser-based tool for creating interactive SVG overlays on top of raster images. Draw polygons over buildings, areas, or any objects in a photo, assign custom attributes to each element, and export everything as a clean SVG file. Includes a lightweight JS library so anyone can embed the interactive overlay on their own website.

**[Live Demo →](https://stehlikondrej1.github.io/svg-overlay-editor/)**

---

## What is this for?

Imagine you have a photo of a city block and want to make each building clickable — with its own name, address, year built, or any other metadata. This tool lets you:

1. **Trace buildings** (or any objects) as polygons directly on the image
2. **Attach custom attributes** to each polygon (key-value pairs you define)
3. **Export a clean SVG** with all data stored in `data-*` attributes
4. **Embed it on any website** using the included JS library

The exported SVG is self-contained — no special format, no proprietary schema. Just standard SVG with `data-*` attributes that any developer can work with.

---

## Features

### Editor
- **Two modes** — create a new overlay from scratch, or load an existing SVG to continue editing
- **Polygon drawing** — click to place vertices, close the shape by clicking the first point or double-clicking
- **Geometry editing** — drag vertices to reposition, click edge midpoints to add new vertices, right-click to remove
- **Attribute groups** — define reusable attribute templates (e.g., "Building" with keys *type, material, year*), then just fill in values for each polygon
- **Inline rename** — double-click or press F2 to rename elements
- **Zoom & pan** — scroll wheel zooms to cursor position, Ctrl+drag pans (works like Google Maps)
- **Keyboard shortcuts** — Esc to cancel drawing, F2 to rename, Delete to remove selected element

### Validator
- Upload the original image + exported SVG side by side
- Click any polygon to inspect its attributes
- Verify alignment and data correctness before publishing

### Export
- **SVG file** — clean markup with `data-overlay-id`, `data-group`, and your custom `data-*` attributes on each polygon
- **JS library** (`svg-overlay-map.js`) — drop-in script for making the overlay interactive on any website

---

## Quick Start

### Use the online editor

Go to **[stehlikondrej1.github.io/svg-overlay-editor](https://stehlikondrej1.github.io/svg-overlay-editor/)** — no installation needed.

### Run locally

```bash
git clone https://github.com/StehlikOndrej1/svg-overlay-editor.git
cd svg-overlay-editor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Using the exported SVG on your website

### 1. Include the library

Download `svg-overlay-map.js` from the editor (or copy it from the repo) and add it to your page:

```html
<script src="svg-overlay-map.js"></script>
```

### 2. Create a container

```html
<div id="map-container"></div>
```

### 3. Initialize

```html
<script>
  const map = new SVGOverlayMap({
    container: '#map-container',
    image: 'city-photo.jpg',
    svg: 'overlay.svg',
    onElementClick: (element, event) => {
      console.log('Clicked:', element.id);
      console.log('Attributes:', element.attrs);
      console.log('Geometry:', element.geometry);
    },
    onElementHover: (element, event) => {
      map.highlight(element.id);
    }
  });
</script>
```

### API Reference

| Method | Description |
|--------|-------------|
| `getElement(id)` | Returns `{ id, attrs, geometry }` for a single element |
| `getAllElements()` | Returns array of all elements |
| `queryByAttr(key, value)` | Find elements by attribute value |
| `highlight(id, color?)` | Highlight an element (default: yellow) |
| `resetHighlight(id)` | Reset element to default color |

### SVG Structure

The exported SVG uses standard `data-*` attributes:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <polygon
    points="100,200 300,200 300,400 100,400"
    data-overlay-id="building_01"
    data-group="Building"
    data-type="residential"
    data-year="1985"
    data-address="Main Street 42"
    fill="rgba(59,130,246,0.25)"
    stroke="#3b82f6"
    stroke-width="2"
  />
</svg>
```

No proprietary format — you can parse it with any XML/SVG library or even query elements with plain JavaScript:

```javascript
document.querySelectorAll('[data-overlay-id]').forEach(el => {
  console.log(el.dataset.overlayId, el.dataset.type);
});
```

---

## Keyboard Shortcuts (Editor)

| Key | Action |
|-----|--------|
| **Click** | Add polygon vertex / Select element |
| **Double-click** | Close polygon / Rename element |
| **Scroll wheel** | Zoom to cursor |
| **Ctrl + drag** | Pan canvas |
| **F2** | Rename selected element |
| **Delete** | Delete selected element |
| **Esc** | Cancel current drawing / Exit geometry edit |
| **Right-click** (on vertex) | Remove vertex (geometry edit mode) |

---

## Tech Stack

- **React** — UI components
- **Vite** — build tool and dev server
- **Vanilla SVG** — all drawing and geometry handled with native SVG elements
- **Zero dependencies** — the exported JS library has no external dependencies

---

## Project Structure

```
svg-overlay-editor/
├── src/
│   ├── App.jsx          # Main application (editor + validator)
│   └── main.jsx         # React entry point
├── public/
│   └── icons.svg
├── index.html
├── vite.config.js
└── package.json
```

---

## Development

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Build for production (output in dist/)
npm run preview   # Preview production build locally
```

---

## License

MIT
