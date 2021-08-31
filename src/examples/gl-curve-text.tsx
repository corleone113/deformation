import { initDrawingCurveText } from '@/shapes/curve/gl-render';
import { computeTextRect, genTextPicture } from '@/utils/canvas-text';
import {
  FC,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
  FormEventHandler,
} from 'react';

type StaticDrawingParams = [
  cvs: HTMLCanvasElement,
  textPicture: ImageBitmap,
  textRect: TextRect,
];
export const GLCurveText: FC = memo(() => {
  const [xCount, setXCount] = useState(200);
  const [yCount, setYCount] = useState(200);
  const [angle, setAngle] = useState(150);
  const cvsRef = useRef<null | HTMLCanvasElement>(null);
  const [staticParams, setStaticParams] = useState<null | StaticDrawingParams>(
    null
  );
  const genDrawing = useMemo(() => {
    if (staticParams) {
      const [cvs, textPicture, textRect] = staticParams;
      return initDrawingCurveText(cvs, textPicture, textRect)
    }
    return null;
  }, [staticParams]);
  const drawingFn = useMemo(() => {
    if (genDrawing) {
      return genDrawing(xCount, yCount);
    }
    return null;
  }, [genDrawing, xCount, yCount]);
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
      const cvs = cvsRef.current as HTMLCanvasElement
    const ctx = (cvs.cloneNode() as HTMLCanvasElement).getContext(
        '2d'
      ) as CanvasRenderingContext2D;
      ctx.font = '48px serif';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'indianred';
      const text = '点击编辑文字';
      const drawPoint: Point2D = { x: 300, y: 260 };
      const hiddenCtx = document
        .createElement('canvas')
        .getContext('2d') as CanvasRenderingContext2D;
      const textRect = computeTextRect(ctx, text, drawPoint.x, drawPoint.y);
      const asyncEffect = async () => {
        const textPicture = await genTextPicture(hiddenCtx, ctx, text, textRect);
        setStaticParams([cvs, textPicture, textRect]);
      }
      asyncEffect()
  }, []);
  useEffect(() => {
    if (drawingFn) {
      drawingFn(angle);
    }
  }, [drawingFn, angle]);
  return (
    <>
      <p>WebGL版文字变形</p>
      <canvas width={1000} height={600} ref={cvsRef}></canvas>
      <br />
      <label htmlFor="xCount"> xCount: </label>
      <input
        id="xCount"
        type="number"
        value={xCount}
        onInput={handleXCountChange}
      />
      <label htmlFor="yCount"> yCount: </label>
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
        min={-150}
        max={150}
        onInput={handleAngleChange}
      />
      <br />
    </>
  );
});
