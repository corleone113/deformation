import { computeCurvePoints } from '@/shapes/curve/compute';
import { TextRect } from '@/utils/canvas-text';
import {
  canDrawClip,
  computeClipShapePaths,
  computeOriginalPoints,
  computeTransformMatrix,
  Point2D,
} from './canvas-compute';

interface TransformMatrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export function drawCurveText(
  ctx: CanvasRenderingContext2D,
  angle: number,
  xCount: number,
  yCount: number,
  textPicture: ImageBitmap,
  textRect: TextRect
) {
  const { x, y, width, height } = textRect;
  const pa: Point2D = { x, y },
    pb: Point2D = { x: x + width, y },
    pc: Point2D = { x: x + width, y: y + height },
    pd: Point2D = { x, y: y + height };
  drawCurveImage(
    ctx,
    pa,
    pb,
    pc,
    pd,
    angle,
    xCount,
    textPicture,
    false,
    false,
    true,
    yCount
  );
}


/**
 * 绘制弯曲(拱形)图片
 */
export function drawCurveImage(
  ctx: CanvasRenderingContext2D,
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  xCount: number,
  img: HTMLImageElement | ImageBitmap,
  hasDot = false,
  hasLine = false,
  hasPic = true,
  yCount = xCount
) {
  const originalPoints = computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  const curvePoints = computeCurvePoints(pa, pb, pc, pd, angle, xCount, yCount);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  console.time('canvas draw')
  curvePoints.forEach((p, i) => {
    //获取平行四边形的四个点
    const p1 = curvePoints[i];
    const p2 = curvePoints[i + 1];
    const p3 = curvePoints[i + xCount + 2];
    const p4 = curvePoints[i + xCount + 1];

    //获取初始平行四边形的四个点
    const op1 = originalPoints[i];
    const op2 = originalPoints[i + 1];
    const op3 = originalPoints[i + xCount + 2];
    const op4 = originalPoints[i + xCount + 1];

    if (canDrawClip(curvePoints, i, xCount)) {
      const { upPath, downPath } = computeClipShapePaths(
        p1,
        p2,
        p3,
        p4,
        i,
        xCount,
        curvePoints
      );

      //绘制三角形的上半部分
      const upTransform = computeTransformMatrix(op1, p1, op2, p2, op4, p4);
      renderClipImage(
        ctx,
        upTransform,
        upPath,
        originalPoints[0],
        img,
        hasLine,
        hasPic
      );
      //绘制三角形的下半部分
      const downTransform = computeTransformMatrix(op3, p3, op2, p2, op4, p4);
      renderClipImage(
        ctx,
        downTransform,
        downPath,
        originalPoints[0],
        img,
        hasLine,
        hasPic
      );
    }

    if (hasDot) {
      ctx.fillStyle = 'red';
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  });
  console.timeEnd('canvas draw')
}

function renderClipImage(
  ctx: CanvasRenderingContext2D,
  matrix: TransformMatrix2D,
  points: Point2D[],
  startPoint: Point2D,
  img: HTMLImageElement | ImageBitmap,
  hasLine: boolean,
  hasPic: boolean
) {
  ctx.save();
  //根据变换后的坐标创建剪切区域
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  if (hasLine) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'indianred';
    ctx.stroke();
  }
  ctx.clip();

  if (hasPic) {
    //变形
    ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    //绘制图片
    ctx.drawImage(img, startPoint.x, startPoint.y, img.width, img.height);
  }

  ctx.restore();
}
