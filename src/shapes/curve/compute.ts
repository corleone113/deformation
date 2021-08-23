import { computeOriginalPoints, Point2D } from './canvas-compute';
import { angleToRadian } from '@/utils/math';

export type SignDirection = 1 | -1;
export type PointCallback = (x: number, y: number) => void;

const { PI, hypot, tan, atan2, cos, sin, sign } = Math;

/**
 * 求矩形弯曲后所有半扇形上的顶点
 * @param pa 矩形左上顶点坐标
 * @param pb 矩形右上顶点坐标
 * @param pc 矩形右下顶点坐标
 * @param pd 矩形左下顶点坐标
 * @param angle 弯曲角度
 * @param xCount 水平分段数量
 * @param yCount 垂直分段数量
 * @returns 半扇形上的顶点数组
 */
export function computeCurvePoints(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  xCount = 10,
  yCount = xCount,
  coordDir: SignDirection = 1,
  widthHeightRatio = 1
): Point2D[] {
  if (angle > 180 || angle < -180) {
    return [];
  }
  // 弯曲角度为0则返回原矩形的所有端点
  if (angle === 0) {
    return computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  }
  const curvePoints: Point2D[] = [];
  handleCurvePoints(
    pa,
    pb,
    pc,
    pd,
    angle,
    (x: number, y: number) => {
      curvePoints.push({ x, y });
    },
    xCount,
    yCount,
    coordDir,
    widthHeightRatio
  );
  return curvePoints;
}

export function handleCurvePoints(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  pointCallback: PointCallback,
  xCount = 10,
  yCount = xCount,
  coordDir: SignDirection = 1,
  widthHeightRatio = 1
): void {
  angle = angleToRadian(angle);
  const { curveDir, offsetRad, realStep, from } = computeAngleParams(
    pa,
    pb,
    angle,
    xCount,
    coordDir,
    widthHeightRatio
  );
  // 扇形左边上的所有顶点
  const leftEndPoints = computeCurveEndPoints(
    pa,
    pd,
    angle,
    yCount,
    -coordDir as SignDirection,
    widthHeightRatio
  );
  // 扇形右边上的所有顶点
  const rightEndPoints = computeCurveEndPoints(
    pb,
    pc,
    angle,
    yCount,
    coordDir as SignDirection,
    widthHeightRatio
  );
  for (let i = 0; i < leftEndPoints.length; ++i) {
    computePointsOnArc(
      leftEndPoints[i],
      rightEndPoints[i],
      angle,
      xCount,
      coordDir,
      widthHeightRatio,
      curveDir,
      offsetRad,
      realStep,
      from,
      pointCallback
    );
  }
}

/**
 * 求弯曲后半扇型的两条边中一条上的顶点
 * @param p1 矩形上方某顶点
 * @param p2 顶点p1下方的顶点
 * @param angle 弯曲角度
 * @param stepCount 分段数量
 * @param dir 旋转方向，angle为正则1表示顺时针(右侧)，-1表示逆时针(左侧)
 * @returns 该边弯曲(旋转)后的顶点数组
 */
function computeCurveEndPoints(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  dir: SignDirection,
  widthHeightRatio: number
) {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  // 是否反向弯曲
  const isOpposite = sign(angle) === -1;
  // 边旋转的角度
  const rotateRad = (angle / 2) * dir;
  // 向量p2p1的x分量
  const vectorX = isOpposite ? x2 - x1 : x1 - x2;
  // 向量p2p1的y分量
  const vectorY = isOpposite ? y2 - y1 : y1 - y2;
  // 旋转后的向量x分量
  const stepX =
    (cos(rotateRad) * vectorX - (sin(rotateRad) * vectorY) / widthHeightRatio) /
    stepCount;
  // 旋转后的向量y分量
  const stepY =
    (sin(rotateRad) * vectorX * widthHeightRatio + cos(rotateRad) * vectorY) /
    stepCount;
  const startPoint = isOpposite ? p1 : p2;
  const endPoints: Point2D[] = [];
  // 获取所有顶点
  for (let i = 0; i <= stepCount; ++i) {
    endPoints.push({
      x: startPoint.x + i * stepX,
      y: startPoint.y + i * stepY,
    });
  }
  // 获取的顶点的顺序是相反需要倒序，如果是反向弯曲则不需要倒序
  return isOpposite ? endPoints : endPoints.reverse();
}

/**
 * 求圆弧上的顶点数组
 * @param p1 圆弧的左端点
 * @param p2 圆弧的右端点
 * @param angle 弯曲角度(圆弧角度)
 * @param stepCount 分段数量
 * @returns 顶点数组
 */
function computePointsOnArc(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  coordDir: SignDirection,
  widthHeightRatio: number,
  curveDir: number,
  offsetRad: number,
  realStep: number,
  from: number,
  pointCallback: (x: number, y: number) => void
) {
  const pa = { ...p1 };
  const pb = { ...p2 };
  pa.y /= widthHeightRatio;
  pb.y /= widthHeightRatio;
  const { x: x1, y: y1 } = pa;
  const { x: x2, y: y2 } = pb;
  // 端点和圆心构成的三角形中圆心点的对边的一半
  const sinLen = hypot(x2 - x1, y2 - y1) / 2;
  // 端点和圆心构成的三角形圆心对边上的中线, 该中线正好将三角形分为两个全等三角形
  const cosLen = sinLen / tan(angle / 2);
  // 圆心y坐标
  const centerY = (y2 + y1) / 2 + cosLen * cos(offsetRad) * coordDir;
  // 圆心x坐标
  const centerX = (x2 + x1) / 2 + cosLen * sin(offsetRad);
  // 圆弧半径
  const radius = hypot(sinLen, cosLen);
  // 求圆弧上的顶点
  for (let i = from, count = 0; count <= stepCount; i += realStep, ++count) {
    pointCallback(
      centerX + radius * sin(i),
      (centerY + radius * cos(i) * curveDir) * widthHeightRatio
    );
  }
}

function computeAngleParams(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  coordDir: SignDirection,
  widthHeightRatio: number
) {
  const pa = { ...p1 };
  const pb = { ...p2 };
  pa.y /= widthHeightRatio;
  pb.y /= widthHeightRatio;
  const { x: x1, y: y1 } = pa;
  const { x: x2, y: y2 } = pb;
  // 圆弧左边部分的角度方向
  const curveDir = -sign(angle) * coordDir;
  // p1到p2的向量的旋转角度(上方向为y正向)
  const offsetRad = atan2((y1 - y2) * coordDir, x2 - x1) % PI;
  // 设置正确的旋转角度
  angle *= coordDir;
  // 旋转角度分量
  const realStep = (-curveDir * angle) / stepCount;
  // 向量op1的旋转角度，旋转起始角度
  const from = (angle / 2 + offsetRad) * curveDir;
  return { curveDir, offsetRad, realStep, from };
}
