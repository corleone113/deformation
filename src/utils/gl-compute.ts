/**
 * 生成用于更新变形后图片中分段三角形顶点数据的回调
 * @param curveVertices 保存顶点数据的类型数组
 * @param xCount x方向分段数量
 * @param yCount y方向分段数量
 * @returns 更新变形后分段三角形顶点数据的回调
 */
export function genVerticesUpdater(
  curveVertices: Float32Array,
  vertices1: Float32Array,
  xCount = 10,
  yCount = xCount
): PointCallback {
  /**
   * 更新顶点数据的回调
   * @param x 顶点x坐标值
   * @param y 顶点y坐标值
   * @param vertexYIndex 顶点y坐标值在类型数组中的索引位置
   */
  const updateVertices = (x: number, y: number, vertexYIndex: number) => {
    curveVertices[vertexYIndex - 1] = x;
    curveVertices[vertexYIndex] = y;
  };
  /**
   * 接收顶点数据并根据顶点的位置以及相应规则更新类型数组的回调
   * @param x 顶点x坐标值
   * @param y 顶点y坐标值
   * @param xIndex 顶点按水平排列的索引
   * @param yIndex 顶点按垂直排列的索引
   */
  return (x: number, y: number, xIndex: number, yIndex: number) => {
    const i = (yIndex * (xCount + 1) + xIndex + 1) * 2 - 1
    vertices1[i - 1] = x;
    vertices1[i] = y;
    console.log('x', x, 'y', y)
    // 非边缘上的顶点，求顶点数据的索引的规则参考：
    if (xIndex > 0 && xIndex < xCount && yIndex > 0 && yIndex < yCount) {
      const c1 = 12 * yIndex * xCount + 12 * xIndex,
        c0 = c1 - 12 * xCount;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      updateVertices(x, y, c1 - 9);
      updateVertices(x, y, c1 - 5);
      updateVertices(x, y, c1 + 1);
      // 左上角的顶点
    } else if (xIndex === 0 && yIndex === 0) {
      updateVertices(x, y, 1);
      // 右下角的顶点
    } else if (xIndex === xCount && yIndex === yCount) {
      updateVertices(x, y, xCount * yCount * 12 - 1);
      // 右上角的顶点
    } else if (xIndex === xCount && yIndex === 0) {
      const c0 = 12 * xIndex;
      updateVertices(x, y, c0 - 9);
      updateVertices(x, y, c0 - 5);
      // 左下角的顶点
    } else if (xIndex === 0 && yIndex === yCount) {
      const c0 = 12 * xCount * yIndex - 12 * xCount;
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      // 上边缘上的顶点(不包括角点)
    } else if (yIndex === 0 && xIndex > 0 && xIndex < xCount) {
      const c0 = 12 * xIndex;
      updateVertices(x, y, c0 - 9);
      updateVertices(x, y, c0 - 5);
      updateVertices(x, y, c0 + 1);
      // 下边缘上的顶点(不包含角点)
    } else if (yIndex === yCount && xIndex > 0 && xIndex < xCount) {
      const c0 = 12 * xCount * yIndex - 12 * xCount + 12 * xIndex;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      // 左边缘上的顶点(不包含角点)
    } else if (xIndex === 0 && yIndex > 0 && yIndex < yCount) {
      const c1 = 12 * xCount * yIndex,
        c0 = c1 - 12 * xCount;
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      updateVertices(x, y, c1 + 1);
      // 右边缘上的顶点(不包含角点)
    } else {
      const c0 = 12 * xCount * yIndex,
        c1 = c0 + 12 * xCount;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c1 - 9);
      updateVertices(x, y, c1 - 5);
    }
  };
}

/**
 * 将画布坐标系下矩形四个顶点转换到NDC(标准设备坐标系)
 * @param pa 矩形左上角顶点
 * @param pb 矩形右上角顶点
 * @param pc 矩形右下角顶点
 * @param pd 矩形左下角顶点
 * @param cvsWidth 画布宽度
 * @param cvsHeight 画布高度
 * @returns 转换后的四个顶点坐标组成的数组
 */
export function computeNDCEndPositions(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  cvsWidth: number,
  cvsHeight: number
): [Point2D, Point2D, Point2D, Point2D] {
  const center: Point2D = { x: cvsWidth / 2, y: cvsHeight / 2 };
  return [
    computeNDCPosition(pa, center),
    computeNDCPosition(pb, center),
    computeNDCPosition(pc, center),
    computeNDCPosition(pd, center),
  ];
}

