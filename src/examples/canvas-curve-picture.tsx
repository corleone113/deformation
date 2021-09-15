import { drawCurveImage, drawCurveImage_Deprecated } from '@/shapes/curve/canvas-render';
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
  Point2D,
  Point2D,
  Point2D,
  Point2D,
  HTMLImageElement
];
export const CurvePicture: FC = memo(() => {
  const [hasDot, setHasDot] = useState(false);
  const [hasLine, setHasLine] = useState(false);
  const [hasPic, setHasPic] = useState(true);
  const [xCount, setXCount] = useState(50);
  const [yCount, setYCount] = useState(50);
  const [angle, setAngle] = useState(150);
  const cvsRef = useRef<null | HTMLCanvasElement>(null);
  const [staticParams, setStaticParams] = useState<null | StaticDrawingParams>(
    null
  );
  const handleHasDotChange = useCallback(() => {
    setHasDot((hasDot) => !hasDot);
  }, []);
  const handleHasLineChange = useCallback(() => {
    setHasLine((hasLine) => !hasLine);
  }, []);
  const handleHasPicChange = useCallback(() => {
    setHasPic((hasPic) => !hasPic);
  }, []);
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
    const img = new Image();
    img.src = '/assets/pic.jpg';
    img.onload = () => {
      const { width, height } = img;
      const imgWidth = 350;
      const imgHeight = (height * imgWidth) / width;
      img.width = imgWidth;
      img.height = imgHeight;
      const pa = { x: 300, y: 200 };
      const pb = { x: pa.x + imgWidth, y: pa.y };
      const pc = { x: pa.x + imgWidth, y: pa.y + imgHeight };
      const pd = { x: pa.x, y: pa.y + imgHeight };
      setStaticParams([ctx, pa, pb, pc, pd, img]);
    };
  }, []);
  useEffect(() => {
    if (staticParams) {
      const [ctx, pa, pb, pc, pd, img] = staticParams;
      requestAnimationFrame(() => {
        drawCurveImage(
          ctx,
          pa,
          pb,
          pc,
          pd,
          angle,
          xCount,
          img,
          hasDot,
          hasLine,
          hasPic,
          yCount
        );
      });
    }
  }, [staticParams, hasDot, hasLine, hasPic, angle, xCount, yCount]);
  return (
    <>
      <p>canvas版图像变形</p>
      <canvas width={1000} height={600} ref={cvsRef}></canvas>
      <br />
      <label htmlFor="hasDot">hasDot: </label>
      <input
        id="hasDot"
        type="checkbox"
        checked={hasDot}
        onChange={handleHasDotChange}
      />
      <br />
      <label htmlFor="hasLine">hasLine: </label>
      <input
        id="hasLine"
        type="checkbox"
        checked={hasLine}
        onChange={handleHasLineChange}
      />
      <br />
      <label htmlFor="hasPic">hasPic: </label>
      <input
        id="hasPic"
        type="checkbox"
        checked={hasPic}
        onChange={handleHasPicChange}
      />
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
        min={-150}
        max={150}
        onInput={handleAngleChange}
      />
      <br />
    </>
  );
});
