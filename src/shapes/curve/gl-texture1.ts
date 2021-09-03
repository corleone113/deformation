import { getWebGLContext, initShaders } from '@/libs/cuon-utils';

const VSHADER_SOURCE = `
uniform float u_MaxRadius;
uniform float u_RadiusDelta;
uniform vec2 u_Center;
uniform float u_FromAngle;
uniform float u_AngleStep;
uniform float u_CurveDir;
uniform float u_WidthHeightRatio;
uniform bool u_UsePos;
attribute vec4 a_Position;
attribute vec2 a_PosIndices;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main() {
  if (u_UsePos) {
    gl_Position = a_Position;
  } else {
    float radius = u_MaxRadius - a_PosIndices.y * u_RadiusDelta;
    float angle = u_FromAngle + a_PosIndices.x * u_AngleStep;
    float x = u_Center.x + radius * sin(angle);
    float y = (u_Center.y + radius * cos(angle) * u_CurveDir) * u_WidthHeightRatio;
    gl_Position = vec4(x, y, 0, 1);
  }
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

export function initTextureRenderer1(
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

  const staticParamsUpdater = initStaticParams(gl)
  if(!staticParamsUpdater) {
    return console.error('初始化静态参数失败!')
  }

  return (
    vertices: Float32Array,
    posIndices: Float32Array,
    texCoords: Float32Array,
    numberOfVertex: number
  ) => {
      const { verticesBuffer,posIndicesBuffer, coordsBuffer } = initBufferResult;
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, posIndicesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, posIndices, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);

      return (...args: Parameters<typeof staticParamsUpdater>) => {
        staticParamsUpdater(...args)
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, numberOfVertex);
      }

  };
}

function initStaticParams(
  gl: WebGLRenderingContext,
) {
  const u_MaxRadius = gl.getUniformLocation(gl.program, 'u_MaxRadius');
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
    !u_MaxRadius ||
    !u_RadiusDelta ||
    !u_Center ||
    !u_FromAngle ||
    !u_AngleStep ||
    !u_CurveDir ||
    !u_WidthHeightRatio || 
    !u_UsePos
  ) {
    return console.log('获取uniform变量存储位置失败!');
  }
  return (
    upRadius: number,
    radiusDelta: number,
    center: Point2D,
    fromAngle: number,
    angleStep: number,
    curveDir: number,
    widthHeightRatio: number,
    usePos: boolean) => {
      gl.uniform1f(u_MaxRadius, upRadius)
      gl.uniform1f(u_RadiusDelta, radiusDelta)
      gl.uniform2f(u_Center, center.x, center.y)
      gl.uniform1f(u_FromAngle, fromAngle)
      gl.uniform1f(u_AngleStep, angleStep)
      gl.uniform1f(u_CurveDir, curveDir)
      gl.uniform1f(u_WidthHeightRatio, widthHeightRatio)
      gl.uniform1f(u_UsePos, +usePos)
    }
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
   posIndicesBuffer = gl.createBuffer(),
    coordsBuffer = gl.createBuffer();
  if (!verticesBuffer ||!posIndicesBuffer || !coordsBuffer ) {
    console.error('创建缓冲区对象失败!');
    return null;
  }
  bindArrayBuffer(gl, verticesBuffer, aPosition);
  bindArrayBuffer(gl, posIndicesBuffer, aPosIndices);
  bindArrayBuffer(gl, coordsBuffer, aTexCoord);

  return { verticesBuffer, posIndicesBuffer, coordsBuffer };
}

function bindArrayBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  attrib: number,
  pointNum = 2
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attrib, pointNum, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib);
}

function initTexture(gl: WebGLRenderingContext, image: TexImageSource) {
  const texture = gl.createTexture();
  if (!texture) {
    console.log('创建纹理对象失败!');
    return false;
  }

  const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('获取取样器变量存储位置失败!');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler, 0);
  return true;
}
