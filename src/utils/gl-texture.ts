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
const NUMBER_OF_VERTEX_DATA = 2;

export function initTextureRenderer(
  cvs: HTMLCanvasElement,
  image: TexImageSource,
  // verticesCoords: Float32Array,
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

  const buffer = initVerticesAndCoordsBuffer(gl)
  if(!buffer) {
    return console.error('缓冲区初始化失败')
  }

  // const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  // const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  // if (!~aPosition || !~aTexCoord) {
  //   console.log('Failed to get the storage location of attrib');
  //   return;
  // }
  // const shapeBuffer = gl.createBuffer(),
  //   picBuffer = gl.createBuffer();
  // if (!shapeBuffer || !picBuffer) {
  //   console.log('Failed to create the buffer object');
  //   return;
  // }

  // if (updateVerticesAndCoordsBuffer(
  //   gl,
  //   aPosition,
  //   aTexCoord,
  //   shapeBuffer,
  //   picBuffer
  // ) < 0) {
  //   console.log('Failed to set the positions of the vertices');
  //   return;
  // }

  // return (shapeVertices: Float32Array, picVertices: Float32Array) => {
    return (verticesCoords: Float32Array,) => {
    // console.time('update1')
    // const n1 = updateVerticesAndCoordsBuffer1(
    //   gl,
    //   aPosition,
    //   aTexCoord,
    //   shapeBuffer,
    //   picBuffer,
    //   shapeVertices,
    //   picVertices
    // );
    // if (n1 < 0) {
    //   console.log('Failed to set the positions of the vertices');
    //   return;
    // }
    // console.timeEnd('update1')

    gl.bufferData(gl.ARRAY_BUFFER, verticesCoords, gl.DYNAMIC_DRAW)
    const numberOfVertex = verticesCoords.length / 4

    // // console.time('update2')
    // gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer)
    // gl.bufferData(gl.ARRAY_BUFFER, shapeVertices, gl.DYNAMIC_DRAW)
    // gl.bindBuffer(gl.ARRAY_BUFFER, picBuffer)
    // gl.bufferData(gl.ARRAY_BUFFER, picVertices, gl.DYNAMIC_DRAW)
    // const n = shapeVertices.length / 2
    // // console.timeEnd('update2')

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numberOfVertex); // Draw the rectangle
  };
}

function initVerticesAndCoordsBuffer(
  gl: WebGLRenderingContext,
  // verticesCoords: Float32Array
) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // gl.bufferData(gl.ARRAY_BUFFER, verticesCoords, gl.DYNAMIC_DRAW);
  // const byteSize = verticesCoords.BYTES_PER_ELEMENT;
  const byteSize = Float32Array.BYTES_PER_ELEMENT;
  const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
  const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (!~aPosition || !~aTexCoord) {
    console.log('Failed to get the storage location of attrib');
    return null;
  }
  // const numberOfVertex = verticesCoords.length / 4;
  gl.vertexAttribPointer(
    aPosition,
    NUMBER_OF_VERTEX_DATA,
    gl.FLOAT,
    false,
    NUMBER_OF_VERTEX_DATA * 2 * byteSize,
    0
  );
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(
    aTexCoord,
    NUMBER_OF_VERTEX_DATA,
    gl.FLOAT,
    false,
    NUMBER_OF_VERTEX_DATA * 2 * byteSize,
    NUMBER_OF_VERTEX_DATA * byteSize
  );
  gl.enableVertexAttribArray(aPosition);
  // return { buffer, numberOfVertex };
  return buffer
}

function updateVerticesAndCoordsBuffer1(
  gl: WebGLRenderingContext,
  aPosition: number,
  aTexCoord: number,
  shapeBuffer: WebGLBuffer,
  picBuffer: WebGLBuffer,
  shapeVertices: Float32Array,
  picVertices: Float32Array
) {
  const n = shapeVertices.length / 2; // The number of vertices

  if (!updateArrayBuffer1(gl, shapeBuffer, shapeVertices, aPosition)) {
    console.log('Failed to init vertices buffer.');
    return -1;
  }

  if (!updateArrayBuffer1(gl, picBuffer, picVertices, aTexCoord)) {
    console.log('Failed to init texture coordinates buffer.');
    return -1;
  }

  return n;
}

function updateArrayBuffer1(
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

function updateVerticesAndCoordsBuffer(
  gl: WebGLRenderingContext,
  aPosition: number,
  aTexCoord: number,
  shapeBuffer: WebGLBuffer,
  picBuffer: WebGLBuffer,
  // shapeVertices: Float32Array,
  // picVertices: Float32Array
) {
  // const n = shapeVertices.length / 2; // The number of vertices

  if (!updateArrayBuffer(gl, shapeBuffer, aPosition)) {
    console.log('Failed to init vertices buffer.');
    return -1;
  }

  if (!updateArrayBuffer(gl, picBuffer, aTexCoord)) {
    console.log('Failed to init texture coordinates buffer.');
    return -1;
  }

  return 1;
}

function updateArrayBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  // bufferSource: Float32Array,
  attrib: number,
  pointNum = 2
) {
  //   Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   Write date into the buffer object
  // gl.bufferData(gl.ARRAY_BUFFER, bufferSource, gl.DYNAMIC_DRAW);
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
