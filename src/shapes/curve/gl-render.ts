import { initTextureRenderer } from '@/utils/gl-texture';
import {
  computeNDCEndPositions,
  genVerticesUpdater,
  genVerticesUpdater1,
  updatePicVertices,
  updatePicVertices1,
} from '@/utils/gl-compute';
import { handleCurvePoints } from './compute';

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
  const drawingFn = initTextureRenderer(cvs, img);
  return (xCount: number, yCount = xCount) => {
    const shapeVertices = new Float32Array(xCount * yCount * 12);
    const picVertices = new Float32Array(shapeVertices);
    updatePicVertices(tl, tr, bl, picVertices, xCount, yCount, flip);
    const updater = genVerticesUpdater(shapeVertices, xCount, yCount);

    const verticesCoords = new Float32Array(xCount * yCount * 24);
    updatePicVertices1(tl, tr, bl, verticesCoords, xCount, yCount, flip, 2);
    const updater1 = genVerticesUpdater1(verticesCoords, xCount, yCount);
    return (angle: number) => {
      if (angle > 180 || angle < -180) {
        return;
      }
      console.time('draw gl')
      // 弯曲角度为0则返回原矩形的所有端点
      if (angle === 0) {
        updatePicVertices(pa, pb, pd, shapeVertices, xCount, yCount);
        updatePicVertices1(pa, pb, pd, verticesCoords, xCount, yCount, false, 2);
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
        handleCurvePoints(
          pa,
          pb,
          pc,
          pd,
          angle,
          updater1,
          xCount,
          yCount,
          -1,
          widthHeightRatio
        );
      }
      // drawingFn?.(shapeVertices, picVertices);
      drawingFn?.(verticesCoords)
      console.log('vertices', shapeVertices, picVertices, verticesCoords)
      console.timeEnd('draw gl')
    };
  };
}
