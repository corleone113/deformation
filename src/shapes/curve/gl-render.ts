import { bindArrayBuffer, initTexture } from '@/utils/gl-bind';
import {
  computeNDCEndPositions,
  updateVertexIndices,
  updateRectanglePoints,
} from '@/utils/gl-compute';
import { handleCurvePoints } from './compute';
import { getWebGLContext, initShaders } from '@/libs/cuon-utils';
import VSHADER_SOURCE from './vertex-coord.vs';
import FSHADER_SOURCE from './render-texture.fs';

/**
 * 初始化绘制弯曲变形的图像的上下文并生成绘制回调
 * @param cvs 画布DOM
 * @param textPicture 文本图像资源
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
 * 初始化绘制弯曲变形的图像的上下文并生成绘制回调，采用了函数柯里化以优化性能
 * @param cvs 画布DOM
 * @param pa 原始图像矩形区域左上顶点坐标
 * @param pb 原始图像矩形区域右上顶点坐标
 * @param pc 原始图像矩形区域右下顶点坐标
 * @param pd 原始图像矩形区域左下顶点坐标
 * @param img 原始图像资源
 * @param flip 是否反转图像y坐标
 * @returns 返回接收x/y方向分段数量参数的回调，该回调的执行结果为一个接收弯曲角度参数的绘制弯曲后图像的回调
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
  const renderGenerator = initTextureRenderer(cvs, img);
  return (xCount: number, yCount = xCount) => {
    const numberOfVertex = xCount * yCount * 6;
    const pointIndices = new Uint32Array(numberOfVertex);
    const numberOfPoints = (xCount + 1) * (yCount + 1) * 2;
    const vertices = new Float32Array(numberOfPoints);
    const coords = new Float32Array(vertices);
    updateRectanglePoints(tl, tr, bl, coords, xCount, yCount, flip);
    updateVertexIndices(pointIndices, xCount, yCount);
    const render = renderGenerator?.(pointIndices, coords, numberOfVertex);
    return (angle: number) => {
      // 暂不考虑大于180°或小于-180°的情况
      if (angle > 180 || angle < -180) {
        return;
      }
      // console.time('draw gl1');
      // 弯曲角度为0则返回原始图像矩形区域的所有端点
      if (angle === 0) {
        updateRectanglePoints(pa, pb, pd, vertices, xCount, yCount);
      } else {
        // console.time('handleCurvePoints')
        let index = 0;
        handleCurvePoints(
          pa,
          pb,
          pc,
          pd,
          angle,
          (x: number, y: number) => {
            vertices[index++] = x;
            vertices[index++] = y;
          },
          xCount,
          yCount,
          -1,
          widthHeightRatio
        );
        // console.timeEnd('handleCurvePoints')
      }
      render?.(vertices);
      // console.timeEnd('draw gl1');
    };
  };
}

export function initTextureRenderer(
  cvs: HTMLCanvasElement,
  image: TexImageSource
) {
  const gl = getWebGLContext(cvs);
  if (!gl) {
    return console.error('获取WebGL绘制上下文失败!');
  }

  if (!gl.getExtension('OES_element_index_uint')) {
    return console.error('您的浏览器具有收藏价值!');
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    return console.error('着色器初始化失败!');
  }

  if (!initTexture(gl, image)) {
    return console.error('纹理初始化失败!');
  }

  return (
    pointIndices: Uint32Array,
    texCoords: Float32Array,
    numberOfVertex: number
  ) => {
    // 重新创建缓冲对象，以触发浏览器垃圾回收
    const initBufferResult = initVerticesAndCoordsBuffer(gl);
    if (!initBufferResult) {
      return console.error('初始化缓冲区对象失败!');
    }
    const { verticesBuffer, coordsBuffer, indexBuffer } = initBufferResult;
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pointIndices, gl.DYNAMIC_DRAW);

    return (vertices: Float32Array) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, numberOfVertex, gl.UNSIGNED_INT, 0);
    };
  };
}

function initVerticesAndCoordsBuffer(gl: WebGLRenderingContext) {
  const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (!~aPosition || !~aTexCoord) {
    console.error('获取attribute变量存储位置失败!');
    return null;
  }
  const verticesBuffer = gl.createBuffer(),
    coordsBuffer = gl.createBuffer(),
    indexBuffer = gl.createBuffer();
  if (!verticesBuffer || !coordsBuffer || !indexBuffer) {
    console.error('创建缓冲区对象失败!');
    return null;
  }
  bindArrayBuffer(gl, verticesBuffer, aPosition);
  bindArrayBuffer(gl, coordsBuffer, aTexCoord);

  return { verticesBuffer, coordsBuffer, indexBuffer };
}
