import { initTextureRenderer } from '@/utils/gl-texture';
import {
  computeNDCEndPositions,
  genVerticesUpdater,
  updatePosIndices,
  updateRectangleVertices,
} from '@/utils/gl-compute';
import { computeCurveParams, handleCurvePoints } from './compute';
import { initTextureRenderer1 } from './gl-texture1';

/**
 * 初始化绘制弯曲变形的图片的上下文并生成绘制回调
 * @param cvs 画布DOM
 * @param textPicture 文本图片资源
 * @param textRect 文本绘制的位置、尺寸
 * @returns 返回接收x/y方向分段数量参数的回调
 */
export function initDrawingCurveText(
  cvs: HTMLCanvasElement,
  textPicture: HTMLImageElement | ImageBitmap,
  textRect: TextRect
) {
  const { x, y, width, height } = textRect;
  const pa: Point2D = { x, y },
    pb: Point2D = { x: x + width, y },
    pc: Point2D = { x: x + width, y: y + height },
    pd: Point2D = { x, y: y + height };
  return initDrawingCurveImage(cvs, pa, pb, pc, pd, textPicture, true);
}

/**
 * 初始化绘制弯曲变形的图片的上下文并生成绘制回调，采用了函数柯里化以优化性能
 * @param cvs 画布DOM
 * @param pa 原始图片矩形区域左上顶点坐标
 * @param pb 原始图片矩形区域右上顶点坐标
 * @param pc 原始图片矩形区域右下顶点坐标
 * @param pd 原始图片矩形区域左下顶点坐标
 * @param img 原始图片资源
 * @param flip 是否反转图片y坐标
 * @returns 返回接收x/y方向分段数量参数的回调，该回调的执行结果为一个接收弯曲角度参数的绘制弯曲后图片的回调
 */
export function initDrawingCurveImage(
  cvs: HTMLCanvasElement,
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  img: HTMLImageElement | ImageBitmap,
  flip = false
) {
  [pa, pb, pc, pd] = computeNDCEndPositions(
    pa,
    pb,
    pc,
    pd,
    cvs.width,
    cvs.height
  );
  const tl = { x: 0, y: 1 },
    tr = { x: 1, y: 1 },
    bl = { x: 0, y: 0 };
  const widthHeightRatio = cvs.width / cvs.height;
  // 初始化gl绘制上下文,生成一个接收顶点数据和纹理坐标数据的绘制回调
  const render = initTextureRenderer(cvs, img);
  let updateCoords = false;
  return (xCount: number, yCount = xCount) => {
    const numberOfVertex = xCount * yCount * 6;
    const vertices = new Float32Array(numberOfVertex * 2);
    const coords = new Float32Array(vertices);
    const updater = genVerticesUpdater(vertices, xCount, yCount);
    updateRectangleVertices(tl, tr, bl, coords, xCount, yCount, flip);
    updateCoords = true;
    return (angle: number) => {
      // 暂不考虑大于180°或小于-180°的情况
      if (angle > 180 || angle < -180) {
        return;
      }
      console.time('draw gl')
      // 弯曲角度为0则返回原始图片矩形区域的所有端点
      if (angle === 0) {
        updateRectangleVertices(pa, pb, pd, vertices, xCount, yCount);
      } else {
        handleCurvePoints(
          pa,
          pb,
          pc,
          pd,
          angle,
          updater,
          xCount,
          yCount,
          -1,
          widthHeightRatio
        );
      }
      render?.(vertices, coords, updateCoords, numberOfVertex);
      updateCoords = false;
      console.timeEnd('draw gl')
    };
  };
}

export function initDrawingCurveImage1(
  cvs: HTMLCanvasElement,
  pa: Point2D,
  pb: Point2D,
  pc: Point2D,
  pd: Point2D,
  img: HTMLImageElement | ImageBitmap,
  flip = false
) {
  [pa, pb, pc, pd] = computeNDCEndPositions(
    pa,
    pb,
    pc,
    pd,
    cvs.width,
    cvs.height
  );
  const tl = { x: 0, y: 1 },
    tr = { x: 1, y: 1 },
    bl = { x: 0, y: 0 };
  const widthHeightRatio = cvs.width / cvs.height;
  // 初始化gl绘制上下文,生成一个接收顶点数据和纹理坐标数据的绘制回调
  const render = initTextureRenderer1(cvs, img);
  if (!render) {
    return console.error('初始化纹理渲染器失败!');
  }
  return (xCount: number, yCount = xCount) => {
    const numberOfVertex = xCount * yCount * 6;
    const posIndices = new Float32Array(numberOfVertex * 2);
    const vertices = new Float32Array(posIndices)
    const coords = new Float32Array(posIndices);
    updateRectangleVertices(pa, pb, pd, vertices, xCount, yCount);
    updateRectangleVertices(tl, tr, bl, coords, xCount, yCount, flip);
    updatePosIndices(posIndices, xCount, yCount);
    const drawingFn = render(vertices, posIndices, coords, numberOfVertex);
    return (angle: number) => {
      // 暂不考虑大于180°或小于-180°的情况
      if (angle > 180 || angle < -180) {
        return;
      }
      console.time('draw gl1')
      const { maxRadius, radiusDelta, center, fromAngle, angleStep, curveDir } =
        computeCurveParams(
          pa,
          pb,
          pc,
          pd,
          angle,
          xCount,
          yCount,
          -1,
          widthHeightRatio
        );
      drawingFn(
        maxRadius,
        radiusDelta,
        center,
        fromAngle,
        angleStep,
        curveDir,
        widthHeightRatio,
        angle === 0
      );
      console.timeEnd('draw gl1')
    };
  };
}
