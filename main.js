/**
 * Created by Yanko on 7/2/2017.
 */
import interpolate from './bspline.js';
import {add, scale, sub, makePoint, makePointND} from './vector.js';
import {drawCircle, drawSpline, rgba} from './draw-utils.js';

const points1 = [
  [-1.06, 0.01],
  [-0.57, 0.405],
  [-0.42, 0.37],
  [-0.245, 0.28],
  [0.365, -0.405],
  [0.575, -0.365],
  [0.695, -0.305],
  [0.98, -0.045],
];

const points2 = [
  [-1.0,  0.0],
  [-0.5,  0.5],
  [ 0.0,  0.0],
  [ 0.5, -0.5],
  [ 1.0,  0.0],
];

const interpolated1 = [],
      interpolated2 = [];

// As we don't provide a knot vector, one will be generated
// internally and have the following form :
//
// var knots = [0, 1, 2, 3, 4, 5, 6];
//
// Knot vectors must have `number of points + degree + 1` knots.
// Here we have 4 points and the degree is 2, so the knot vector
// length will be 7.
//
// This knot vector is called "uniform" as the knots are all spaced uniformly,
// ie. the knot spans are all equal (here 1).

let [canvasSizeX, canvasSizeY] = [1200, 850];
const [centerX, centerY] = [500, 500];
const VIEW_SCALE = 200;
const draggingRadius = 5;
const SUBDIVISION_STEPS = 10;
let currentSubdivisionSteps = SUBDIVISION_STEPS;
let showBlueControlPoints = false;
let showRedControlPoints = true;

const worldToView = ({x, y}) => ({
  x: x * VIEW_SCALE + centerX,
  y: y * VIEW_SCALE + centerY
});

const viewToWorld = ({x, y}) => ({
  x: (x - centerX) / VIEW_SCALE,
  y: (y - centerX) / VIEW_SCALE
});

const colors = {
  red: rgba(218, 41, 41, 0.7),
  blue: rgba(117, 197, 255, 0.69),
  yellow: rgba(200, 200, 0, 1),
  black: rgba(19, 19, 19, 1),
};

const setAlpha = ({r, g, b}, alpha) => ({r, g, b, a: alpha});

const drawPoint = (point, color) => drawCircle(point, 6, setAlpha(color, .3));
const drawPoints = (points, color) =>
  points.forEach(([x, y, z]) => drawPoint(worldToView({x, y, z}), color));

const calcPoints = (points, delta, degree, interpolated) => {
  interpolated.length = 0;
  for (let t = 0; t < 1; t += delta) {
    const [x, y, z] = interpolate(t, degree, points);
    interpolated.push(worldToView({x, y, z}));
  }
  return interpolated;
};

const sqr = x => x * x;
const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
const distance = (p1, p2) => Math.sqrt(dist2(p1, p2));

function distToSegmentSquared(p, v, w) {
  const l2 = dist2(v, w);
  if (l2 === 0) {
    return dist2(p, v);
  }

  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  });
}

const distanceToSegment = (p, v, w) => Math.sqrt(distToSegmentSquared(p, v, w));

const distanceToSpline = (point, splinePoints) => {
  let idx = 0;
  let minIndex = idx;
  let minDistance = Number.POSITIVE_INFINITY;
  while (idx < splinePoints.length - 1) {
    let p1 = splinePoints[idx];
    let p2 = splinePoints[idx + 1];
    const dist = distanceToSegment(point, p1, p2);
    if ( dist < minDistance ) {
      minDistance = dist;
      minIndex = idx;
    }
    idx++;
  }
  return { dist: minDistance, idx: minIndex };
};

const calculateError = (spline, otherSpline) =>
  spline.map( p2 => distanceToSpline( p2, otherSpline ));

const calculateTotalError = errors =>
  errors.reduce((sum, error) => sum + error.dist, 0) /
  errors.length;

const errorGraphPos = {x: 0, y: canvasSizeY - 10};
const errorGraphScale = {x: 1.2, y: -2};
const {x: epx, y: epy} = errorGraphPos;
const {x: esx, y: esy} = errorGraphScale;
const makeErrorGraph = errors => errors.map((e, i) => ({
  x: i * esx * (100 / currentSubdivisionSteps) + epx,
  y: e.dist * esy + epy
}));

