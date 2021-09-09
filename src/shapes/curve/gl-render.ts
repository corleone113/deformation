import { bindArrayBuffer, initTexture } from '@/utils/gl-init';
import {
  computeNDCEndPositions,
  genVerticesUpdater,
  updateRectangleVertices,
} from '@/utils/gl-compute';
import { handleCurvePoints } from './compute';
import { getWebGLContext, initShaders } from '@/libs/cuon-utils';

const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main() {
    gl_Position = a_Position;
    v_TexCoord = a_TexCoord;
}
`;
const FSHADER_SOURCE = `
precision highp float;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord;
void main() {
    vec4 color = texture2D(u_Sampler, v_TexCoord);
    gl_FragColor = color;
}
`;

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
      console.time('draw gl');
      // 弯曲角度为0则返回原始图片矩形区域的所有端点
      if (angle === 0) {
        updateRectangleVertices(pa, pb, pd, vertices, xCount, yCount);
      } else {
        // console.time('handleCurvePoints')
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
        // console.timeEnd('handleCurvePoints')
      }
      render?.(vertices, coords, updateCoords, numberOfVertex);
      updateCoords = false;
      console.timeEnd('draw gl');
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
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    return console.error('着色器初始化失败!');
  }

  if (!initTexture(gl, image)) {
    return console.error('纹理初始化失败!');
  }

  const initBufferResult = initVerticesAndCoordsBuffer(gl);
  if (!initBufferResult) {
    return console.error('初始化缓冲区对象失败!');
  }

  return (
    vertices: Float32Array,
    texCoords: Float32Array,
    updateCoords: boolean,
    numberOfVertex: number
  ) => {
    const { verticesBuffer, coordsBuffer } = initBufferResult;
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    if (updateCoords) {
      gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numberOfVertex);
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
    coordsBuffer = gl.createBuffer();
  if (!verticesBuffer || !coordsBuffer) {
    console.error('创建缓冲区对象失败!');
    return null;
  }
  bindArrayBuffer(gl, verticesBuffer, aPosition);
  bindArrayBuffer(gl, coordsBuffer, aTexCoord);

  return { verticesBuffer, coordsBuffer };
}
