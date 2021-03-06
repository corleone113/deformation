import { initDrawingCurveImage } from '@/shapes/curve/gl-render';
import picURL from '@assets/pic.jpg'

const { max, min } = Math;
const MIN_COUNT=1, MAX_COUNT=1000;
function genValidCount(x: number) {
  return max(MIN_COUNT, min(x, MAX_COUNT))
}
let xCount = '200',
  yCount = '200',
  angle = '150',
  newWidth: number,
  newHeight: number,
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D;
const labelXCount = document.createElement('label');
labelXCount.textContent = ' xCount:';
const xCountText = document.createElement('input');
xCountText.type = 'number';
xCountText.value = xCount;
xCountText.min = MIN_COUNT+''
xCountText.max = MAX_COUNT+''
xCountText.addEventListener('input', (ev) => {
  xCount = genValidCount(+(ev.target as HTMLInputElement).value)+'';
  requestAnimationFrame(() => {
    drawingFn = genDrawing(+xCount, +yCount);
    drawingFn(+angle);
  });
});

const labelYCount = document.createElement('label');
labelYCount.textContent = ' yCount:';
const yCountText = document.createElement('input');
yCountText.type = 'number';
yCountText.value = yCount;
yCountText.min = MIN_COUNT+''
yCountText.max = MAX_COUNT+''
yCountText.addEventListener('input', (ev) => {
  yCount = genValidCount(+(ev.target as HTMLInputElement).value)+'';
  requestAnimationFrame(() => {
    drawingFn = genDrawing(+xCount, +yCount);
    drawingFn(+angle);
  });
});
const angleText = document.createElement('label');
angleText.textContent = ' angle: ' + angle + '°';
const angleSlider = document.createElement('input');
angleSlider.type = 'range';
angleSlider.step = '1';
angleSlider.min = '-150';
angleSlider.max = '150';
angleSlider.value = angle;
angleSlider.addEventListener('input', (ev) => {
  angle = (ev.target as HTMLInputElement).value;
  angleText.textContent = ' angle: ' + angle + '°';
  requestAnimationFrame(() => {
    drawingFn(+angle);
  });
});
const cvs = document.createElement('canvas');
cvs.width = 1000;
cvs.height = 600;
document.body.append(
  cvs,
  document.createElement('br'),
  labelXCount,
  xCountText,
  labelYCount,
  yCountText,
  document.createElement('br'),
  angleText,
  document.createElement('br'),
  angleSlider,
  document.createElement('br')
);
const img = new Image();
let genDrawing: (xCount: number, yCount?: number) => (angle: number) => void;
let drawingFn: (angle: number) => void;
img.src = picURL;
img.onload = () => {
  const { width, height } = img;
  newWidth = 350;
  newHeight = (height * newWidth) / width;
  img.width = newWidth;
  img.height = newHeight;
  (pa = { x: 300, y: 150 }),
    (pb = { x: pa.x + newWidth, y: pa.y }),
    (pc = { x: pa.x + newWidth, y: pa.y + newHeight }),
    (pd = { x: pa.x, y: pa.y + newHeight });
  genDrawing = initDrawingCurveImage(cvs, pa, pb, pc, pd, img);
  drawingFn = genDrawing(+xCount, +yCount);
  console.time('first draw');
  drawingFn(+angle);
  console.timeEnd('first draw');
};