const updateError = ctx => {
  const error1 = calculateError(interpolated1, interpolated2);
  const error2 = calculateError(interpolated2, interpolated1);
  const graph1 = makeErrorGraph(error1);
  const graph2 = makeErrorGraph(error2);

  drawSpline(ctx, graph1, colors.red);
  drawSpline(ctx, graph2, colors.blue);
  document.getElementById('errorMonitor1').innerText = calculateTotalError(error1);
  document.getElementById('errorMonitor2').innerText = calculateTotalError(error2);
};

const calcMedian = (spline1, spline2) => {
  const median = [];
  spline1.forEach((p1, i) => {
    if (i < spline2.length) {
      const p2 = spline2[i];
      // (p1 + p2) / 2
      median.push(scale(add(p1, p2), 0.5));
    }
  });
  return median;
};

const drawCanvas = () => {

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasSizeX, canvasSizeY);
  if (showRedControlPoints) {
    drawPoints(points1, colors.red);
  }
  if (showBlueControlPoints) {
    drawPoints(points2, colors.blue);
  }

  const delta = 1 / currentSubdivisionSteps;
  calcPoints(points1, delta, 2, interpolated1);
  calcPoints(points2, delta, 2, interpolated2);
  const median = calcMedian(interpolated1, interpolated2);

  drawSpline(ctx, interpolated1, colors.black);
  drawSpline(ctx, interpolated2, colors.blue);
  drawSpline(ctx, median, colors.yellow);
  interpolated1.forEach(p => drawCircle(p, 2, colors.red));
  interpolated2.forEach(p => drawCircle(p, 2, colors.blue));
  updateError(ctx);
};

let hoveredPoint = null;
let draggedPoint = null;

const handleHoveringOverPoint = (idx) => {
  hoveredPoint = idx;
  const cursorStyle = (idx >= 0) ? 'pointer' : 'default';
  document.body.style.cursor = cursorStyle;
};

const handleMouseDown = (e, ctx) => {
  if (hoveredPoint !== null) {
    draggedPoint = hoveredPoint;
  }
};

const handleMouseUp = (e, ctx) => {
  draggedPoint = null;
};

const handleDragPoint = (x, y) => {
  //console.log(x, y, draggedPoint);
  points1[draggedPoint] = [x, y];
  drawCanvas();
};

const handleMouseMove = (e, canvas) => {
  const corg = makePoint(canvas.clientLeft, canvas.clientTop);
  const coff = makePoint(canvas.offsetLeft, canvas.offsetTop);
  const ep = makePoint(e.clientX, e.clientY);
  const canvasPos = add(corg, coff);
  const cursor = sub(ep, canvasPos);
  const point = viewToWorld(cursor);
  const radius = draggingRadius / VIEW_SCALE;
  const hoveredIndex = points1.findIndex(pi => distance(makePointND(pi), point) < radius);
  handleHoveringOverPoint(hoveredIndex);

  if (draggedPoint !== null) {
    const {x, y} = point;
    window.requestAnimationFrame(() =>
      handleDragPoint(x, y, draggedPoint)
    );
  }
};

const setSubdivisionCount = subdivisions => {
  currentSubdivisionSteps = subdivisions;
  drawCanvas();
};

const toggleBlueControlPoints = () => {
  showBlueControlPoints = !showBlueControlPoints;
  drawCanvas();
};

const toggleRedControlPoints = () => {
  showRedControlPoints = !showRedControlPoints;
  drawCanvas();
};

function start() {

  const canvas = document.getElementById('canvas');
  const btnSubD10 = document.getElementById('btnSubD10');
  const btnSubD100 = document.getElementById('btnSubD100');
  canvasSizeX = canvas.clientWidth;
  canvasSizeY = canvas.clientHeight;
  document.addEventListener('mousemove', e => handleMouseMove(e, canvas));
  document.addEventListener('mousedown', e => handleMouseDown(e, canvas));
  document.addEventListener('mouseup', e => handleMouseUp(e, canvas));
  btnSubD10.addEventListener('click', () => setSubdivisionCount(10));
  btnSubD100.addEventListener('click', () => setSubdivisionCount(100));
  btnToggleBlueCtl.addEventListener('click', () => toggleBlueControlPoints());
  btnToggleRedCtl.addEventListener('click', () => toggleRedControlPoints());
  drawCanvas();
}

setTimeout(() => {
  console.log('started.');
  start();
}, 100);
