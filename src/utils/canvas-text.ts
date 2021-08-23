export interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
