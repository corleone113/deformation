import { render } from 'react-dom';
import { CurvePicture } from './examples/canvas-curve-picture';
// import { CurveText } from './examples/canvas-curve-text';
import { GLCurvePicture } from './examples/gl-curve-picture';
import { GLCurveText } from './examples/gl-curve-text'
import { GLShaderCurvePicture } from './examples/gl-shader-curve-picture';
import { GLShaderCurveText } from './examples/gl-shader-curve-text'
// import './examples/gl-curve-picture-dom'

render(
  <>
    <CurvePicture />
    {/* <CurveText /> */}
    <GLCurvePicture />
    <GLCurveText />
    <GLShaderCurvePicture />
    <GLShaderCurveText />
  </>,
  document.getElementById('app')
);
