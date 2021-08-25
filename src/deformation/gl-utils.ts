import { getWebGLContext, initShaders } from '@/libs/cuon-utils';
import { handleCurvePoints, Point2D, SignDirection, TextRect } from './utils';

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
 * 绘制弯曲(拱形)图片
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
  //   console.time('init gl');
  const drawingFn = initGLContext(cvs, img);
  //   console.timeEnd('init gl');
  return (xCount: number, yCount = xCount) => {
    const shapeVertices = new Float32Array(xCount * yCount * 12);
    const picVertices = new Float32Array(shapeVertices);
    console.time('computePicVertices')
    updatePicVertices(tl, tr, bl, picVertices, xCount, yCount, flip);
    console.timeEnd('computePicVertices')
    return (angle: number) => {
      console.time('draw gl');
      // console.time('computeCurveVertices');
      computeCurveVertices(
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
      // console.timeEnd('computeCurveVertices');
      drawingFn?.(shapeVertices, picVertices);
      console.timeEnd('draw gl');
    };
  };
}

function computeCurveVertices(
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
  // console.timeEnd('compute curve points');
  // return curveVertices;
}

function computeNDCEndPositions(
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

function updatePicVertices(
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
  // const coords: number[] = []

  // const vertices = new Float32Array(12 * xCount * yCount);
  let endYIndex = flip ? -1 : yCount + 1,
    yIndexDelta = flip ? -1 : 1,
    index = 0;
  // console.time('compute %%%');
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
        // coords.push(lX, tY, rX, tY, lX, bY, rX, tY, lX, bY, rX, bY);
      }
    }
  }
  // console.timeEnd('compute %%%');
  //   console.time('generate tr^^^^^^^^^');
  //   const ret = new Float32Array(coords);
  //   console.timeEnd('generate tr^^^^^^^^^');
  // return vertices;
}

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

export function initGLContext(cvs: HTMLCanvasElement, image: TexImageSource) {
  const gl = getWebGLContext(cvs);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Set texture
  if (!initTexture(gl, image)) {
    console.log('Failed to initialize the texture.');
    return;
  }
  const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (!~aPosition || !~aTexCoord) {
    console.log('Failed to get the storage location of attrib');
    return;
  }
  const shapeBuffer = gl.createBuffer(),
    picBuffer = gl.createBuffer();
  if (!shapeBuffer || !picBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  return (shapeVertices: Float32Array, picVertices: Float32Array) => {
    // console.time('update buffer');
    const n = updateVerticesAndCoordsBuffer(
      gl,
      aPosition,
      aTexCoord,
      shapeBuffer,
      picBuffer,
      shapeVertices,
      picVertices
    );
    // console.timeEnd('update buffer');
    if (n < 0) {
      console.log('Failed to set the positions of the vertices');
      return;
    }
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
    // console.time('draw gl')
    gl.drawArrays(gl.TRIANGLES, 0, n); // Draw the rectangle
    // gl.drawArrays(gl.POINTS, 0, n);
    // gl.drawArrays(gl.LINE_STRIP, 0, n);
    // console.timeEnd('draw gl')
  };
}

function updateVerticesAndCoordsBuffer(
  gl: WebGLRenderingContext,
  aPosition: number,
  aTexCoord: number,
  shapeBuffer: WebGLBuffer,
  picBuffer: WebGLBuffer,
  shapeVertices: Float32Array,
  picVertices: Float32Array
) {
  const n = shapeVertices.length / 2; // The number of vertices

  if (!updateArrayBuffer(gl, shapeBuffer, shapeVertices, aPosition)) {
    console.log('Failed to init vertices buffer.');
    return -1;
  }

  if (!updateArrayBuffer(gl, picBuffer, picVertices, aTexCoord)) {
    console.log('Failed to init texture coordinates buffer.');
    return -1;
  }

  return n;
}

function updateArrayBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  bufferSource: Float32Array,
  attrib: number,
  pointNum = 2
) {
  //   Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, bufferSource, gl.DYNAMIC_DRAW);
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(attrib, pointNum, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib); // Enable the assignment of the buffer object
  return true;
}

function initTexture(gl: WebGLRenderingContext, image: TexImageSource) {
  const texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler
  const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  // Flip the image's y axis
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // Make the texture unit active
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);
  return true;
}
