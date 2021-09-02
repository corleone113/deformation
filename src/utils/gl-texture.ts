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
    console.log('获取attribute变量存储位置失败!');
    return null;
  }
  const verticesBuffer = gl.createBuffer(),
    coordsBuffer = gl.createBuffer();
  if (!verticesBuffer || !coordsBuffer) {
    console.log('创建缓冲区对象失败!');
    return null;
  }
  bindArrayBuffer(gl, verticesBuffer, aPosition);
  bindArrayBuffer(gl, coordsBuffer, aTexCoord);

  return { verticesBuffer, coordsBuffer };
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
