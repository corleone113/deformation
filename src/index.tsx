import { render } from 'react-dom';
// import { CurvePicture } from './examples/canvas-curve-picture';
// import { CurveText } from './examples/canvas-curve-text';
import { GLCurvePicture } from './examples/gl-curve-picture';
// import { GLCurveText } from './examples/gl-curve-text'
// import './examples/gl-curve-picture-dom'
// import './deformation/demo-gl';

render(
  <>
    {/* <CurvePicture /> */}
    {/* <CurveText /> */}
    <GLCurvePicture />
    {/* <GLCurveText /> */}
  </>,
  document.getElementById('app')
);
