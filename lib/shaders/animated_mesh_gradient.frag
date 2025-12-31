#include <flutter/runtime_effect.glsl>

#define S(a, b, t) smoothstep(a, b, t)

uniform vec2 uSize;
uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uGrain;
uniform vec3 uColor1; // HSL color: h, s, l
uniform vec3 uColor2; // HSL color: h, s, l
uniform vec3 uColor3; // HSL color: h, s, l
uniform vec3 uColor4; // HSL color: h, s, l

out vec4 fragColor;

const float angle = radians(-5.0);
const float sin5 = sin(angle);
const float cos5 = cos(angle);
const mat2 rotMinus5 = mat2(cos5, -sin5, sin5, cos5);

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x / 60.0;
  float s = hsl.y;
  float l = hsl.z;

  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
  float m = l - c * 0.5;

  vec3 rgb;
  if (h < 1.0) {
    rgb = vec3(c, x, 0.0);
  } else if (h < 2.0) {
    rgb = vec3(x, c, 0.0);
  } else if (h < 3.0) {
    rgb = vec3(0.0, c, x);
  } else if (h < 4.0) {
    rgb = vec3(0.0, x, c);
  } else if (h < 5.0) {
    rgb = vec3(x, 0.0, c);
  } else {
    rgb = vec3(c, 0.0, x);
  }

  return clamp(rgb + m, 0.0, 1.0);
}

vec3 mixHSL(vec3 hsl1, vec3 hsl2, float t) {
  float h1 = hsl1.x;
  float h2 = hsl2.x;

  float dh = h2 - h1;
  if (abs(dh) > 180.0) {
    if (dh > 0.0) {
      h1 += 360.0;
    } else {
      h2 += 360.0;
    }
  }

  float h = mix(h1, h2, t);
  h = mod(h, 360.0);

  float smoothT = t * t * (3.0 - 2.0 * t);

  float s = mix(hsl1.y, hsl2.y, smoothT);
  float l = mix(hsl1.z, hsl2.z, smoothT);

  return vec3(h, s, l);
}

vec3 mixRGBThroughHSL(vec3 hsl1, vec3 hsl2, float t) {
  if (t <= 0.0)
    return hsl2rgb(hsl1);
  if (t >= 1.0)
    return hsl2rgb(hsl2);

  vec3 rgb1 = hsl2rgb(hsl1);
  vec3 rgb2 = hsl2rgb(hsl2);

  float lDiff = abs(hsl1.z - hsl2.z);
  if (lDiff > 0.3) {
    float rgbBlend = smoothstep(0.3, 0.5, lDiff);
    return mix(hsl2rgb(mixHSL(hsl1, hsl2, t)), mix(rgb1, rgb2, t), rgbBlend);
  }

  return hsl2rgb(mixHSL(hsl1, hsl2, t));
}

vec2 hash(vec2 p) {
  float x = sin(p.x * 127.1 + p.y * 311.7) * 43758.5453;
  float y = sin(p.x * 269.5 + p.y * 183.3) * 43758.5453;
  return fract(vec2(x, y));
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  vec2 h00 = hash(i) * 2.0 - 1.0;
  vec2 h10 = hash(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 h01 = hash(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 h11 = hash(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

  return 0.5 + 0.5 * (mix(mix(dot(h00, f - vec2(0.0)),
                              dot(h10, f - vec2(1.0, 0.0)), u.x),
                          mix(dot(h01, f - vec2(0.0, 1.0)),
                              dot(h11, f - vec2(1.0, 1.0)), u.x),
                          u.y));
}

float grain(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float ratio = uSize.x / uSize.y;
  float uTime_01 = uTime * 0.1;
  float uTime_speed = uTime * uSpeed;
  vec2 freq_vec = vec2(uFrequency, uFrequency * 2.0);

  vec2 tuv = uv - 0.5;
  float angle =
      radians((noise(vec2(uTime_01, tuv.x * tuv.y * 0.1)) - 0.7) * 360.0);
  float s = sin(angle), c = cos(angle);
  tuv *= mat2(c, -s / ratio, s * ratio, c);

  vec2 waves = sin(tuv.yx * freq_vec + uTime_speed);
  tuv += waves / vec2(uAmplitude, uAmplitude * 2.0);

  vec2 rtuv = tuv * rotMinus5;

  float sx = S(-1, 1, rtuv.x);

  vec3 col12 = mixRGBThroughHSL(uColor1, uColor2, sx);
  vec3 col34 = mixRGBThroughHSL(uColor3, uColor4, sx);

  float yBlend = S(0.6, -0.5, tuv.y);
  float smoothYBlend = yBlend * yBlend * (3.0 - 2.0 * yBlend);

  vec3 col = mix(col12, col34, smoothYBlend);

  float g = grain(uv * uSize + uTime) * uGrain;
  col += (g - 0.5) * 0.02;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}