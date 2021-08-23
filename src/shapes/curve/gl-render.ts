import { Point2D } from '@/shapes/curve/canvas-compute';
import { TextRect } from '@/utils/canvas-text';
import { initTextureRenderer } from '@/utils/gl-texture';
import {
  computeNDCEndPositions,
  updateCurveVertices,
  updatePicVertices,
} from './gl-compute';

export function initDrawingCurveText(
  cvs: HTMLCanvasElement,
  textPicture: HTMLImageElement | ImageBitmap,
  textRect: TextRect,
  flip = false
) {
  const { x, y, width, height } = textRect;
  const pa: Point2D = { x, y },
    pb: Point2D = { x: x + width, y },
    pc: Point2D = { x: x + width, y: y + height },
    pd: Point2D = { x, y: y + height };
  return initDrawingCurveImage(cvs, pa, pb, pc, pd, textPicture, flip);
}

/**
 * 初始化绘制弯曲变形的图片的上下文并生成绘制回调
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
  const drawingFn = initTextureRenderer(cvs, img);
  return (xCount: number, yCount = xCount) => {
    const shapeVertices = new Float32Array(xCount * yCount * 12);
    const picVertices = new Float32Array(shapeVertices);
    updatePicVertices(tl, tr, bl, picVertices, xCount, yCount, flip);
    return (angle: number) => {
      updateCurveVertices(
        pa,
        pb,
        pc,
        pd,
        angle,
        shapeVertices,
        xCount,
        yCount,
        -1,
        widthHeightRatio
      );
      drawingFn?.(shapeVertices, picVertices);
    };
  };
}
