import { createGeometry, geometryToPathData, parsePathRings } from '../../shared/lib/geometry.js';

export function generateSVG(elements, imgWidth, imgHeight) {
  let shapes = '';
  elements.forEach(el => {
    const pathData = geometryToPathData(el.geometry);
    let attrs = ` data-overlay-id="${el.id}"`;
    if (el.groupName) attrs += ` data-group="${el.groupName}"`;
    el.attributes.forEach(a => {
      if (a.key && a.key !== 'id') attrs += ` data-${a.key.toLowerCase().replace(/\s+/g, '-')}="${a.value}"`;
    });
    shapes += `  <path d="${pathData}"${attrs} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" fill-rule="evenodd" />\n`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imgWidth} ${imgHeight}" width="${imgWidth}" height="${imgHeight}">\n${shapes}</svg>`;
}

export function parseSVGFile(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const shapes = doc.querySelectorAll('[data-overlay-id]');
  return Array.from(shapes).map(shape => {
    const attrs = [];
    const groupName = shape.getAttribute('data-group') || null;
    Array.from(shape.attributes).forEach(a => {
      if (a.name.startsWith('data-') && a.name !== 'data-overlay-id' && a.name !== 'data-group') {
        attrs.push({ key: a.name.replace('data-', ''), value: a.value });
      }
    });

    let geometry = createGeometry([], []);
    const tag = shape.tagName.toLowerCase();
    if (tag === 'polygon') {
      const pointsStr = shape.getAttribute('points') || '';
      const exterior = pointsStr.split(/\s+/).filter(Boolean).map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });
      geometry = createGeometry(exterior, []);
    } else if (tag === 'path') {
      const rings = parsePathRings(shape.getAttribute('d') || '');
      geometry = createGeometry(rings[0] || [], rings.slice(1));
    }

    return { id: shape.getAttribute('data-overlay-id'), geometry, attributes: attrs, groupName };
  });
}
