export function createGeometry(exterior = [], holes = []) {
  return { exterior, holes };
}

export function normalizeGeometry(element) {
  if (element?.geometry?.exterior) return element.geometry;
  if (Array.isArray(element?.points)) return createGeometry(element.points, []);
  return createGeometry([], []);
}

export function getRingRefs(geometry) {
  return [
    { type: 'exterior' },
    ...geometry.holes.map((_, index) => ({ type: 'hole', holeIndex: index })),
  ];
}

export function getRingPoints(geometry, ringRef) {
  if (!ringRef || ringRef.type === 'exterior') return geometry.exterior;
  return geometry.holes[ringRef.holeIndex] || [];
}

export function updateRingPoints(geometry, ringRef, points) {
  if (!ringRef || ringRef.type === 'exterior') {
    return { ...geometry, exterior: points };
  }

  return {
    ...geometry,
    holes: geometry.holes.map((hole, index) => (index === ringRef.holeIndex ? points : hole)),
  };
}

export function addHoleToGeometry(geometry, holePoints) {
  return {
    ...geometry,
    holes: [...geometry.holes, holePoints],
  };
}

export function removeHoleFromGeometry(geometry, holeIndex) {
  return {
    ...geometry,
    holes: geometry.holes.filter((_, index) => index !== holeIndex),
  };
}

export function geometryToPathData(geometry) {
  const rings = [geometry.exterior, ...geometry.holes].filter(ring => ring.length >= 3);
  return rings.map(ringToPathData).join(' ');
}

export function ringToPathData(ring) {
  if (!ring || ring.length < 3) return '';
  const [first, ...rest] = ring;
  const commands = [`M ${first.x},${first.y}`];
  rest.forEach(point => commands.push(`L ${point.x},${point.y}`));
  commands.push('Z');
  return commands.join(' ');
}

export function pointsToSvgString(points) {
  return points.map(point => `${point.x},${point.y}`).join(' ');
}

export function countGeometryPoints(geometry) {
  return geometry.exterior.length + geometry.holes.reduce((sum, hole) => sum + hole.length, 0);
}

export function parsePathRings(pathData) {
  if (!pathData) return [];
  const matches = pathData.match(/M\s*[^MZ]+Z/gi) || [];
  return matches.map(segment => {
    const values = (segment.match(/-?\d*\.?\d+/g) || []).map(Number);
    const points = [];
    for (let index = 0; index < values.length; index += 2) {
      const x = values[index];
      const y = values[index + 1];
      if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
    }
    return points;
  }).filter(ring => ring.length >= 3);
}

export function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].x;
    const yi = ring[i].y;
    const xj = ring[j].x;
    const yj = ring[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function orientation(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  return b.x <= Math.max(a.x, c.x) + 1e-9
    && b.x + 1e-9 >= Math.min(a.x, c.x)
    && b.y <= Math.max(a.y, c.y) + 1e-9
    && b.y + 1e-9 >= Math.min(a.y, c.y);
}

export function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}

export function ringsIntersect(ringA, ringB) {
  for (let i = 0; i < ringA.length; i += 1) {
    const a1 = ringA[i];
    const a2 = ringA[(i + 1) % ringA.length];
    for (let j = 0; j < ringB.length; j += 1) {
      const b1 = ringB[j];
      const b2 = ringB[(j + 1) % ringB.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function validateHoleRing(geometry, holePoints, skipHoleIndex = null) {
  if (holePoints.length < 3) return { ok: false, reason: 'Díra musí mít alespoň 3 body.' };
  if (!holePoints.every(point => pointInRing(point, geometry.exterior))) {
    return { ok: false, reason: 'Díra musí ležet uvnitř exterior ringu.' };
  }
  if (ringsIntersect(holePoints, geometry.exterior)) {
    return { ok: false, reason: 'Díra se nesmí protínat s exterior ringem.' };
  }

  const otherHoles = geometry.holes.filter((_, index) => index !== skipHoleIndex);
  if (otherHoles.some(hole => ringsIntersect(holePoints, hole) || holePoints.some(point => pointInRing(point, hole)) || hole.some(point => pointInRing(point, holePoints)))) {
    return { ok: false, reason: 'Díry se nesmí vzájemně překrývat ani protínat.' };
  }

  return { ok: true };
}
