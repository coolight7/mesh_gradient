#include <flutter/runtime_effect.glsl>

#define S(a, b, t) smoothstep(a, b, t)

uniform vec2 uSize;
uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uSpeed;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;

out vec4 fragColor;

const float angle = radians(-5.0);
const float sin5 = sin(angle);
const float cos5 = cos(angle);
const mat2 rotMinus5 = mat2(cos5, -sin5, sin5, cos5);

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  vec2 h00 = hash(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
  vec2 h10 = hash(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 h01 = hash(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 h11 = hash(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

  return 0.5 + 0.5 * (mix(mix(dot(h00, f - vec2(0.0)),
                              dot(h10, f - vec2(1.0, 0.0)), u.x),
                          mix(dot(h01, f - vec2(0.0, 1.0)),
                              dot(h11, f - vec2(1.0, 1.0)), u.x),
                          u.y));
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float ratio = uSize.x / uSize.y;

  vec2 tuv = uv - 0.5;
  float angle =
      radians((noise(vec2(uTime * 0.1, tuv.x * tuv.y * 0.1)) - 0.7) * 360.0);
  float s = sin(angle), c = cos(angle);
  tuv *= mat2(c, -s / ratio, s * ratio, c);

  vec2 waves = sin(tuv.yx * vec2(uFrequency, uFrequency * 2) + uTime * uSpeed);
  tuv += waves / vec2(uAmplitude, uAmplitude * 2);
  float sx = S(-0.8, 0.8, tuv.x);

  vec3 col12 = mix(uColor1, uColor2, sx);
  vec3 col34 = mix(uColor3, uColor4, sx);

  float yBlend = S(0.5, -0.4, tuv.y);
  float smoothYBlend = yBlend * yBlend * (3.0 - 2.0 * yBlend); // 平滑过渡
  vec3 col = mix(col12, col34, smoothYBlend) + 0.01;           // 提亮

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}