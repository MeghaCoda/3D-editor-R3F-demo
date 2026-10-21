import { useGLTF } from '@react-three/drei'
import { SHOE_URL } from './modelUrl'

/**
 * Loads the glTF and mounts its scene graph.
 *
 * 3D concept: a glTF file contains a *scene graph*, a tree of Object3D nodes.
 * Each node has a transform (position/rotation/scale) relative to its parent.
 * `Mesh` nodes are the visible ones: Mesh = Geometry (vertices) + Material
 * (how the surface reacts to light).
 *
 * `useGLTF` suspends while loading (so a <Suspense> boundary above us shows
 * the fallback) and caches the result by URL. It returns real three.js objects,
 * not React elements. `<primitive object={...}>` is R3F's escape hatch for
 * "mount this existing three.js object as-is" instead of describing it in JSX.
 */
export function ShoeModel() {
  const { scene } = useGLTF(SHOE_URL)
  return <primitive object={scene} />
}

// Start the download as soon as this module is imported, before first render.
useGLTF.preload(SHOE_URL)
