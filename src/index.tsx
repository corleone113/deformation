import { render } from 'react-dom';
import { CurvePicture } from './examples/canvas-curve-picture';
// import { CurveText } from './examples/canvas-curve-text';
import { GLCurvePicture } from './examples/gl-curve-picture';
import './examples/demo'

render(
  <>
    <CurvePicture />
    {/* <CurveText /> */}
    <GLCurvePicture />
  </>,
  document.getElementById('app')
);
