import { Color, NormalBlending, ShaderMaterial } from 'three'

/**
 * A "fresnel" rim glow: strong where a surface turns away from the camera
 * (the silhouette), nearly invisible where it faces the camera head-on.
 * Selected meshes keep their true colors in the middle, which matters while
 * you're picking colors in the Inspector, and get a glowing edge.
 *
 * A ShaderMaterial is a material whose GPU programs we write ourselves, in
 * GLSL. three.js still prepends its standard uniforms and attributes
 * (projectionMatrix, modelViewMatrix, normalMatrix, position, normal), so
 * we can use them without declaring them.
 *
 * Two programs run on the GPU:
 * - the *vertex shader* runs once per vertex and decides where it lands on
 *   screen (gl_Position). It can also pass values on to the fragment shader
 *   through `varying`s, which get interpolated across each triangle.
 * - the *fragment shader* runs once per pixel the triangle covers and
 *   decides its color (gl_FragColor).
 */
const vertexShader = /* glsl */ `
  varying vec3 vNormal;   // surface normal, in view (camera) space
  varying vec3 vToCamera; // direction from the surface to the camera, view space

  void main() {
    // modelViewMatrix: object space -> view space (the camera sits at the
    // origin looking down -z). normalMatrix is its rotation-only counterpart
    // for direction vectors like normals.
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vToCamera = normalize(-viewPosition.xyz);
    // projectionMatrix: view space -> clip space (applies the perspective).
    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;     // higher = thinner rim
  uniform float uBaseAlpha; // faint fill so even a head-on flat face shows

  varying vec3 vNormal;
  varying vec3 vToCamera;

  void main() {
    // dot() of two unit vectors = cosine of the angle between them:
    // 1 when the surface faces the camera, 0 when it's edge-on.
    // abs() handles back faces seen through openings (like inside the shoe).
    float facing = abs(dot(normalize(vNormal), normalize(vToCamera)));
    float rim = pow(1.0 - facing, uPower);
    gl_FragColor = vec4(uColor, clamp(uBaseAlpha + rim, 0.0, 1.0));

    // three.js works in linear color internally; this include converts our
    // output to the canvas's sRGB color space, as built-in materials do.
    #include <colorspace_fragment>
  }
`

export function createRimGlowMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    name: 'SelectionRimGlow',
    vertexShader,
    fragmentShader,
    // Uniforms are the JS → GPU inputs. Changing `.value` later is cheap.
    uniforms: {
      uColor: { value: new Color('#ff9f1c') }, // Color() converts sRGB hex to linear
      uPower: { value: 2.5 },
      uBaseAlpha: { value: 0.04 },
    },
    transparent: true,
    blending: NormalBlending,
    // Don't write depth: the overlay must not hide anything drawn after it.
    depthWrite: false,
    // The overlay sits exactly on the original surface, so both have the
    // same depth and the GPU can't decide which is in front, causing
    // flickering stripes ("z-fighting"). A negative offset nudges the
    // overlay's depth slightly toward the camera so it reliably wins.
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
}
