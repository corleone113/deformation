/**
 * 生成更新变形后图片中分段三角形顶点数据的回调
 * @param curveVertices 保存顶点数据的类型数组
 * @param xCount x方向分段数量
 * @param yCount y方向分段数量
 * @returns 更新变形后分段三角形顶点数据的回调
 */
export function genVerticesUpdater(
  curveVertices: Float32Array,
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
   * 接收顶点数据并根据顶点的位置相应规则更新类型数组的回调
   * @param x 顶点x坐标值
   * @param y 顶点y坐标值
   * @param xIndex 顶点按水平排列的索引
   * @param yIndex 顶点按垂直排列的索引
   */
  return (x: number, y: number, xIndex: number, yIndex: number) => {
    if (xIndex > 0 && xIndex < xCount && yIndex > 0 && yIndex < yCount) {
      const c1 = 12 * yIndex * xCount + 12 * xIndex,
        c0 = c1 - 12 * xCount;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      updateVertices(x, y, c1 - 9);
      updateVertices(x, y, c1 - 5);
      updateVertices(x, y, c1 + 1);
    } else if (xIndex === 0 && yIndex === 0) {
      updateVertices(x, y, 1);
    } else if (xIndex === xCount && yIndex === yCount) {
      updateVertices(x, y, xCount * yCount * 12 - 1);
    } else if (xIndex === xCount && yIndex === 0) {
      const c0 = 12 * xIndex;
      updateVertices(x, y, c0 - 9);
      updateVertices(x, y, c0 - 5);
    } else if (xIndex === 0 && yIndex === yCount) {
      const c0 = 12 * xCount * yIndex - 12 * xCount;
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
    } else if (yIndex === 0 && xIndex > 0 && xIndex < xCount) {
      const c0 = 12 * xIndex;
      updateVertices(x, y, c0 - 9);
      updateVertices(x, y, c0 - 5);
      updateVertices(x, y, c0 + 1);
    } else if (yIndex === yCount && xIndex > 0 && xIndex < xCount) {
      const c0 = 12 * xCount * yIndex - 12 * xCount + 12 * xIndex;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
    } else if (xIndex === 0 && yIndex > 0 && yIndex < yCount) {
      const c1 = 12 * xCount * yIndex,
        c0 = c1 - 12 * xCount;
      updateVertices(x, y, c0 + 5);
      updateVertices(x, y, c0 + 9);
      updateVertices(x, y, c1 + 1);
    } else {
      const c0 = 12 * xCount * yIndex,
        c1 = c0 + 12 * xCount;
      updateVertices(x, y, c0 - 1);
      updateVertices(x, y, c1 - 9);
      updateVertices(x, y, c1 - 5);
    }
  };
}

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

function computeNDCPosition(point: Point2D, center: Point2D) {
  let { x, y } = point;
  const { x: cx, y: cy } = center;
  x = (x - cx) / cx;
  y = (cy - y) / cy;
  return { x, y };
}

export function updatePicVertices(
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
      if (i != endYIndex - yIndexDelta && j < xCount) {
        const lX = x + j * xStep;
        const rX = lX + xStep;
        const tY = y + i * yStep;
        const bY = tY + yStep * yIndexDelta;

        vertices[index++] = lX;
        vertices[index++] = tY;
        vertices[index++] = rX;
        vertices[index++] = tY;
        vertices[index++] = lX;
        vertices[index++] = bY;
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