/**
 * 将顶点从画布坐标系转换到NDC——x坐标由[0, cvsWidth]映射到[-1, 1];y坐标由[0, cvsHeight]映射到[-1, 1]
 * @param point 画布坐标系下的顶点
 * @param center 画布坐标系下的中心点
 * @returns 转换后的顶点坐标
 */
function computeNDCPosition(point: Point2D, center: Point2D) {
  let { x, y } = point;
  const { x: cx, y: cy } = center;
  x = (x - cx) / cx;
  y = (cy - y) / cy;
  return { x, y };
}

/**
 * 更新变形前图片矩形区域内分段三角形上顶点数据
 * @param pa 矩形左上角顶点
 * @param pb 矩形右上角顶点
 * @param pd 矩形左下角顶点
 * @param vertices 保存顶点数据的类型数组
 * @param xCount 水平方向分段数量
 * @param yCount 垂直方向分段数量
 * @param flip 是否翻转y轴
 */
export function updateRectangleVertices(
  pa: Point2D,
  pb: Point2D,
  pd: Point2D,
  vertices: Float32Array,
  vertices1: Float32Array,
  xCount: number,
  yCount = xCount,
  flip = false
) {
  const { x, y } = pa;
  const yStep = (pd.y - pa.y) / yCount;
  const xStep = (pb.x - pa.x) / xCount;
  let endYIndex = flip ? -1 : yCount + 1,
    yIndexDelta = flip ? -1 : 1,
    index = 0,
    index1 = 0;
  for (let i = flip ? yCount : 0; i !== endYIndex; i += yIndexDelta) {
    for (let j = 0; j <= xCount; ++j) {
       // 当前分段矩形左边缘x坐标
       const lX = x + j * xStep;
       // 当前分段矩形上边缘y坐标
       const tY = y + i * yStep;
       vertices1[index1++] = lX;
       vertices1[index1++] = tY;
      if (i != endYIndex - yIndexDelta && j < xCount) {
        // 当前分段矩形左边缘x坐标
        const lX = x + j * xStep;
        // 当前分段矩形右边缘x坐标
        const rX = lX + xStep;
        // 当前分段矩形上边缘y坐标
        const tY = y + i * yStep;
        // 当前分段矩形下边缘y坐标
        const bY = tY + yStep * yIndexDelta;

        // 更新当前分段矩形左上三角形三个顶点数据到类型数组中
        vertices[index++] = lX;
        vertices[index++] = tY;
        vertices[index++] = rX;
        vertices[index++] = tY;
        vertices[index++] = lX;
        vertices[index++] = bY;
        // 更新当前分段矩形右下三角形三个顶点数据到类型数组中
        vertices[index++] = rX;
        vertices[index++] = tY;
        vertices[index++] = lX;
        vertices[index++] = bY;
        vertices[index++] = rX;
        vertices[index++] = bY;
      }
    }
  }
}

export function updateRectangleVertices1(
  pa: Point2D,
  pb: Point2D,
  pd: Point2D,
  vertices: Float32Array,
  xCount: number,
  yCount = xCount,
  flip = false
) {
  const { x, y } = pa;
  const yStep = (pd.y - pa.y) / yCount;
  const xStep = (pb.x - pa.x) / xCount;
  let endYIndex = flip ? -1 : yCount + 1,
    yIndexDelta = flip ? -1 : 1,
    index = 0;
  for (let i = flip ? yCount : 0; i !== endYIndex; i += yIndexDelta) {
    for (let j = 0; j <= xCount; ++j) {
      const pX = x + j * xStep;
      const pY = y + i * yStep;

      vertices[index++] = pX;
      vertices[index++] = pY;
    }
  }
}

export function updatePointIndices(
  pointIndices: Uint8Array,
  xCount: number,
  yCount = xCount
) {
  let index = 0;
  for (let i = 0; i < yCount; ++i) {
    for (let j = 0; j < xCount; ++j) {
      const p1 = i * (xCount + 1) + j;
      const p2 = p1 + 1;
      const p3 = p2 + xCount;
      const p4 = p3 + 1;

      pointIndices[index++] = p1;
      pointIndices[index++] = p2;
      pointIndices[index++] = p3;

      pointIndices[index++] = p2;
      pointIndices[index++] = p3;
      pointIndices[index++] = p4;
    }
  }
}
