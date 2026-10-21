import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, Loader, OrbitControls } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import { MaterialEditsSync } from './materials/MaterialEditsSync'
import { Product } from './Product'
import { SelectionHighlight } from './selection/SelectionHighlight'

/**
 * The 3D viewport.
 *
 * <Canvas> creates the WebGL renderer, a Scene, and a Camera, and starts a
 * render loop (requestAnimationFrame). Everything inside it is rendered by
 * R3F's reconciler into three.js objects rather than DOM nodes: `<mesh>`
 * becomes `new THREE.Mesh()`, `<ambientLight>` becomes `new THREE.AmbientLight()`.
 *
 * Units: three.js is unitless, but glTF uses meters. The shoe is ~0.3 m long
 * and stands on a 3 cm plinth, so the camera is ~0.5 m away and aims ~9 cm up.
 */
export function Viewport() {
  return (
    <>
    <Canvas
      // Camera: fov is the vertical field of view in degrees. near/far clip
      // planes bound what's drawn; keep near small because the model is small.
      camera={{ position: [0.38, 0.24, 0.48], fov: 40, near: 0.01, far: 20 }}
      // devicePixelRatio clamp: retina iPads are 2x, rendering at 3x costs a
      // lot of fill-rate for little visible gain.
      dpr={[1, 2]}
      // Tell the browser not to pan/zoom the page when touching the canvas;
      // OrbitControls handles one-finger rotate and two-finger pinch/pan.
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#1b1c20']} />

      {/* useGLTF suspends while downloading. The fallback must be a 3D-scene
          child (or null); the visible progress bar is <Loader> below, in plain DOM. */}
      <Suspense fallback={null}>
        <Product />
        <SelectionHighlight />
        <MaterialEditsSync />
      </Suspense>

      <StudioLighting />

      {/* Fake soft shadow on the ground: renders the model from below into a
          blurred texture. Much cheaper than real shadow maps for a single object. */}
      <ContactShadows position={[0, 0, 0]} scale={0.8} blur={2.5} opacity={0.6} far={0.3} />

      {/* makeDefault registers these controls in R3F state so other drei
          helpers (and later, our selection code) can find them. */}
      <OrbitControls makeDefault target={[0, 0.09, 0]} minDistance={0.15} maxDistance={2} />

      {/* FPS, frame time, draw calls, triangle count. Draw calls are the number
          to watch in 3D: each mesh+material pair is typically one draw call. */}
      <Perf position="bottom-right" minimal />
    </Canvas>
    {/* DOM overlay outside the canvas; reads drei's global loading progress. */}
    <Loader />
    </>
  )
}

/**
 * Image-based lighting (IBL).
 *
 * glTF materials are PBR (physically based): their look depends heavily on
 * what they *reflect*, not just direct lights. <Environment> renders an
 * environment map that every MeshStandardMaterial in the scene samples for
 * reflections and ambient light (it sets `scene.environment`).
 *
 * `<Environment preset="city" />` is the one-liner, but presets download an
 * HDR file from a CDN. Here we build a tiny "photo studio" locally from
 * Lightformers (glowing rectangles) instead: no network, and it shows how an
 * environment map is just "a picture of the surroundings".
 */
function StudioLighting() {
  return (
    <>
      <Environment resolution={256}>
        {/* Big soft key light overhead */}
        <Lightformer form="rect" intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        {/* Side strips give the long highlights you see on product shots */}
        <Lightformer form="rect" intensity={2} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        {/* Dim fill from the front so the toe isn't black */}
        <Lightformer form="rect" intensity={0.8} position={[0, 1, 5]} scale={[10, 3, 1]} />
      </Environment>
      {/* One direct light for a crisper main highlight on top of the IBL. */}
      <directionalLight position={[1, 2, 1]} intensity={1} />
    </>
  )
}
