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

// 2D 旋转矩阵
mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

// 哈希函数
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 基础噪声
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // 使用更硬的插值曲线
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 标准 FBM (用于平滑的位移/扭曲)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// 锯齿状 FBM (核心：产生泼洒油墨和破碎岩层感)
float jaggedFBM(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 m = rotate2d(0.7);

  for (int i = 0; i < 5; i++) {
    vec2 st = p;
    // 关键：极端非均匀缩放，制造“长刺”效果
    st.x *= 0.1;
    st.y *= 2.0;

    float n = noise(st);
    // 核心：脊状处理，将波峰变尖锐
    n = 1.0 - abs(n * 2.0 - 1.0);
    n = n * n; // 增加对比度

    value += amplitude * n;
    p = m * p * 2.1;
    amplitude *= 0.45;
  }
  return value;
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float ratio = uSize.x / uSize.y;
  vec2 st = uv;
  st.x *= ratio;

  // 1. 构图旋转 (45度对角线)
  st = rotate2d(-0.785) * st;

  // 2. 动态位移
  float timeOffset = uTime * uSpeed;
  st.y -= timeOffset * 0.2;

  // 3. 产生大规模位移 (决定油墨泼洒的路径)
  // 这里调用了之前缺失的 fbm
  float displacement = fbm(st * uFrequency * 0.5 + vec2(timeOffset * 0.1));

  // 用 displacement 去推挤 X 轴，制造拉扯感
  st.x += displacement * uAmplitude;

  // 4. 生成细节纹理
  float pattern = jaggedFBM(st * uFrequency);

  // 5. 色彩映射 (泼洒油墨块面感)
  // 使用 noise 决定冷暖大色块的分布
  float colorArea = noise(st * 0.5 + 1.234);
  float warmMask = smoothstep(0.4, 0.55, colorArea);

  // 冷色层处理
  float coolEdge = smoothstep(0.2, 0.6, pattern);
  vec3 coolCol = mix(uColor1, uColor2, coolEdge);
  // 增加一个极亮边缘（类似原图的白色/亮青色划痕）
  coolCol = mix(coolCol, vec3(0.9, 0.95, 1.0),
                pow(smoothstep(0.7, 0.8, pattern), 3.0));

  // 暖色层处理
  float warmEdge = smoothstep(0.3, 0.7, pattern);
  vec3 warmCol = mix(uColor3, uColor4, warmEdge);
  // 增加金色/白色高光块面
  warmCol = mix(warmCol, vec3(1.0, 1.0, 0.9),
                pow(smoothstep(0.8, 0.9, pattern), 4.0));

  // 6. 最终合成
  vec3 col = mix(coolCol, warmCol, warmMask);

  // 7. 增强质感：模拟油墨堆叠的阴影
  col *= 0.8 + 0.4 * pattern;

  fragColor = vec4(col, 1.0);
}