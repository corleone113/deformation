import { computeOriginalPoints } from '../../utils/canvas-compute';
import { addPoint2D, angleToRadian } from '@/utils/math';

const { PI, hypot, tan, atan2, cos, sin, sign } = Math;

/**
 * 求矩形弯曲后的图片区域的所有顶点
 * @param pa 原始图片矩形区域左上顶点坐标
 * @param pb 原始图片矩形区域右上顶点坐标
 * @param pc 原始图片矩形区域右下顶点坐标
 * @param pd 原始图片矩形区域左下顶点坐标
 * @param angle 弯曲角度
 * @param xCount 水平分段数量
 * @param yCount 垂直分段数量
 * @param yDir y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 * @returns 弯曲后图片上的顶点数组
 */
export function computeCurvePoints(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  xCount = 10,
  yCount = xCount,
  yDir: CoordDirection = 1,
  widthHeightRatio = 1
): Point2D[] {
  if (angle > 180 || angle < -180) {
    return [];
  }
  // 弯曲角度为0则返回原图片矩形的所有顶点数组
  if (angle === 0) {
    return computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  }
  const curvePoints: Point2D[] = [];
  // 计算并更新弯曲的图片的顶点数组
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
    yDir,
    widthHeightRatio
  );
  return curvePoints;
}

/**
 * 计算处弯曲后图片上的顶点并利用顶点数据进行操作
 * @param pa 原始图片矩形区域左上顶点坐标
 * @param pb 原始图片矩形区域右上顶点坐标
 * @param pc 原始图片矩形区域右下顶点坐标
 * @param pd 原始图片矩形区域左下顶点坐标
 * @param angle 图片弯曲的角度
 * @param pointCallback 使用顶点数据的回调
 * @param xCount 水平方向的分段数量
 * @param yCount 垂直方向的分段数量
 * @param yDir y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 */
