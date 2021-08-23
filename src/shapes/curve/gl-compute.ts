import { Point2D } from '@/shapes/curve/canvas-compute';
import { handleCurvePoints, SignDirection } from './compute';

export function updateCurveVertices(
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  angle: number,
  curveVertices: Float32Array,
  xCount = 10,
  yCount = xCount,
  coordDir: SignDirection = 1,
  widthHeightRatio = 1
) {
  if (angle > 180 || angle < -180) {
    return;
  }
  // 弯曲角度为0则返回原矩形的所有端点
  if (angle === 0) {
    return updatePicVertices(pa, pb, pd, curveVertices, xCount, yCount);
  }
  // const curveVertices = new Float32Array(12 * xCount * yCount);
  let xIndex = 0,
    yIndex = 0;
  const updateVertices = (x: number, y: number, yI: number) => {
    curveVertices[yI - 1] = x;
    curveVertices[yI] = y;
  };
  handleCurvePoints(
    pa,
    pb,
    pc,
    pd,
    angle,
    (x: number, y: number) => {
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
      if (xIndex < xCount) {
        ++xIndex;
      } else {
        xIndex = 0;
        ++yIndex;
      }
    },
    xCount,
    yCount,
    coordDir,
    widthHeightRatio
  );
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
