import { initDrawingCurveImage } from '@/shapes/curve/gl-render1';
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
  HTMLCanvasElement,
  Point2D,
  Point2D,
  Point2D,
  Point2D,
  HTMLImageElement
];
export const GLCurvePicture: FC = memo(() => {
  const [xCount, setXCount] = useState(22);
  const [yCount, setYCount] = useState(10);
  const [angle, setAngle] = useState(150);
  const cvsRef = useRef<null | HTMLCanvasElement>(null);
  const [staticParams, setStaticParams] = useState<null | StaticDrawingParams>(
    null
  );
  const genDrawing = useMemo(() => {
    if (staticParams) {
      const [cvs, pa, pb, pc, pd, img] = staticParams;
      return initDrawingCurveImage(cvs, pa, pb, pc, pd, img);
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
    const cvs = cvsRef.current as HTMLCanvasElement;
    const img = new Image();
    img.src = '/assets/pic.jpg';
    img.onload = () => {
      const { width, height } = img;
      const imgWidth = 350;
      const imgHeight = (height * imgWidth) / width;
      img.width = imgWidth;
      img.height = imgHeight;
      const pa = { x: 300, y: 160 };
      const pb = { x: pa.x + imgWidth, y: pa.y };
      const pc = { x: pa.x + imgWidth, y: pa.y + imgHeight };
      const pd = { x: pa.x, y: pa.y + imgHeight };
      setStaticParams([cvs, pa, pb, pc, pd, img]);
    };
  }, []);
  useEffect(() => {
    if (drawingFn) {
      drawingFn(angle);
    }
  }, [drawingFn, angle]);
  return (
    <>
      <p>WebGL版图片变形</p>
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
