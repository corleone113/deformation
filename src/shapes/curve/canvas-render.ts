import { computeCurvePoints } from '@/shapes/curve/compute';
import {
  canDrawClip,
  computeClipShapePaths,
  computeOriginalPoints,
  computeTransformMatrix,
} from '@/utils/canvas-compute';

/**
 * 绘制弯曲的文本
 * @param ctx canvas 2d绘制上下文
 * @param angle 弯曲的角度
 * @param xCount 水平方向分段数量
 * @param yCount 垂直方向分段数量
 * @param textPicture 绘制的文本的图片
 * @param textRect 绘制的位置、尺寸
 */
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
 * 绘制弯曲后的图片
 * @param ctx canvas 2d绘制上下文
 * @param pa 图片矩形的左上顶点
 * @param pb 图片矩形的右上顶点
 * @param pc 图片矩形的右下顶点
 * @param pd 图片矩形的左下顶点
 * @param angle 弯曲的角度
 * @param xCount 水平方向分段数量
 * @param img 原始图片资源
 * @param hasDot 是否绘制顶点
 * @param hasLine 是否绘制划分后的三角形的边
 * @param hasPic 是否绘制图片
 * @param yCount 垂直方向分段数量
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
  // 弯曲的图片的所有顶点
  const originalPoints = computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  // 弯曲后的图片的所有顶点
  const curvePoints = computeCurvePoints(pa, pb, pc, pd, angle, xCount, yCount);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // console.time('canvas draw')
  curvePoints.forEach((p, i) => {
    //获取弯曲后的四边形的四个点
    const p1 = curvePoints[i];
    const p2 = curvePoints[i + 1];
    const p3 = curvePoints[i + xCount + 2];
    const p4 = curvePoints[i + xCount + 1];

    //获取初始矩形的四个点
    const op1 = originalPoints[i];
    const op2 = originalPoints[i + 1];
    const op3 = originalPoints[i + xCount + 2];
    const op4 = originalPoints[i + xCount + 1];

    if (canDrawClip(curvePoints, i, xCount)) {
      // 计算绘制路径顶点数组
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
  // console.timeEnd('canvas draw')
}

/**
 * 绘制弯曲后的图片的某个裁剪区域
 * @param ctx canvas 2d绘制上下文
 * @param matrix 2d模型变换矩阵
 * @param points 路径顶点数组
 * @param startPoint 路径起始顶点
 * @param img 原始图片源
 * @param hasLine 是否绘制划分后的三角形的边
 * @param hasPic 是否绘制图片
 */
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
  // 在这里绘制三角形边框
  if (hasLine) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'indianred';
    ctx.stroke();
  }
  // 裁剪
  ctx.clip();

  if (hasPic) {
    //变形
    ctx.transform(...matrix);
    //绘制图片
    ctx.drawImage(img, startPoint.x, startPoint.y, img.width, img.height);
  }

  ctx.restore();
}
