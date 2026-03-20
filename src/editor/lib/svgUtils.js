export function generateSVG(elements, imgWidth, imgHeight) {
  let polys = '';
  elements.forEach(el => {
    const pts = el.points.map(p => `${p.x},${p.y}`).join(' ');
    let attrs = ` data-overlay-id="${el.id}"`;
    if (el.groupName) attrs += ` data-group="${el.groupName}"`;
    el.attributes.forEach(a => {
      if (a.key && a.key !== 'id') attrs += ` data-${a.key.toLowerCase().replace(/\s+/g, '-')}="${a.value}"`;
    });
    polys += `  <polygon points="${pts}"${attrs} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" />\n`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imgWidth} ${imgHeight}" width="${imgWidth}" height="${imgHeight}">\n${polys}</svg>`;
}

export function parseSVGFile(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const polys = doc.querySelectorAll('[data-overlay-id]');
  return Array.from(polys).map(p => {
    const attrs = [];
    const groupName = p.getAttribute('data-group') || null;
    Array.from(p.attributes).forEach(a => {
      if (a.name.startsWith('data-') && a.name !== 'data-overlay-id' && a.name !== 'data-group') {
        attrs.push({ key: a.name.replace('data-', ''), value: a.value });
      }
    });
    const pointsStr = p.getAttribute('points') || '';
    const points = pointsStr.split(/\s+/).filter(Boolean).map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
    return { id: p.getAttribute('data-overlay-id'), points, attributes: attrs, groupName };
  });
}
