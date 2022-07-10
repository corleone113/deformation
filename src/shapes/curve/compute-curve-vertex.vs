uniform float u_UpRadius;
uniform float u_RadiusDelta;
uniform vec2 u_Center;
uniform float u_FromAngle;
uniform float u_AngleStep;
uniform float u_CurveDir;
uniform float u_WidthHeightRatio;
uniform bool u_UsePos;
attribute vec4 a_Position;
attribute vec2 a_PosIndices;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main() {
  if (u_UsePos) {
    vec4 pos = a_Position;
    pos.y *= u_WidthHeightRatio;
    gl_Position = pos;
  } else {
    float radius = u_UpRadius - a_PosIndices.y * u_RadiusDelta;
    float angle = u_FromAngle + a_PosIndices.x * u_AngleStep;
    float x = u_Center.x + radius * sin(angle);
    float y = (u_Center.y + radius * cos(angle) * u_CurveDir) * u_WidthHeightRatio;
    gl_Position = vec4(x, y, 0, 1);
  }
  v_TexCoord = a_TexCoord;
}