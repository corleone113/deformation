import { render } from 'react-dom';
import { CurvePicture } from './examples/canvas-curve-picture';
// import { CurveText } from './examples/canvas-curve-text';
import { GLCurvePicture } from './examples/gl-curve-picture';
import { GLCurvePicture as G1 } from './examples/gl-curve-picture1';
import { GLShaderCurvePicture } from './examples/gl-shader-curve-picture';
import { GLCurveText } from './examples/gl-curve-text'
// import './examples/gl-curve-picture-dom'

render(
  <>
    <CurvePicture />
    {/* <CurveText /> */}
    {/* <GLCurveText /> */}
    <GLCurvePicture />
    <G1 />
    {/* <GLShaderCurvePicture /> */}
  </>,
  document.getElementById('app')
);
