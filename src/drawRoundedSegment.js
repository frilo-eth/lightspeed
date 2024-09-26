/**
 * Outlines a line segment (a, b) with rounded caps on either side, and the ability
 * to adjust the ellipsoid-ness of the rounded caps to create a more 'stubby' edge.
 *
 * @license MIT
 * @author Matt DesLauriers (@mattdesl)
 */

export default function drawRoundedSegment(
  a,
  b,
  lineWidth,
  capSegments = 32,
  ellipsoid = 1
) {
  let normX = b[0] - a[0];
  let normY = b[1] - a[1];
  const normLenSqr = normX * normX + normY * normY;
  const normLen = normLenSqr !== 0 ? Math.sqrt(normLenSqr) : normLenSqr;
  normX /= normLen;
  normY /= normLen;

  const perpX = -normY;
  const perpY = normX;

  const lineHalf = lineWidth / 2;
  const points = [];

  // first segment edge
  drawEdge(points, a, b, perpX, perpY, lineHalf);

  // prepare second segment edge
  const nextPoints = [];
  drawEdge(nextPoints, b, a, perpX, perpY, -lineHalf);

  // first cap after first segment
  drawCap(
    points,
    points[points.length - 1],
    nextPoints[0],
    normX,
    normY,
    capSegments,
    ellipsoid
  );

  // now add in the already prepared second segment edge
  nextPoints.forEach((p) => points.push(p));

  // finalise with second cap
  drawCap(
    points,
    nextPoints[nextPoints.length - 1],
    points[0],
    -normX,
    -normY,
    capSegments,
    ellipsoid
  );

  return points;
}

function drawEdge(out = [], a, b, dx, dy, rad) {
  // segment edge
  [0, 1].forEach((t) => {
    const px = lerp(a[0], b[0], t);
    const py = lerp(a[1], b[1], t);
    out.push([px + dx * rad, py + dy * rad]);
  });
}

function drawCap(
  out = [],
  prevPoint,
  nextPoint,
  nx,
  ny,
  capSegments = 32,
  ellipsoid = 1
) {
  const midPoint = lerpArray(prevPoint, nextPoint, 0.5); // Calculate midpoint
  const radius = vec2Dist(prevPoint, nextPoint) / 2; // Calculate radius

  for (let i = 0; i < capSegments; i++) {
    const t = i / capSegments;
    const stepAngle = Math.PI * t;
    const angle = -stepAngle + Math.PI / 2;

    const r = radius;
    const dx = Math.cos(angle) * r * ellipsoid;
    const dy = Math.sin(angle) * r;

    // Calculate new point position using the pushDir to orient the cap correctly
    const c = [
      midPoint[0] + dx * nx - dy * ny,
      midPoint[1] + dx * ny + dy * nx,
    ];

    out.push(c);
  }
  return out;
}

function vec2Dist(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(min, max, t) {
  return min * (1 - t) + max * t;
}

function lerpArray(min, max, t, out) {
  out = out || [];
  if (min.length !== max.length) {
    throw new TypeError(
      "min and max array are expected to have the same length"
    );
  }
  for (var i = 0; i < min.length; i++) {
    out[i] = lerp(min[i], max[i], t);
  }
  return out;
}
