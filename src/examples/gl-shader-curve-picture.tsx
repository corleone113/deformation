import { initDrawingCurveImage } from '@/shapes/curve/gl-shader-render';
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
import picURL from '@assets/pic.jpg'

type StaticDrawingParams = [
  HTMLCanvasElement,
  Point2D,
  Point2D,
  Point2D,
  Point2D,
  HTMLImageElement
];

const { max, min } = Math;
const MIN_COUNT=1, MAX_COUNT=5000;
function genValidCount(x: number) {
  return max(MIN_COUNT, min(x, MAX_COUNT))
}
export const GLShaderCurvePicture: FC = memo(() => {
  const [xCount, setXCount] = useState(500);
  const [yCount, setYCount] = useState(500);
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
    setXCount(genValidCount(+(ev.target as HTMLInputElement).value));
  }, []);
  const handleYCountChange = useCallback<FormEventHandler>((ev) => {
    setYCount(genValidCount(+(ev.target as HTMLInputElement).value));
  }, []);

  useEffect(() => {
    const cvs = cvsRef.current as HTMLCanvasElement;
    const img = new Image();
    img.src = picURL;
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
      <p>WebGL版图像弯曲变形(改进版)(分段限制:1-5000)</p>
      <canvas width={1000} height={600} ref={cvsRef}></canvas>
      <br />
      <label htmlFor="xCount"> xCount: </label>
      <input
        id="xCount"
        type="number"
        value={xCount}
        min={MIN_COUNT}
        max={MAX_COUNT}
        onInput={handleXCountChange}
      />
      <label htmlFor="yCount"> yCount: </label>
      <input
        id="yCount"
        type="number"
        value={yCount}
        min={MIN_COUNT}
        max={MAX_COUNT}
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
