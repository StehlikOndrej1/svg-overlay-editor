function roundPointValue(value) {
  return Math.round(value * 100) / 100;
}

export function normalizeElementGeometry(element) {
  return {
    ...element,
    points: Array.isArray(element.points) ? element.points : [],
    holes: Array.isArray(element.holes)
      ? element.holes.map(ring => (Array.isArray(ring) ? ring : [])).filter(ring => ring.length >= 3)
      : [],
  };
}

export function pointsToPathSegment(points = []) {
  if (!Array.isArray(points) || points.length === 0) return '';
  return `M ${points.map(point => `${roundPointValue(point.x)} ${roundPointValue(point.y)}`).join(' L ')} Z`;
}

export function buildElementPathData(element) {
  const geometry = normalizeElementGeometry(element);
  return [geometry.points, ...geometry.holes]
    .filter(ring => ring.length >= 3)
    .map(pointsToPathSegment)
    .filter(Boolean)
    .join(' ');
}

function parsePointsString(pointsStr = '') {
  return pointsStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(pair => pair.split(',').map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y]) => ({ x, y }));
}

export function parsePathData(pathData = '') {
  const tokens = pathData.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const rings = [];
  let ring = [];
  let command = null;
  let cursor = { x: 0, y: 0 };
  let startPoint = null;
  let index = 0;

  const closeRing = () => {
    if (ring.length === 0) return;
    const normalized = [...ring];
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (first && last && first.x === last.x && first.y === last.y) normalized.pop();
    if (normalized.length >= 3) rings.push(normalized);
    ring = [];
    startPoint = null;
  };

  const readNumber = () => {
    const token = tokens[index];
    if (token == null || /^[a-zA-Z]$/.test(token)) return null;
    index += 1;
    return Number(token);
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (/^[a-zA-Z]$/.test(token)) {
      command = token;
      index += 1;
      if (command === 'Z' || command === 'z') {
        const closedAt = startPoint ? { ...startPoint } : null;
        closeRing();
        if (closedAt) cursor = closedAt;
      }
      continue;
    }

    if (!command) break;

    if (command === 'M' || command === 'm') {
      const x = readNumber();
      const y = readNumber();
      if (x == null || y == null) break;
      closeRing();
      cursor = command === 'm' ? { x: cursor.x + x, y: cursor.y + y } : { x, y };
      startPoint = { ...cursor };
      ring.push({ ...cursor });
      command = command === 'm' ? 'l' : 'L';
      continue;
    }

    if (command === 'L' || command === 'l') {
      const x = readNumber();
      const y = readNumber();
      if (x == null || y == null) break;
      cursor = command === 'l' ? { x: cursor.x + x, y: cursor.y + y } : { x, y };
      ring.push({ ...cursor });
      continue;
    }

    if (command === 'H' || command === 'h') {
      const x = readNumber();
      if (x == null) break;
      cursor = command === 'h' ? { ...cursor, x: cursor.x + x } : { ...cursor, x };
      ring.push({ ...cursor });
      continue;
    }

    if (command === 'V' || command === 'v') {
      const y = readNumber();
      if (y == null) break;
      cursor = command === 'v' ? { ...cursor, y: cursor.y + y } : { ...cursor, y };
      ring.push({ ...cursor });
      continue;
    }

    break;
  }

  closeRing();
  return rings;
}

function extractGeometryFromNode(node) {
  if (!node) return { points: [], holes: [] };

  if (node.tagName.toLowerCase() === 'polygon') {
    return { points: parsePointsString(node.getAttribute('points') || ''), holes: [] };
  }

  if (node.tagName.toLowerCase() === 'path') {
    const rings = parsePathData(node.getAttribute('d') || '');
    return {
      points: rings[0] || [],
      holes: rings.slice(1),
    };
  }

  return { points: [], holes: [] };
}

export function generateSVG(elements, imgWidth, imgHeight) {
  let paths = '';
  elements.forEach(element => {
    const el = normalizeElementGeometry(element);
    const pathData = buildElementPathData(el);
    if (!pathData) return;

    let attrs = ` data-overlay-id="${el.id}"`;
    if (el.groupName) attrs += ` data-group="${el.groupName}"`;
    el.attributes.forEach(attribute => {
      if (attribute.key && attribute.key !== 'id') {
        attrs += ` data-${attribute.key.toLowerCase().replace(/\s+/g, '-')}="${attribute.value}"`;
      }
    });

    paths += `  <path d="${pathData}"${attrs} fill="rgba(59,130,246,0.25)" fill-rule="evenodd" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" />\n`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imgWidth} ${imgHeight}" width="${imgWidth}" height="${imgHeight}">\n${paths}</svg>`;
}

export function parseSVGFile(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const overlayNodes = doc.querySelectorAll('[data-overlay-id]');

  return Array.from(overlayNodes)
    .map(node => {
      const attrs = [];
      const groupName = node.getAttribute('data-group') || null;

      Array.from(node.attributes).forEach(attribute => {
        if (attribute.name.startsWith('data-') && attribute.name !== 'data-overlay-id' && attribute.name !== 'data-group') {
          attrs.push({ key: attribute.name.replace('data-', ''), value: attribute.value });
        }
      });

      const geometry = extractGeometryFromNode(node);
      if (geometry.points.length < 3) return null;

      return {
        id: node.getAttribute('data-overlay-id'),
        points: geometry.points,
        holes: geometry.holes,
        attributes: attrs,
        groupName,
      };
    })
    .filter(Boolean);
}
