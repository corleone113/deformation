/**
 * 求文本绘制的位置(实际位置)、尺寸
 * @param ctx canvas 2d绘制上下文
 * @param text 文本的内容
 * @param x 文本绘制的x坐标
 * @param y 文本绘制的y坐标
 * @returns 文本绘制的位置、尺寸
 */
export function computeTextRect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x = 0,
  y = 0
): TextRect {
  const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
    ctx.measureText(text);
  const height = actualBoundingBoxAscent + actualBoundingBoxDescent;
  return {
    x,
    y: y - actualBoundingBoxAscent,
    width,
    height,
  };
}

/**
 * 生成渲染后的文本的图片——因为canvas渲染文本的成本较高(性能较差)，且webgl没有渲染文本的api，所以需要这个函数才将文本转化为图片
 * @param ctx canvas 2d绘制上下文
 * @param targetCtx 待拷贝的2d绘制上下文——实际进行绘制的画布的2d上下文。
 * @param text 文本的内容
 * @param rect 文本渲染的位置、尺寸
 * @returns 生成的图片的bitmap的promise对象
 */
export function genTextPicture(
  ctx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  text: string,
  rect: TextRect
) {
  const { width, height } = rect;

  ctx.clearRect(0, 0, width, height);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = targetCtx.font;
  ctx.textBaseline = targetCtx.textBaseline;
  ctx.fillStyle = targetCtx.fillStyle;
  ctx.beginPath();
  ctx.fillText(text, 0, 0);
  return new Promise((resolve) => {
    ctx.canvas.toBlob((blob) => {
      resolve(createImageBitmap(blob as Blob));
    });
  }).catch((err) => console.error(err)) as Promise<ImageBitmap>;
}
