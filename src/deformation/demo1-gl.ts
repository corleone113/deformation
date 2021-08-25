import { computeTextRect, Point2D, genTextPicture } from './utils';
import { initDrawingCurveText } from './gl-utils';

let xCount = '205',
  yCount = '200',
  angle = '100';
const labelXCount = document.createElement('label');
labelXCount.textContent = ' xCount:';
const xCountText = document.createElement('input');
xCountText.type = 'number';
xCountText.value = xCount;
xCountText.addEventListener('input', (ev) => {
  xCount = (ev.target as HTMLInputElement).value;
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
yCountText.addEventListener('input', (ev) => {
  yCount = (ev.target as HTMLInputElement).value;
  requestAnimationFrame(() => {
    drawingFn = genDrawing(+xCount, +yCount);
    drawingFn(+angle);
  });
});
const angleText = document.createElement('label');
angleText.textContent = ' angle: ' + angle + '°';
const angleSlider = document.createElement('input');
angleSlider.value = angle;
angleSlider.type = 'range';
angleSlider.step = '1';
angleSlider.min = '-100';
angleSlider.max = '100';
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
const ctx = (cvs.cloneNode() as HTMLCanvasElement).getContext(
  '2d'
) as CanvasRenderingContext2D;
ctx.font = '48px serif';
ctx.textBaseline = 'top';
ctx.fillStyle = 'indianred';
const text = '点击编辑文字';
const drawPoint: Point2D = { x: 300, y: 450 };
const hiddenCtx = document
  .createElement('canvas')
  .getContext('2d') as CanvasRenderingContext2D;
const textRect = computeTextRect(ctx, text, drawPoint.x, drawPoint.y);
const textPicture = genTextPicture(hiddenCtx, ctx, text, textRect);
let genDrawing: (xCount: number, yCount?: number) => (angle: number) => void;
let drawingFn: (angle: number) => void;
async function drawText() {
  genDrawing = initDrawingCurveText(cvs, await textPicture, textRect, true);
  drawingFn = genDrawing(+xCount, +yCount);
  drawingFn(+angle);
}
drawText();
