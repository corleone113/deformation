// import { solveEquation } from './math';

export interface Point2D {
  x: number;
  y: number;
}

interface TransformMatrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShapePaths {
  upPath: Point2D[];
  downPath: Point2D[];
}

const { PI, hypot, tan, atan2, cos, sin, sign } = Math;

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

export function computeTextRect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x = 0,
  y = 0
): TextRect {
  const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
    ctx.measureText(text);
  const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
  return {
    x,
    y: y - actualBoundingBoxAscent,
    width,
    height,
  };
}

export function genTextPicture(
  ctx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  text: string,
  rect: TextRect
) {
  const { width, height } = rect;

  ctx.clearRect(0, 0, width, height);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = targetCtx.font;
  ctx.textBaseline = targetCtx.textBaseline;
  ctx.fillStyle = targetCtx.fillStyle;
  ctx.beginPath();
  ctx.fillText(text, 0, 0);
  return new Promise((resolve) => {
    ctx.canvas.toBlob((blob) => {
      resolve(createImageBitmap(blob as Blob));
    });
  }).catch((err) => console.error(err)) as Promise<ImageBitmap>;
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
  console.time('draw 2d');
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
  console.timeEnd('draw 2d');
}

/**
 * 判断是否能够计算并绘制裁剪的内容
 * @param points 顶点数组
 * @param i 顶点索引
 * @param stepCount 分段数量
 * @returns 只有非右/下边缘的点才能进行计算并绘制
 */
export function canDrawClip(points: Point2D[], i: number, stepCount: number) {
  return points[i + stepCount + 2] && i % (stepCount + 1) < stepCount;
}

/**
 *
 * @param pa 矩形的顶点A
 * @param pb 矩形的顶点B
 * @param pc 矩形的顶点C
 * @param pd 矩形的顶点D
 * @param i 矩形的索引
 * @param stepCount 分段数量
 * @param curvePoints 变形后的所有矩形的顶点数组
 * @returns 该矩形左上和右下部分的多边形的顶点数组(裁剪路径数组)
 */
function computeClipShapePaths(
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

  // 右下部分多边形的顶点数组
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
 * @returns 迂回点
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

/**
 * 将 abcd 四边形分割成 n 的 n 次方份，获取 n 等分后的所有点坐标
 * @param xCount     多少等分
 * @param pa     a 点坐标
 * @param pb     b 点坐标
 * @param pc     c 点坐标
 * @param pd     d 点坐标
 * @returns {Array}
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

  const originalPoints = [];

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

      originalPoints.push({
        x: x1 + ab_x * j,
        y: y1 + ab_y * j,
      });
    }
  }

  return originalPoints;
}

/**
 * 根据变化前后的点坐标，计算矩阵
 * @param p1     变化前坐标1
 * @param cp1    变化后坐标1
 * @param p2     变化前坐标2
 * @param cp2    变化后坐标2
 * @param p3     变化前坐标3
 * @param cp3    变化后坐标3
 * @returns {{a: number, b: number, c: number, d: number, e: number, f: number}}
 */
function computeTransformMatrix(
  p1: Point2D,
  cp1: Point2D,
  p2: Point2D,
  cp2: Point2D,
  p3: Point2D,
  cp3: Point2D
) {
  //传入x值解第一个方程 即  X = ax + cy + e 求ace
  //传入的四个参数，对应三元一次方程：ax+by+cz=d的四个参数：a、b、c、d，跟矩阵方程对比c为1
  const equation1 = [p1.x, p1.y, 1, cp1.x];
  const equation2 = [p2.x, p2.y, 1, cp2.x];
  const equation3 = [p3.x, p3.y, 1, cp3.x];

  //获得a、c、e
  const { x: a, y: c, z: e } = solveEquation3(equation1, equation2, equation3);
  // const [a, c, e] = solveEquation(equation1, equation2, equation3);

  //传入y值解第二个方程 即  Y = bx + dy + f 求 bdf
  equation1[3] = cp1.y;
  equation2[3] = cp2.y;
  equation3[3] = cp3.y;

  //获得b、d、f
  const { x: b, y: d, z: f } = solveEquation3(equation1, equation2, equation3);
  // const [b, d, f] = solveEquation(equation1, equation2, equation3);

  return {
    a,
    b,
    c,
    d,
    e,
    f,
  };
}

/**
 *
 * @param equation1 第一个三元方程系数及已知值构成的数组
 * @param equation2 第二个三元方程系数及已知值构成的数组
 * @param equation3 第三个三元方程系数及已知值构成的数组
 * @returns 解构成的对象
 */
function solveEquation3(
  equation1: number[],
  equation2: number[],
  equation3: number[]
) {
  const [a1, b1, c1, d1] = equation1;
  const [a2, b2, c2, d2] = equation2;
  const [a3, b3, c3, d3] = equation3;

  // 消元后得到的4个系数及两个已知值
  const A1 = a1 - (b1 * a2) / b2;
  const C1 = c1 - (b1 * c2) / b2;
  const D1 = d1 - (b1 * d2) / b2;
  const A2 = a2 - (b2 * a3) / b3;
  const C2 = c2 - (b2 * c3) / b3;
  const D2 = d2 - (b2 * d3) / b3;

  //计算xyz
  const x = ((C1 / C2) * D2 - D1) / ((C1 / C2) * A2 - A1);
  const z = (D2 - A2 * x) / C2;
  const y = (d1 - a1 * x - c1 * z) / b1;

  return {
    x,
    y,
    z,
  };
}

export type SignDirection = 1 | -1;
export type PointCallback = (x: number, y: number) => void;

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
  // console.timeEnd('compute curve points');
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
  // console.time('compute curve points');
  // console.log('-------------- pa', pa);
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

function angleToRadian(a: number) {
  return (a / 180) * PI;
}
