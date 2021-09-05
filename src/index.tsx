import { render } from 'react-dom';
// import { CurvePicture } from './examples/canvas-curve-picture';
// import { CurveText } from './examples/canvas-curve-text';
import { GLCurvePicture } from './examples/gl-curve-picture';
import { GLShaderCurvePicture } from './examples/gl-shader-curve-picture';
// import { GLCurveText } from './examples/gl-curve-text'
// import './examples/gl-curve-picture-dom'
// import './deformation/demo-gl';
// import './tmp/tmp'
// import './tmp/tmp1'

render(
  <>
    {/* <CurvePicture /> */}
    {/* <CurveText /> */}
    <GLCurvePicture />
    <GLShaderCurvePicture />
    {/* <GLCurveText /> */}
  </>,
  document.getElementById('app')
);
