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
 * @param textPicture 绘制的文本的图像
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
 * 绘制弯曲后的图像
 * @param ctx canvas 2d绘制上下文
 * @param pa 图像矩形区域的左上顶点
 * @param pb 图像矩形区域的右上顶点
 * @param pc 图像矩形区域的右下顶点
 * @param pd 图像矩形区域的左下顶点
 * @param angle 弯曲的角度
 * @param xCount 水平方向分段数量
 * @param img 原始图像资源
 * @param hasDot 是否绘制顶点
 * @param hasLine 是否绘制划分后的三角形的边
 * @param hasPic 是否绘制图像
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
  // console.time('render time');
  // 弯曲前的图像的所有顶点
  const originalPoints = computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  // 弯曲后的图像的所有顶点
  const curvePoints = computeCurvePoints(pa, pb, pc, pd, angle, xCount, yCount);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  curvePoints.forEach((p, i) => {
    if (hasDot) {
      ctx.fillStyle = 'red';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    // 判断当前顶点和其右侧第一个顶点、下方第一个顶点、右下方第一个顶点构成图像一个四边形(梯形)区域
    if (!canDrawClip(curvePoints, i, xCount)) {
      return;
    }
    //获取弯曲后该四边形区域的四个顶点坐标
    const p1 = curvePoints[i];
    const p2 = curvePoints[i + 1];
    const p3 = curvePoints[i + xCount + 2];
    const p4 = curvePoints[i + xCount + 1];

    //获取弯曲前该矩形区域的四个顶点坐标
    const op1 = originalPoints[i];
    const op2 = originalPoints[i + 1];
    const op3 = originalPoints[i + xCount + 2];
    const op4 = originalPoints[i + xCount + 1];
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

    // 绘制弯曲变形后四边形区域左上三角形部分
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
    // 绘制弯曲变形后四边形区域右下三角形部分
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
  });
  // console.timeEnd('render time');
}

export function drawCurveImage_Deprecated(
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
  // console.time('render time');
  // 弯曲前的图像的所有顶点
  const originalPoints = computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  // 弯曲后的图像的所有顶点
  const curvePoints = computeCurvePoints(pa, pb, pc, pd, angle, xCount, yCount);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  curvePoints.forEach((p, i) => {
    if (hasDot) {
      ctx.fillStyle = 'red';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    // 判断当前顶点和其右侧第一个顶点、下方第一个顶点、右下方第一个顶点构成图像一个四边形(梯形)区域
    if (!canDrawClip(curvePoints, i, xCount)) {
      return;
    }
    //获取弯曲后该四边形区域的四个顶点坐标
    const p1 = curvePoints[i];
    const p2 = curvePoints[i + 1];
    const p3 = curvePoints[i + xCount + 2];
    const p4 = curvePoints[i + xCount + 1];

    //获取弯曲前该矩形区域的四个顶点坐标
    const op1 = originalPoints[i];
    const op2 = originalPoints[i + 1];
    const op3 = originalPoints[i + xCount + 2];
    const op4 = originalPoints[i + xCount + 1];

    // 绘制弯曲变形后四边形区域左上三角形部分
    const upTransform = computeTransformMatrix(op1, p1, op2, p2, op4, p4);
    renderClipImage(
      ctx,
      upTransform,
      [p1, p2, p4],
      originalPoints[0],
      img,
      hasLine,
      hasPic
    );
    // 绘制弯曲变形后四边形区域右下三角形部分
    const downTransform = computeTransformMatrix(op3, p3, op2, p2, op4, p4);
    renderClipImage(
      ctx,
      downTransform,
      [p3, p2, p4],
      originalPoints[0],
      img,
      hasLine,
      hasPic
    );
  });
  // console.timeEnd('render time');
}

/**
 * 绘制弯曲后的图像的某个裁剪区域
 * @param ctx canvas 2d绘制上下文
 * @param matrix 2d模型变换矩阵
 * @param points 路径顶点数组
 * @param startPoint 路径起始顶点
 * @param img 原始图像源
 * @param hasLine 是否绘制划分后的三角形的边
 * @param hasPic 是否绘制图像
 */
function renderClipImage(
  ctx: CanvasRenderingContext2D,
  matrix: ModelMatrix2D,
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
    //弯曲变形
    ctx.transform(...matrix);
    //绘制图像
    ctx.drawImage(img, startPoint.x, startPoint.y, img.width, img.height);
  }

  ctx.restore();
}
