import { Point2D } from '@/shapes/curve/canvas-compute';
import { drawCurveText } from '@/shapes/curve/canvas-render';
import { computeTextRect, genTextPicture, TextRect } from '@/utils/canvas-text';
import {
  FC,
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
  FormEventHandler,
} from 'react';

type StaticDrawingParams = [
  CanvasRenderingContext2D,
  TextRect,
  Promise<ImageBitmap>
];
export const CurveText: FC = memo(() => {
  const [xCount, setXCount] = useState(50);
  const [yCount, setYCount] = useState(50);
  const [angle, setAngle] = useState(100);
  const cvsRef = useRef<null | HTMLCanvasElement>(null);
  const [staticParams, setStaticParams] = useState<null | StaticDrawingParams>(
    null
  );
  const handleAngleChange = useCallback<FormEventHandler>((ev) => {
    setAngle(+(ev.target as HTMLInputElement).value);
  }, []);
  const handleXCountChange = useCallback<FormEventHandler>((ev) => {
    setXCount(+(ev.target as HTMLInputElement).value);
  }, []);
  const handleYCountChange = useCallback<FormEventHandler>((ev) => {
    setYCount(+(ev.target as HTMLInputElement).value);
  }, []);

  useEffect(() => {
    const ctx = (cvsRef.current as HTMLCanvasElement).getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    ctx.font = '48px serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'indianred';
    const text = '点击编辑文字';
    const drawPoint: Point2D = { x: 300, y: 450 };
    const hiddenCtx = document
      .createElement('canvas')
      .getContext('2d') as CanvasRenderingContext2D;
    const textRect = computeTextRect(ctx, text, drawPoint.x, drawPoint.y);
    const textPicture = genTextPicture(hiddenCtx, ctx, text, textRect);
    setStaticParams([ctx as CanvasRenderingContext2D, textRect, textPicture]);
  }, []);
  useEffect(() => {
    if (staticParams) {
      const [ctx, textRect, textPicture] = staticParams;
      requestAnimationFrame(async () => {
        drawCurveText(ctx, angle, xCount, yCount, await textPicture, textRect);
      });
    }
  }, [staticParams, angle, xCount, yCount]);
  return (
    <>
      <p>canvas版文字变形</p>
      <canvas width={1000} height={600} ref={cvsRef}></canvas>
      <br />
      <label htmlFor="xCount">xCount: </label>
      <input
        id="xCount"
        type="number"
        value={xCount}
        onInput={handleXCountChange}
      />
      <label htmlFor="yCount">yCount: </label>
      <input
        id="yCount"
        type="number"
        value={yCount}
        onInput={handleYCountChange}
      />
      <br />
      <label htmlFor="angle">angle: {angle}°</label>
      <br />
      <input
        id="angle"
        type="range"
        value={angle}
        step={1}
        min={-100}
        max={100}
        onInput={handleAngleChange}
      />
      <br />
    </>
  );
});
