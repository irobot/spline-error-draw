/**
 * Created by Yanko on 7/2/2017.
 */

const makePoint2D = (x, y) => ({ x, y, z: 0 });
const makePoint3D = (x, y, z) => ({ x, y, z });
const makePointND = ([x, y, z]) => ({ x, y, z });

const add = (p1, p2) => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y,
  z: p1.z + p2.z
});

const scale = (p, scale) => ({
  x: p.x * scale, y: p.y * scale, z: p.z * scale
});

const sub = (p1, p2) => add(p1, scale(p2, -1.0));

const makePoint = makePoint2D;

export {makePoint, makePointND, add, scale, sub};
