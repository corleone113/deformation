import { drawCurveImage, Point2D } from './utils';

let hasDot = false,
  hasLine = false,
  hasPic = true,
  xCount = '50',
  yCount = '50',
  angle = '100',
  newWidth: number,
  newHeight: number,
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D;
const hasDotText = document.createElement('label');
hasDotText.textContent = ' hasDot: ';
const hasDotCheckbox = document.createElement('input');
hasDotCheckbox.type = 'checkbox';
hasDotCheckbox.checked = hasDot;
hasDotCheckbox.addEventListener('change', () => {
  hasDot = hasDotCheckbox.checked;
  drawDeformationPic();
});
const hasLineText = document.createElement('label');
hasLineText.textContent = ' hasLine: ';
const hasLineCheckbox = document.createElement('input');
hasLineCheckbox.type = 'checkbox';
hasLineCheckbox.checked = hasLine;
hasLineCheckbox.addEventListener('change', () => {
  hasLine = hasLineCheckbox.checked;
  drawDeformationPic();
});
const hasPicText = document.createElement('label');
hasPicText.textContent = ' hasPic: ';
const hasPicCheckbox = document.createElement('input');
hasPicCheckbox.type = 'checkbox';
hasPicCheckbox.checked = hasPic;
hasPicCheckbox.addEventListener('change', () => {
  hasPic = hasPicCheckbox.checked;
  drawDeformationPic();
});
const labelXCount = document.createElement('label');
labelXCount.textContent = ' xCount:';
const xCountText = document.createElement('input');
xCountText.type = 'number';
xCountText.value = xCount;
xCountText.addEventListener('input', (ev) => {
  xCount = (ev.target as HTMLInputElement).value;
  drawDeformationPic();
});

const labelYCount = document.createElement('label');
labelYCount.textContent = ' yCount:';
const yCountText = document.createElement('input');
yCountText.type = 'number';
yCountText.value = yCount;
yCountText.addEventListener('input', (ev) => {
  yCount = (ev.target as HTMLInputElement).value;
  drawDeformationPic();
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
  drawDeformationPic();
});
const cvs = document.createElement('canvas');
cvs.width = 1000;
cvs.height = 600;
document.body.append(
  cvs,
  document.createElement('br'),
  hasDotText,
  hasDotCheckbox,
  document.createElement('br'),
  hasLineText,
  hasLineCheckbox,
  document.createElement('br'),
  hasPicText,
  hasPicCheckbox,
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
// document.body.append(angleText, angleSlider);
const ctx = cvs.getContext('2d') as CanvasRenderingContext2D;
const img = new Image();
img.src = 'src/deformation/hailang.jpg';
img.onload = () => {
  const { width, height } = img;
  newWidth = 350;
  newHeight = (height * newWidth) / width;
  img.width = newWidth;
  img.height = newHeight;
  (pa = { x: 300, y: 100 }),
    (pb = { x: pa.x + newWidth, y: pa.y }),
    (pc = { x: pa.x + newWidth, y: pa.y + newHeight }),
    (pd = { x: pa.x, y: pa.y + newHeight });
  drawDeformationPic();
};

function drawDeformationPic() {
  requestAnimationFrame(() => {
    drawCurveImage(
      ctx,
      pa,
      pb,
      pc,
      pd,
      +angle,
      +xCount,
      img,
      hasDot,
      hasLine,
      hasPic,
      +yCount
    );
  });
}
