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

  // Set texture
  if (!initTexture(gl, image)) {
    return console.error('纹理初始化失败!');
  }

  const initBufferResult = initVerticesAndCoordsBuffer(gl);
  if (!initBufferResult) {
    return console.error('初始化缓冲区对象失败!');
  }

  return (shapeVertices: Float32Array, picVertices: Float32Array) => {
    const { shapeBuffer, picBuffer } = initBufferResult;
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, shapeVertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, picBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, picVertices, gl.DYNAMIC_DRAW);
    const numberOfVertex = shapeVertices.length / 2;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numberOfVertex); // Draw the rectangle
  };
}

function initVerticesAndCoordsBuffer(gl: WebGLRenderingContext) {
  const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (!~aPosition || !~aTexCoord) {
    console.log('Failed to get the storage location of attrib');
    return null;
  }
  const shapeBuffer = gl.createBuffer(),
    picBuffer = gl.createBuffer();
  if (!shapeBuffer || !picBuffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  bindArrayBuffer(gl, shapeBuffer, aPosition);
  bindArrayBuffer(gl, picBuffer, aTexCoord);

  return { shapeBuffer, picBuffer };
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
