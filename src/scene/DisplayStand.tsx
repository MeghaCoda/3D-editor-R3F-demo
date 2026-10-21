import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

/** Height of the plinth's top surface; the shoe is lifted by this much. */
export const STAND_HEIGHT = 0.03

/**
 * A simple product plinth built from primitive geometries.
 *
 * 3D concept: *materials are shared by reference*. Both plinth meshes below
 * receive the same MeshStandardMaterial instance, so changing
 * `standMaterial.color` would recolor both at once. That's normal (and
 * efficient) in three.js; it's exactly why the Inspector will later clone a
 * material before editing it.
 *
 * Geometry args are in meters: cylinderGeometry args are
 * [radiusTop, radiusBottom, height, radialSegments]. Meshes are positioned by
 * their *center*, so a 2 cm tall cylinder sits on the floor at y = 0.01.
 */
export function DisplayStand() {
  // Created imperatively (not as <meshStandardMaterial> JSX) so one instance
  // can be handed to several meshes.
  const standMaterial = useMemo(
    () => new MeshStandardMaterial({ name: 'StandMaterial', color: '#d9d4cc', roughness: 0.55 }),
    [],
  )
  const brassMaterial = useMemo(
    () => new MeshStandardMaterial({ name: 'BrassMaterial', color: '#c9a45c', roughness: 0.3, metalness: 1 }),
    [],
  )

  // GPU resources (shader programs, buffers, textures) aren't garbage
  // collected. Anything you `new` yourself must be dispose()d. JSX-declared
  // objects are disposed by R3F automatically on unmount.
  useEffect(
    () => () => {
      standMaterial.dispose()
      brassMaterial.dispose()
    },
    [standMaterial, brassMaterial],
  )

  return (
    <group name="DisplayStand">
      <mesh name="Plinth_Base" position-y={0.01} material={standMaterial}>
        <cylinderGeometry args={[0.2, 0.21, 0.02, 64]} />
      </mesh>
      <mesh name="Plinth_Top" position-y={0.025} material={standMaterial}>
        <cylinderGeometry args={[0.185, 0.19, 0.01, 64]} />
      </mesh>
      {/* Small nameplate on the front edge, tilted back like a label. */}
      <mesh name="Nameplate" position={[0, 0.012, 0.207]} rotation-x={-0.35} material={brassMaterial}>
        <boxGeometry args={[0.07, 0.014, 0.003]} />
      </mesh>
    </group>
  )
}