export function handleCurvePoints(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  pointCallback: PointCallback,
  xCount = 10,
  yCount = xCount,
  yDir: CoordDirection = 1,
  widthHeightRatio = 1
): void {
  // 角度转化为弧度
  angle = angleToRadian(angle);
  // 计算角度相关的参数
  const { curveDir, offsetRad, realStep, from } = computeAngleParams(
    pa,
    pb,
    angle,
    xCount,
    yDir,
    widthHeightRatio
  );
  // 扇形(弯曲后的形状为扇形)左边上的所有顶点
  const leftEndPoints = computeCurveEndPoints(
    pa,
    pd,
    angle,
    yCount,
    -yDir as CoordDirection,
    widthHeightRatio
  );
  // 扇形右边上的所有顶点
  const rightEndPoints = computeCurveEndPoints(
    pb,
    pc,
    angle,
    yCount,
    yDir as CoordDirection,
    widthHeightRatio
  );
  for (let i = 0; i < leftEndPoints.length; ++i) {
    // 计算每对顶点对应的圆弧上的顶点，并传入到回调中进行处理
    handlePointsOnArc(
      leftEndPoints[i],
      rightEndPoints[i],
      angle,
      xCount,
      yDir,
      widthHeightRatio,
      curveDir,
      offsetRad,
      realStep,
      from,
      i,
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
 * @param widthHeightRatio 画布的宽高比
 * @returns 该边弯曲(旋转)后的顶点数组
 */
function computeCurveEndPoints(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  dir: CoordDirection,
  widthHeightRatio: number
) {
  // 是否反向弯曲
  const isOpposite = sign(angle) === -1;
  // 计算弯曲后的向量
  const { x: vectorX, y: vectorY } = computeRotatedVector(
    p1,
    p2,
    angle,
    dir,
    widthHeightRatio
  );
  const stepX = vectorX / stepCount,
    stepY = vectorY / stepCount;

  const startPoint = isOpposite ? p1 : p2;
  const endPoints: Point2D[] = [];
  // 计算出所有的顶点
  for (let i = 0; i <= stepCount; ++i) {
    endPoints.push({
      x: startPoint.x + i * stepX,
      y: startPoint.y + i * stepY,
    });
  }
  // 顶点的顺序是相反需要倒序，如果是反向弯曲则不需要倒序
  return isOpposite ? endPoints : endPoints.reverse();
}

/**
 * 求圆弧上的顶点的数组
 * @param p1 圆弧的左端点
 * @param p2 圆弧的右端点
 * @param angle 弯曲角度(圆弧角度)
 * @param stepCount 分段数量
 * @param yDir y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 * @param curveDir 圆弧弯曲的方向，1表示向上弯曲，-1则相反
 * @param offsetRad 左右端点组成的向量相对于+x轴的角度
 * @param realStep 圆心到圆弧上两个顶点的向量的夹角
 * @param from 圆心到左端点的向量相对于+y轴的角度
 * @param yIndex 当前顶点的y方向的索引
 * @param pointCallback 使用顶点数据的回调
 */
function handlePointsOnArc(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  yDir: CoordDirection,
  widthHeightRatio: number,
  curveDir: number,
  offsetRad: number,
  realStep: number,
  from: number,
  yIndex: number,
  pointCallback: PointCallback
) {
  // 计算圆弧相关参数
  const {
    center: {x: centerX, y: centerY},
    radius,
  } = computeArcParams(p1, p2, angle, yDir, widthHeightRatio, offsetRad);
  
  // 求圆弧上的顶点，并传入回调中执行
  for (let i = from, count = 0; count <= stepCount; i += realStep, ++count) {
    pointCallback(
      centerX + radius * sin(i),
      (centerY + radius * cos(i) * curveDir) * widthHeightRatio,
      count,
      yIndex
    );
  }
}

function computeArcParams(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  yDir: CoordDirection,
  widthHeightRatio: number,
  offsetRad: number
): ArcParams {
  const pa = { ...p1 };
  const pb = { ...p2 };
  pa.y /= widthHeightRatio;
  pb.y /= widthHeightRatio;
  const { x: x1, y: y1 } = pa;
  const { x: x2, y: y2 } = pb;
  // 两端点和圆心构成的三角形中圆心点的对边的一半
  const sinLen = hypot(x2 - x1, y2 - y1) / 2;
  // 两端点和圆心构成的三角形中圆心对边上的中线, 该中线正好将三角形分为两个全等三角形
  const cosLen = sinLen / tan(angle / 2);
  // 圆弧半径
  const radius = hypot(sinLen, cosLen);
  return {
    center: {
      x: (x2 + x1) / 2 + cosLen * sin(offsetRad),
      y: (y2 + y1) / 2 + cosLen * cos(offsetRad) * yDir,
    },
    radius,
  };
}

/**
 * 计算求圆弧上顶点时需要的角度相关的参数
 * @param p1 圆弧左/上端点
 * @param p2 圆弧右/下端点
 * @param angle 弯曲的角度
 * @param stepCount 分段数量
 * @param yDir y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 * @returns 返回角度相关的参数
 */
function computeAngleParams(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  yDir: CoordDirection,
  widthHeightRatio: number
) {
  const pa = { ...p1 };
  const pb = { ...p2 };
  // 获取等比例下y方向分量——主要是应对webgl下的场景，webgl下需要将传入的顶点的x/y值映射到-1到1的范围(相对于画布的宽高)
  pa.y /= widthHeightRatio;
  pb.y /= widthHeightRatio;
  const { x: x1, y: y1 } = pa;
  const { x: x2, y: y2 } = pb;
  // 圆弧弯曲的方向(中心线的方向)，1表示向上弯曲，-1则相反
  const curveDir = -sign(angle) * yDir;
  // p1到p2的向量的旋转角度
  const offsetRad = atan2((y1 - y2) * yDir, x2 - x1) % PI;
  // 设置正确的旋转角度
  angle *= yDir;
  // 旋转角度分量
  const realStep = (-curveDir * angle) / stepCount;
  // 向量op1的旋转角度，旋转起始角度
  const from = (angle / 2 + offsetRad) * curveDir;
  return { curveDir, offsetRad, realStep, from };
}

export function computeCurveParams(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  xCount: number,
  yCount: number,
  dir: CoordDirection,
  widthHeightRatio: number,
): CurveParams {
  angle = angleToRadian(angle)
  // 是否反向弯曲
  const isOpposite = sign(angle) === -1;
  const vectorAD = computeRotatedVector(
    pa,
    pd,
    angle,
    -dir as CoordDirection,
    widthHeightRatio
  );
  const vectorBC = computeRotatedVector(pb, pc, angle, dir, widthHeightRatio);

  const leftEndPoint = addPoint2D(isOpposite ? pa : pd, vectorAD);
  const rightEndPoint = addPoint2D(isOpposite ? pb : pc, vectorBC);
  const {
    from: fromAngle,
    realStep: angleStep,
    curveDir,
    offsetRad
  } = computeAngleParams(
    leftEndPoint,
    rightEndPoint,
    angle,
    xCount,
    dir,
    widthHeightRatio
  );
  const { radius: maxRadius, center } = computeArcParams(
    leftEndPoint,
    rightEndPoint,
    angle,
    dir,
    widthHeightRatio,
    offsetRad
  );
  return {
    maxRadius,
    radiusDelta: hypot(vectorAD.x, vectorAD.y) / yCount,
    center,
    fromAngle,
    angleStep,
    curveDir,
  };
}

function computeRotatedVector(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  dir: CoordDirection,
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
  const x =
    cos(rotateRad) * vectorX - (sin(rotateRad) * vectorY) / widthHeightRatio;
  // 旋转后的向量y分量
  const y =
    sin(rotateRad) * vectorX * widthHeightRatio + cos(rotateRad) * vectorY;
  return { x, y };
}
