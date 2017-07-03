/**
 * Created by Yanko on 7/2/2017.
 */

const drawCircle = (point, radius, color) => {
  const {x, y} = point;
  const circle = canvas.getContext('2d');
  circle.fillStyle = makeColorStyle(color);
  circle.beginPath();
  circle.arc(x, y, radius, 0, 2 * Math.PI);
  circle.fill()
};

const drawSpline = (ctx, interpolated, color) => {
  ctx.strokeStyle = makeColorStyle(color);
  ctx.beginPath();
  let isFirst = true;
  interpolated.forEach(({x, y}) => {
    if (isFirst) {
      ctx.moveTo(x, y);
      isFirst = false;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
};

const makeColorStyle = ({r, g, b, a}) => `rgba(${r}, ${g}, ${b}, ${a})`;
const rgba = (r, g, b, a) => ({
  r, g, b, a
});

export {drawCircle, drawSpline, rgba};
