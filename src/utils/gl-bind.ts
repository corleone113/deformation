export function bindArrayBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  attrib: number,
  pointNum = 2
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attrib, pointNum, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib);
}

export function updateBuffersData(gl: WebGLRenderingContext, buffers: WebGLBuffer[], dataArray: Float32Array[]) {
  for(let i=0;i<buffers.length;++i){
    const buf = buffers[i];
    const data = dataArray[i]
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }
}

export function batchBindArrayBuffer(
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  attribs: number[],
  pointNum = 2,
  perSize = Float32Array.BYTES_PER_ELEMENT
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (let i = 0; i < attribs.length; ++i) {
    const attrib = attribs[i];
    gl.vertexAttribPointer(
      attrib,
      pointNum,
      gl.FLOAT,
      false,
      attribs.length * pointNum * perSize,
      i * pointNum * perSize
    );
    gl.enableVertexAttribArray(attrib);
  }
}

export function initTexture(gl: WebGLRenderingContext, image: TexImageSource) {
  const texture = gl.createTexture();
  if (!texture) {
    console.error('创建纹理对象失败!');
    return false;
  }

  const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.error('获取取样器变量存储位置失败!');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler, 0);
  return true;
}
