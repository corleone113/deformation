import { solveEquation3 } from '@/utils/math';

const { hypot } = Math;

/**
 * 判断是否能够计算并绘制裁剪区域
 * @param points 顶点数组
 * @param i 顶点索引
 * @param stepCount 分段数量
 * @returns 只有非右/下边缘的点才能进行计算并绘制
 */
export function canDrawClip(points: Point2D[], i: number, stepCount: number) {
  return points[i + stepCount + 2] && i % (stepCount + 1) < stepCount;
}

/** 计算矩形裁剪区域的的顶点路径
 * @param pa 矩形的左上顶点
 * @param pb 矩形的右上顶点
 * @param pc 矩形的右下顶点
 * @param pd 矩形的左下顶点
 * @param i 矩形左上角顶点的索引
 * @param stepCount 分段数量
 * @param curvePoints 变形后的所有矩形的顶点数组
 * @returns 该矩形左上和右下部分的多边形的顶点数组(裁剪路径数组)
 */
export function computeClipShapePaths(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  i: number,
  stepCount: number,
  curvePoints: Point2D[]
): ShapePaths {
  // 左上三角形的三个(可能的)迂回点
  let pbTo = null;
  let pdTo = null;
  let paTo = null;

  // 右下部分多边形的顶点路径数组
  const downPath = [
    pc,
    pb,
    computeDetourPoint(pb, pa),
    computeDetourPoint(pd, pa),
    pd,
  ];
  const upPath = [pa, pb, pd];
  // 矩形索引大于分段数量即上方(未变形情况下的上方)存在矩形
  if (i > stepCount) {
    pbTo = curvePoints[i - stepCount];
  }
  // 矩形索引对分段数量加1取余若大于0则左侧存在矩形
  if (i % (stepCount + 1) > 0) {
    pdTo = curvePoints[i + stepCount];
  }
  // 顶点B和D对应迂回点都存在时则基于左上侧矩形的顶点A求迂回点
  if (pbTo && pdTo) {
    paTo = curvePoints[i - stepCount - 2];
    upPath.splice(
      0,
      1,
      computeDetourPoint(pd, pdTo),
      computeDetourPoint(pa, paTo),
      computeDetourPoint(pb, pbTo)
    );
  }
  // 只有B的迂回点存在时则基于上侧矩形的顶点A求迂回点
  else if (pbTo) {
    paTo = curvePoints[i - stepCount - 1];
    upPath.splice(
      0,
      1,
      computeDetourPoint(pa, paTo),
      computeDetourPoint(pb, pbTo)
    );
  }
  // 只有D的迂回点存在时则基于左侧矩形的顶点A求迂回点
  else if (pdTo) {
    paTo = curvePoints[i - 1];
    upPath.splice(
      0,
      1,
      computeDetourPoint(pd, pdTo),
      computeDetourPoint(pa, paTo)
    );
  }

  return {
    upPath,
    downPath,
  };
}

/**
 * 计算迂回点
 * @param from 向量起点
 * @param to 向量终点
 * @returns 迂回点坐标
 */
function computeDetourPoint(from: Point2D, to: Point2D): Point2D {
  const { x: fx, y: fy } = from;
  const { x: tx, y: ty } = to;
  const dx = tx - fx;
  const dy = ty - fy;
  const len = hypot(dx, dy);
  return {
    x: fx + dx / len,
    y: fy + dy / len,
  };
}

/**
 * 将 abcd 四边形分割成 xCount * yCount 个四边形，获取所有顶点
 * @param pa 矩形的左上顶点
 * @param pb 矩形的右上顶点
 * @param pc 矩形的右下顶点
 * @param pd 矩形的左下顶点
 * @param xCount 水平方向分段数量
 * @param yCount 垂直方向分段数量
 * @returns 返回所有顶点的数组
 */
export function computeOriginalPoints(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  xCount: number,
  yCount = xCount
) {
  // ad 向量方向 n 等分
  const ad_x = (pd.x - pa.x) / yCount;
  const ad_y = (pd.y - pa.y) / yCount;
  // bc 向量方向 n 等分
  const bc_x = (pc.x - pb.x) / yCount;
  const bc_y = (pc.y - pb.y) / yCount;

  const points = [];

  //左边点递增，右边点递增，获取每一次递增后的新的向量，继续 n 等分，从而获取所有点坐标
  for (let i = 0; i <= yCount; ++i) {
    //获得 ad 向量 n 等分后的坐标
    let x1 = pa.x + ad_x * i;
    let y1 = pa.y + ad_y * i;
    //获得 bc 向量 n 等分后的坐标
    let x2 = pb.x + bc_x * i;
    let y2 = pb.y + bc_y * i;

    for (let j = 0; j <= xCount; ++j) {
      // ab 向量为：[x2 - x1 , y2 - y1]，所以 n 等分后的增量为除于 n
      let ab_x = (x2 - x1) / xCount;
      let ab_y = (y2 - y1) / xCount;

      points.push({
        x: x1 + ab_x * j,
        y: y1 + ab_y * j,
      });
    }
  }

  return points;
}

/**
 * 根据变化前后的点坐标，计算矩阵
 * @param p1     变化前坐标1
 * @param cp1    变化后坐标1
 * @param p2     变化前坐标2
 * @param cp2    变化后坐标2
 * @param p3     变化前坐标3
 * @param cp3    变化后坐标3
 * @returns 2d模型变换矩阵
 */
export function computeTransformMatrix(
  p1: Point2D,
  cp1: Point2D,
  p2: Point2D,
  cp2: Point2D,
  p3: Point2D,
  cp3: Point2D
): TransformMatrix2D {
  //传入x值解第一个方程 即  X = ax + cy + e 求ace
  //传入的四个参数，对应三元一次方程：ax+by+cz=d的四个参数：a、b、c、d，跟矩阵方程对比c为1
  const equation1 = [p1.x, p1.y, 1, cp1.x];
  const equation2 = [p2.x, p2.y, 1, cp2.x];
  const equation3 = [p3.x, p3.y, 1, cp3.x];

  //获得a、c、e
  const [a, c, e] = solveEquation3(equation1, equation2, equation3);

  //传入y值解第二个方程 即  Y = bx + dy + f 求 bdf
  equation1[3] = cp1.y;
  equation2[3] = cp2.y;
  equation3[3] = cp3.y;

  //获得b、d、f
  const [b, d, f] = solveEquation3(equation1, equation2, equation3);

  return [a, b, c, d, e, f];
}
