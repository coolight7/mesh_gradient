#include <flutter/runtime_effect.glsl>

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

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float fastNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float ratio = uSize.x / uSize.y;
  vec2 tuv = uv - 0.5;

  float n = fastNoise(vec2(uTime * 0.05, (tuv.x * tuv.y) * 0.05));
  float angle = (n - 0.5) * 2.0;
  float s = sin(angle), c = cos(angle);

  vec2 rotatedUV =
      vec2(tuv.x * c - (tuv.y / ratio) * s, tuv.x * s * ratio + tuv.y * c);

  float timeShift = uTime * uSpeed;
  vec2 waves = sin(rotatedUV.yx * uFrequency + timeShift);
  rotatedUV += waves / uAmplitude;

  float sx = smoothstep(-0.8, 0.8, rotatedUV.x);
  vec3 col12 = mix(uColor1, uColor2, sx);
  vec3 col34 = mix(uColor3, uColor4, sx);

  float yBlend = smoothstep(0.5, -0.4, rotatedUV.y);
  vec3 col = mix(col12, col34, yBlend);

  // 增加随机偏移，打破色块
  float dither = hash12(uv + uTime) * 0.002;
  col += dither;

  fragColor = vec4(col, 1.0);
}