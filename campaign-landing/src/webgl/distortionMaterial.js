import * as THREE from 'three';

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uDistortionStrength;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Very subtle wave when off-center
    float wave = sin(uv.y * 3.14159) * uDistortionStrength * (1.0 - uProgress);
    pos.z += wave * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    // Subtle barrel distortion
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float distortionAmount = 0.02 * (1.0 - uProgress);
    vec2 distortedUV = vUv + center * dist * distortionAmount;

    // Minimal chromatic aberration
    float aberration = (1.0 - uProgress) * 0.0008;
    float r = texture2D(uTexture, distortedUV + vec2(aberration, 0.0)).r;
    float g = texture2D(uTexture, distortedUV).g;
    float b = texture2D(uTexture, distortedUV - vec2(aberration, 0.0)).b;
    vec4 color = vec4(r, g, b, 1.0);

    // Gentle desaturation when off-center
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float saturation = 0.6 + 0.4 * uProgress;
    color.rgb = mix(vec3(gray), color.rgb, saturation);

    // Brightness
    color.rgb *= 0.85 + 0.15 * uProgress;

    gl_FragColor = color;
  }
`;

export function createDistortionMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uDistortionStrength: { value: 0.06 },
    },
    vertexShader,
    fragmentShader,
    transparent: false,
  });
}
