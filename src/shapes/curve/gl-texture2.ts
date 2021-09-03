import { getWebGLContext, initShaders } from '@/libs/cuon-utils';
import { bindArrayBuffer, initTexture } from '@/utils/gl-texture';

const genVertexShaderSource = (numberOfVertices: number) => {
  return `
    uniform float u_MaxRadius;
    uniform float u_RadiusDelta;
    uniform vec2 u_Center;
    uniform float u_FromAngle;
    uniform float u_AngleStep;
    uniform float u_CurveDir;
    uniform float u_WidthHeightRatio;
    uniform bool u_UsePos;
    uniform int u_xCount;
    uniform int u_yCount;
    uniform bool u_flip;
    attribute vec4 a_Position;
    // attribute vec2 a_PosIndices;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    
    vec2 posIndices[${numberOfVertices}];
    bool initialized = false
    
    void updatePosIndices(int xCount, int yCount, bool flip) {
        const int endYIndex = flip ? -1 : yCount + 1,
          yIndexDelta = flip ? -1 : 1;
        int vIndex = 0;
        for (int i = flip ? yCount : 0; i !== endYIndex; i += yIndexDelta) {
          for (int j = 0; j <= xCount; ++j) {
            if (i != endYIndex - yIndexDelta && j < xCount) {
              // 当前分段矩形左边缘x索引
              int lX = j;
              // 当前分段矩形右边缘x索引
              int rX = j + 1;
              // 当前分段矩形上边缘y索引
              int tY =  i;
              // 当前分段矩形下边缘y索引
              int bY = i + yIndexDelta;

              const int index = vIndex;
      
              // 更新当前分段矩形左上三角形三个顶点索引数据到类型数组中
              posIndices[index] = vec2(lX, tY);
              posIndices[index + 1] = vec2(rX, tY);
              posIndices[index + 2] = vec2(lX, bY);
              // 更新当前分段矩形右下三角形三个顶点索引数据到类型数组中
              posIndices[index + 3] = vec2(rX, tY);
              posIndices[index + 4] = vec2(lX, bY);
              posIndices[index + 5] = vec2(rX, bY);
              vIndex = index + 5;
            }
          }
        }
      }
    int vIndex = 0;
    void main() {
      if (!initialized) {
        initialized = true;
        updatePosIndices(u_xCount, u_yCount, u_flip);
      }
      if (u_UsePos) {
        gl_Position = a_Position;
      } else {
        const index = vIndex;
        float radius = u_MaxRadius - posIndices[index].y * u_RadiusDelta;
        float angle = u_FromAngle + posIndices[index].x * u_AngleStep;
        float x = u_Center.x + radius * sin(angle);
        float y = (u_Center.y + radius * cos(angle) * u_CurveDir) * u_WidthHeightRatio;
        gl_Position = vec4(x, y, 0, 1);
      }
      v_TexCoord = a_TexCoord;
      ++vIndex;
    }
    `;
};
const FSHADER_SOURCE = `
precision highp float;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord;
void main() {
    vec4 color = texture2D(u_Sampler, v_TexCoord);
    gl_FragColor = color;
}
`;

export function initTextureRenderer2(
  cvs: HTMLCanvasElement,
  image: TexImageSource
) {
  const gl = getWebGLContext(cvs);
  if (!gl) {
    return console.error('获取WebGL绘制上下文失败!');
  }

  return (
    vertices: Float32Array,
    texCoords: Float32Array,
    numberOfVertex: number
  ) => {
    if (
      !initShaders(gl, genVertexShaderSource(numberOfVertex), FSHADER_SOURCE)
    ) {
      return console.error('着色器初始化失败!');
    }

    if (!initTexture(gl, image)) {
      return console.error('纹理初始化失败!');
    }

    const initBufferResult = initVerticesAndCoordsBuffer(gl);
    if (!initBufferResult) {
      return console.error('初始化缓冲区对象失败!');
    }

    const staticParamsUpdater = initStaticParams(gl);
    if (!staticParamsUpdater) {
      return console.error('初始化静态参数失败!');
    }
    const { verticesBuffer, coordsBuffer } = initBufferResult;
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);

    return (...args: Parameters<typeof staticParamsUpdater>) => {
      staticParamsUpdater(...args);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, numberOfVertex);
    };
  };
}

function initStaticParams(gl: WebGLRenderingContext) {
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
  const u_xCount = gl.getUniformLocation(gl.program, 'u_xCount');
  const u_yCount = gl.getUniformLocation(gl.program, 'u_yCount');
  const u_flip = gl.getUniformLocation(gl.program, 'u_flip');
  if (
    !u_MaxRadius ||
    !u_RadiusDelta ||
    !u_Center ||
    !u_FromAngle ||
    !u_AngleStep ||
    !u_CurveDir ||
    !u_WidthHeightRatio ||
    !u_UsePos ||
    !u_xCount ||
    !u_yCount ||
    !u_flip
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
    usePos: boolean,
    xCount: number,
    yCount: number,
    flip: boolean
  ) => {
    gl.uniform1f(u_MaxRadius, upRadius);
    gl.uniform1f(u_RadiusDelta, radiusDelta);
    gl.uniform2f(u_Center, center.x, center.y);
    gl.uniform1f(u_FromAngle, fromAngle);
    gl.uniform1f(u_AngleStep, angleStep);
    gl.uniform1f(u_CurveDir, curveDir);
    gl.uniform1f(u_WidthHeightRatio, widthHeightRatio);
    gl.uniform1f(u_UsePos, +usePos);
    gl.uniform1i(u_xCount, xCount);
    gl.uniform1i(u_yCount, yCount);
    gl.uniform1i(u_flip, +flip);
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
