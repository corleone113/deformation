import { computeOriginalPoints } from '../../utils/canvas-compute';
import { addPoint2D, angleToRadian } from '@/utils/math';

const { PI, hypot, tan, atan2, cos, sin, sign } = Math;

/**
 * 求矩形弯曲后的图像区域的所有顶点
 * @param pa 原始图像矩形区域左上顶点坐标
 * @param pb 原始图像矩形区域右上顶点坐标
 * @param pc 原始图像矩形区域右下顶点坐标
 * @param pd 原始图像矩形区域左下顶点坐标
 * @param angle 弯曲角度
 * @param xCount 水平分段数量
 * @param yCount 垂直分段数量
 * @param yDir +y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 * @returns 弯曲后图像上的顶点数组
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
  // 弯曲角度为0则返回原图像矩形的所有顶点数组
  if (angle === 0) {
    return computeOriginalPoints(pa, pb, pc, pd, xCount, yCount);
  }
  const curvePoints: Point2D[] = [];
  // 计算并更新弯曲的图像的顶点数组
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
 * 计算处弯曲后图像上的顶点并利用顶点数据进行操作
 * @param pa 原始图像矩形区域左上顶点坐标
 * @param pb 原始图像矩形区域右上顶点坐标
 * @param pc 原始图像矩形区域右下顶点坐标
 * @param pd 原始图像矩形区域左下顶点坐标
 * @param angle 图像弯曲的角度
 * @param pointCallback 使用顶点数据的回调
 * @param xCount 水平方向的分段数量
 * @param yCount 垂直方向的分段数量
 * @param yDir +y轴方向——1表示向下，-1则相反
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
  );
  // 扇形(弯曲后的形状为扇形)左边上的所有顶点
  const leftEndPoints = computeCurveEndPoints(
    pa,
    pd,
    angle,
    yCount,
    -yDir as CoordDirection
  );
  // 扇形右边上的所有顶点
  const rightEndPoints = computeCurveEndPoints(
    pb,
    pc,
    angle,
    yCount,
    yDir as CoordDirection
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
 * @param yDir +y轴方向——1表示向下，-1则相反
 * @returns 该边弯曲(旋转)后的顶点数组
 */
function computeCurveEndPoints(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  yDir: CoordDirection
) {
  // 是否反向弯曲
  const isOpposite = sign(angle) === -1;
  // 计算弯曲后的向量
  const { x: vectorX, y: vectorY } = computeRotatedVector(
    p1,
    p2,
    angle,
    yDir
  );
  // 变化的步长向量的x、y
  const stepX = vectorX / stepCount,
    stepY = vectorY / stepCount;
  // 计算边上顶点时的起点，是弯曲变形时固定(角度符号未变化时)的点，也是旋转围绕的点
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
 * 计算圆弧上所有顶点数据，将每个顶点数据传入回调中进行处理
 * @param p1 圆弧的左端点
 * @param p2 圆弧的右端点
 * @param angle 弯曲角度(圆弧角度)
 * @param stepCount 分段数量
 * @param yDir +y轴方向——1表示向下，-1则相反
 * @param widthHeightRatio 画布宽高比
 * @param curveDir 圆弧弯曲的方向，1表示向上弯曲，-1则相反
 * @param offsetRad 左右端点组成的向量相对于+x轴的角度取反后的值
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
    center: { x: centerX, y: centerY },
    radius,
  } = computeArcParams(p1, p2, angle, yDir, offsetRad);

  // 求圆弧上的顶点，并传入回调中执行
  for (let i = from, count = 0; count <= stepCount; i += realStep, ++count) {
    pointCallback(
      (centerX + radius * sin(i)) / widthHeightRatio,
      // 最后的y值需要乘以宽高比(之前除以宽高比以保证不受画布宽高不相等的影响，这里要还原)
      (centerY + radius * cos(i) * curveDir),
      count,
      yIndex
    );
  }
}

/**
 * 计算圆弧相关参数
 * @param p1 圆弧的一个端点
 * @param p2 圆弧的另一个端点
 * @param angle 圆弧角度
 * @param yDir ++y轴方向——1表示向下，-1则相反
 * @param offsetRad 两端点连线相对于水平方向的偏移角度取反后的值
 * @returns 圆弧相关参数
 */
