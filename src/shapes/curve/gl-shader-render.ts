import { getWebGLContext, initShaders } from '@/libs/cuon-utils';
import {
  computeNDCEndPositions,
  updateVertexIndices,
  updateRectanglePoints,
} from '@/utils/gl-compute';
import {
  bindArrayBuffer,
  initTexture,
  updateBuffersData,
} from '@/utils/gl-bind';
import { computeCurveParams } from './compute';

import VSHADER_SOURCE from './compute-curve-vertex.vs'
import FSHADER_SOURCE from './render-texture.fs'

/**
 * 初始化绘制弯曲弯曲变形的图像的上下文并生成绘制回调
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
  const renderGenerator = initTextureRendererGenerator(cvs, img);
  if (!renderGenerator) {
    return console.error('初始化纹理渲染器失败!');
  }
  return (xCount: number, yCount = xCount) => {
    const ctl = { x: 0, y: 0 },
      ctr = { x: xCount, y: 0 },
      cbl = { x: 0, y: yCount };
    const numberOfVertex = xCount * yCount * 6;
    const numberOfPoints = (xCount + 1) * (yCount + 1) * 2;
    const posIndices = new Float32Array(numberOfPoints);
    const vertices = new Float32Array(posIndices);
    const coords = new Float32Array(posIndices);
    const vertexIndices = new Uint32Array(numberOfVertex);

    // console.time('updateRectangleVertices 1');
    updateRectanglePoints(pa, pb, pd, vertices, xCount, yCount);
    // console.timeEnd('updateRectangleVertices 1');
    // console.time('updateRectangleVertices 2');
    updateRectanglePoints(tl, tr, bl, coords, xCount, yCount, flip);
    // console.timeEnd('updateRectangleVertices 2');
    // console.time('updateRectangleVertices 3');
    updateRectanglePoints(ctl, ctr, cbl, posIndices, xCount, yCount);
    // console.timeEnd('updateRectangleVertices 3');

    updateVertexIndices(vertexIndices, xCount, yCount);
    const render = renderGenerator(
      vertices,
      coords,
      posIndices,
      vertexIndices,
      numberOfVertex
    );
    return (angle: number) => {
      // 暂不考虑大于180°或小于-180°的情况
      if (angle > 180 || angle < -180) {
        return;
      }
      // console.time('draw gl shader');
      // console.time('compute params');
      const { upRadius, radiusDelta, center, fromAngle, angleStep, curveDir } =
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
      // console.timeEnd('compute params');
      // console.time('drawing');
      render?.(
        upRadius,
        radiusDelta,
        center,
        fromAngle,
        angleStep,
        curveDir,
        widthHeightRatio,
        angle === 0
      );
      // console.timeEnd('drawing');
      // console.timeEnd('draw gl shader');
    };
  };
}

function initTextureRendererGenerator(
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

  if (!gl.getExtension('OES_element_index_uint')) {
    return console.error('您的浏览器具有收藏价值!');
  }

  if (!initTexture(gl, image)) {
    return console.error('纹理初始化失败!');
  }

  const updateStaticParams = initStaticParams(gl);
  if (!updateStaticParams) {
    return console.error('初始化静态参数失败!');
  }

  return (
    vertices: Float32Array,
    coords: Float32Array,
    posIndices: Float32Array,
    vertexIndices: Uint32Array,
    numberOfVertex: number
  ) => {
    // 重新创建缓冲对象，以触发浏览器垃圾回收
    const initBufferResult = initVerticesAndCoordsBuffer(gl);
    if (!initBufferResult) {
      return console.error('初始化缓冲区对象失败!');
    }

    const {
      verticesBuffer,
      coordsBuffer,
      posIndicesBuffer,
      vertexIndicesBuffer,
    } = initBufferResult;
    updateBuffersData(
      gl,
      [verticesBuffer, coordsBuffer, posIndicesBuffer],
      [vertices, coords, posIndices]
    );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.DYNAMIC_DRAW);

    return (...args: Parameters<typeof updateStaticParams>) => {
      // console.time('update params');
      updateStaticParams(...args);
      // console.timeEnd('update params');

      // console.time('gl draw');
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, numberOfVertex, gl.UNSIGNED_INT, 0);
      // console.timeEnd('gl draw');
    };
  };
}

function initStaticParams(gl: WebGLRenderingContext) {
  const u_UpRadius = gl.getUniformLocation(gl.program, 'u_UpRadius');
  const u_RadiusDelta = gl.getUniformLocation(gl.program, 'u_RadiusDelta');
  const u_Center = gl.getUniformLocation(gl.program, 'u_Center');
  const u_FromAngle = gl.getUniformLocation(gl.program, 'u_FromAngle');
  const u_AngleStep = gl.getUniformLocation(gl.program, 'u_AngleStep');
  const u_CurveDir = gl.getUniformLocation(gl.program, 'u_CurveDir');
  const u_WidthHeightRatio = gl.getUniformLocation(
    gl.program,
    'u_WidthHeightRatio'
  );
  const u_UsePos = gl.getUniformLocation(gl.program, 'u_UsePos');
  if (
    !u_UpRadius ||
    !u_RadiusDelta ||
    !u_Center ||
    !u_FromAngle ||
    !u_AngleStep ||
    !u_CurveDir ||
    !u_WidthHeightRatio ||
    !u_UsePos
  ) {
    return console.error('获取attribute变量存储位置失败!');
  }
  return (
    upRadius: number,
    radiusDelta: number,
    center: Point2D,
    fromAngle: number,
    angleStep: number,
    curveDir: number,
    widthHeightRatio: number,
    usePos: boolean
  ) => {
    gl.uniform1f(u_UpRadius, upRadius);
    gl.uniform1f(u_RadiusDelta, radiusDelta);
    gl.uniform2f(u_Center, center.x, center.y);
    gl.uniform1f(u_FromAngle, fromAngle);
    gl.uniform1f(u_AngleStep, angleStep);
    gl.uniform1f(u_CurveDir, curveDir);
    gl.uniform1f(u_WidthHeightRatio, widthHeightRatio);
    gl.uniform1i(u_UsePos, +usePos);
  };
}

function initVerticesAndCoordsBuffer(gl: WebGLRenderingContext) {
  const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  const aPosIndices = gl.getAttribLocation(gl.program, 'a_PosIndices');
  const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (!~aPosition || !~aPosIndices || !~aTexCoord) {
    console.error('获取attribute变量存储位置失败!');
    return null;
  }
  const verticesBuffer = gl.createBuffer(),
    coordsBuffer = gl.createBuffer(),
    posIndicesBuffer = gl.createBuffer(),
    vertexIndicesBuffer = gl.createBuffer();
  if (
    !verticesBuffer ||
    !coordsBuffer ||
    !posIndicesBuffer ||
    !vertexIndicesBuffer
  ) {
    console.error('创建缓冲区对象失败!');
    return null;
  }

  bindArrayBuffer(gl, verticesBuffer, aPosition);
  bindArrayBuffer(gl, posIndicesBuffer, aPosIndices);
  bindArrayBuffer(gl, coordsBuffer, aTexCoord);

  return {
    verticesBuffer,
    coordsBuffer,
    posIndicesBuffer,
    vertexIndicesBuffer,
  };
}
