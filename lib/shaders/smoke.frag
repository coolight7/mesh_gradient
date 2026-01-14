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

// 哈希函数（增强随机性）
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

// 基础噪声（保留原逻辑但优化精度）
float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // 更平滑的噪声插值

  vec2 h00 = hash(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
  vec2 h10 = hash(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 h01 = hash(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 h11 = hash(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

  return mix(
      mix(dot(h00, f - vec2(0.0)), dot(h10, f - vec2(1.0, 0.0)), u.x),
      mix(dot(h01, f - vec2(0.0, 1.0)), dot(h11, f - vec2(1.0, 1.0)), u.x),
      u.y);
}

// 多层噪声（FBM）- 核心：模拟爆炸的碎片/流体纹理
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  // 4层噪声叠加，增强碎片感
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  // 1. 基础坐标归一化 + 适配屏幕比例
  vec2 uv = FlutterFragCoord().xy / uSize;
  float ratio = uSize.x / uSize.y;
  vec2 tuv = (uv - 0.5) * vec2(ratio, 1.0); // 中心对齐

  // 2. 径向坐标转换（核心：爆炸从中心扩散）
  float radius = length(tuv);                    // 径向距离
  vec2 polar = vec2(radius, atan(tuv.y, tuv.x)); // 极坐标

  // 3. 动态扰动（模拟爆炸的流体扭曲）
  float timeScale = uTime * uSpeed * 0.5;
  // 多层噪声扰动极坐标，产生碎片感
  polar.x += fbm(tuv * uFrequency * 1.2 + timeScale * 0.8) * uAmplitude * 0.15;
  polar.y += fbm(tuv * uFrequency * 0.8 - timeScale * 0.6) * uAmplitude * 0.1;

  // 4. 逆转换回笛卡尔坐标，叠加旋转
  float angle = polar.y + sin(timeScale * 0.3) * 0.2; // 动态旋转
  float s = sin(angle), c = cos(angle);
  vec2 distortedTuv = vec2(polar.x * c, polar.x * s);

  // 5. 色彩混合（非线性分层，模拟爆炸的色彩渐变）
  // 基于径向距离+噪声的混合因子，产生破碎的渐变层
  float noiseBlend = fbm(distortedTuv * uFrequency * 0.5 + timeScale);
  float radialBlend = S(0.1, 0.9, radius + noiseBlend * 0.3);
  radialBlend = pow(radialBlend, 1.2); // 强化分层效果

  // 多层色彩混合，模拟爆炸的色彩扩散
  vec3 col12 = mix(uColor1, uColor2, radialBlend + noiseBlend * 0.2);
  vec3 col34 = mix(uColor3, uColor4, 1.0 - radialBlend + noiseBlend * 0.15);

  // 垂直方向叠加混合，增加层次感
  float yBlend = S(0.6, -0.5, distortedTuv.y + noiseBlend * 0.2);
  yBlend = yBlend * yBlend * (3.0 - 2.0 * yBlend);
  vec3 col = mix(col12, col34, yBlend);

  // 6. 提亮+边缘处理（让爆炸中心更亮，边缘更通透）
  col += 0.02 + (1.0 - radius) * 0.08; // 中心提亮
  col = clamp(col, 0.0, 1.0);

  // 7. 最终输出
  fragColor = vec4(col, 1.0);
}