function computeArcParams(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  yDir: CoordDirection,
  offsetRad: number
): ArcParams {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  // 两端点和圆心构成的三角形中圆心点的对边的一半
  const sinLen = hypot(x2 - x1, y2 - y1) / 2;
  // 两端点和圆心构成的三角形中圆心对边上的中线, 该中线正好将三角形分为两个全等三角形
  const cosLen = sinLen / tan(angle / 2);
  // 圆弧半径
  const radius = hypot(sinLen, cosLen);
  return {
    center: {
      x: ((x2 + x1) / 2 + cosLen * sin(offsetRad)),
      y: ((y2 + y1) / 2 + cosLen * cos(offsetRad) * yDir),
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
 * @param yDir +y轴方向——1表示向下，-1则相反
 * @returns 返回角度相关的参数
 */
function computeAngleParams(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  stepCount: number,
  yDir: CoordDirection
) {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  // 圆弧弯曲的方向(中心线的方向)，1表示向上弯曲，-1则相反
  const curveDir = -sign(angle) * yDir;
  // p1到p2的向量的旋转角度取反后的值——为了计算圆心位置，需要利用该角度取反后的值计算出准确的偏移量
  const offsetRad = atan2((y1 - y2) * yDir, x2 - x1) % PI;
  // 设置正确的旋转角度
  angle *= yDir;
  // 旋转角度分量
  const realStep = (-curveDir * angle) / stepCount;
  // 向量op1的旋转角度，旋转起始角度
  const from = (angle / 2 + offsetRad) * curveDir;
  return { curveDir, offsetRad, realStep, from };
}

/**
 * 计算求圆弧上顶点需要的参数(这些参数用于在顶点着色器中基于顶点索引计算顶点新位置)
 * @param pa 原始图像矩形区域左上顶点坐标
 * @param pb 原始图像矩形区域右上顶点坐标
 * @param pc 原始图像矩形区域右下顶点坐标
 * @param pd 原始图像矩形区域左下顶点坐标
 * @param angle 弯曲的角度
 * @param xCount 水平方向分段数量
 * @param yCount 垂直方向分段数量
 * @param yDir ++y轴方向——1表示向下，-1则相反
 * @returns 求圆弧上顶点所需的参数
 */
export function computeCurveParams(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  xCount: number,
  yCount: number,
  yDir: CoordDirection
): CurveParams {
  angle = angleToRadian(angle);
  const rotateDir = sign(angle);
  // 是否反向弯曲
  const isOpposite = rotateDir === -1;
  // pa和pd组成向量旋转后的向量
  const vectorAD = computeRotatedVector(
    pa,
    pd,
    angle,
    -yDir as CoordDirection
  );
  // pb和pc组成向量旋转后的向量
  const vectorBC = computeRotatedVector(pb, pc, angle, yDir);

  // 最上方圆弧左端点
  const leftEndPoint = isOpposite ? pa : addPoint2D(pd, vectorAD);
  // 最上方圆弧右端点
  const rightEndPoint = isOpposite ? pb : addPoint2D(pc, vectorBC);
  // 弯曲起始角度、弯曲角度变化步长、弯曲方向、左右两端点的组成向量相对于水平方向的偏移角度
  const {
    from: fromAngle,
    realStep: angleStep,
    curveDir,
    offsetRad,
  } = computeAngleParams(
    leftEndPoint,
    rightEndPoint,
    angle,
    xCount,
    yDir,
  );
  // 最上方圆弧的半径、中心点
  const { radius: upRadius, center } = computeArcParams(
    leftEndPoint,
    rightEndPoint,
    angle,
    yDir,
    offsetRad
  );
  // 半径变化步长
  const radiusDelta = rotateDir * hypot(vectorAD.x, vectorAD.y) / yCount;
  return {
    upRadius,
    radiusDelta,
    center,
    fromAngle,
    angleStep,
    curveDir,
  };
}

/**
 * 计算点p1和点p2组成的向量旋转后的新向量
 * @param p1 第一个点
 * @param p2 第二个点
 * @param angle 旋转角度
 * @param yDir +y轴方向——1表示向下，-1则相反
 * @returns 旋转后的向量
 */
function computeRotatedVector(
  p1: Point2D,
  p2: Point2D,
  angle: number,
  yDir: CoordDirection,
): Point2D {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  // 是否反向弯曲
  const isOpposite = sign(angle) === -1;
  // 边旋转的角度
  const rotateRad = (angle / 2) * yDir;
  // 向量p2p1/p1p2的x分量
  const vectorX = isOpposite ? x2 - x1 : x1 - x2;
  // 向量p2p1/p1p2的y分量
  const vectorY = isOpposite ? y2 - y1 : y1 - y2;
  // 旋转后的向量x分量
  const x =
    cos(rotateRad) * vectorX - sin(rotateRad) * vectorY;
  // 旋转后的向量y分量
  const y =
    sin(rotateRad) * vectorX + cos(rotateRad) * vectorY;
  return { x, y };
}
