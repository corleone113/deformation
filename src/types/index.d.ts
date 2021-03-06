/** 2D顶点，先对于画布的坐标系 */
interface Point2D {
  x: number;
  y: number;
}

/** 绘制的矩形裁剪区域的左上、右下三角形的顶点路径数组 */
interface ShapePaths {
  upPath: Point2D[];
  downPath: Point2D[];
}

interface ArcParams {
  radius: number;
  center: Point2D;
}

/**
 * 计算圆弧上顶点所需参数
 */
interface CurveParams {
  upRadius: number;
  radiusDelta: number;
  center: Point2D;
  fromAngle: number;
  angleStep: number;
  curveDir: number;
}

/** 2D变换矩阵
 * |a c e|
 * |b d f|
 * |0 0 1|
 */
type ModelMatrix2D = [
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
];

/** 文本绘制区域的位置/尺寸 */
interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UpdatePointsOptionalParams {
  yCount?:number,
  flip?: boolean,
  batchNum?: number,
  offset?: number,
}

type FunctionKeys<T> = {
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];
type DebugContextProp = { [x: number]: boolean };
type WebGLContextFuncKey = FunctionKeys<WebGLRenderingContext>;
type GLValidEnumContext = {
  [prop in WebGLContextFuncKey]?: DebugContextProp;
};
type GLPartialContext = {
  -readonly [prop in keyof WebGLRenderingContext]?: WebGLRenderingContext[prop];
};
type WebGLResource = (
  | WebGLBuffer
  | WebGLFramebuffer
  | WebGLProgram
  | WebGLRenderbuffer
  | WebGLShader
  | WebGLTexture
) & { __webglDebugContextLostId__: number };

type CoordDirection = 1 | -1;
type PointCallback = (
  x: number,
  y: number,
  xIndex: number,
  yIndex: number
) => void;

declare module '*.vs' {
  export default source
}

declare module '*.fs' {
  export default source
}

declare module '*.jpg' {
  export default source
}
