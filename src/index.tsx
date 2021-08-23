import { render } from 'react-dom';
import App1 from './examples/App1';
import {CurvePicture} from './examples/canvas-curve-picture'

render(
  <>
    <App1 />
    <CurvePicture />
  </>,
  document.getElementById('app')
);
