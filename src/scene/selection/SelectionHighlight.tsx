import { Fragment, useMemo } from 'react'
import { createPortal } from '@react-three/fiber'
import { Mesh } from 'three'
import { useEditorStore } from '@/editor/store'
import { getObject, isRegistered } from '../objectRegistry'
import { createRimGlowMaterial } from './rimGlowMaterial'

/**
 * One material shared by every highlight overlay. It's a module-level
 * singleton that lives as long as the app, so it's never disposed.
 */
const highlightMaterial = createRimGlowMaterial()

/**
 * Rim-glows the selected node: the mesh itself, or every mesh under a
 * selected group. (The glow itself is explained in rimGlowMaterial.ts.)
 *
 * Note what this does NOT do: change the selected mesh's own material.
 * Materials are shared, so glowing Plinth_Base would also glow Plinth_Top,
 * and it would mix "selection" into the very material values the Inspector
 * edits. The highlight is a separate overlay object instead.
 *
 * The overlay is a second Mesh that reuses the selected mesh's geometry (no
 * copy: geometry, like material, can be shared). We render it *as a child of*
 * the selected mesh using R3F's createPortal, which targets an existing
 * Object3D the way ReactDOM.createPortal targets a DOM node. As a child at
 * position 0 it inherits the parent's world transform, so it lines up exactly.
 */
export function SelectionHighlight() {
  // Re-renders only when the selection changes.
  const selectedId = useEditorStore((s) => s.selectedId)

  const meshes = useMemo(() => {
    const root = selectedId ? getObject(selectedId) : undefined
    if (!root) return []
    const found: Mesh[] = []
    root.traverse((object) => {
      if (object instanceof Mesh && isRegistered(object.uuid)) found.push(object)
    })
    return found
  }, [selectedId])

  return (
    <>
      {meshes.map((mesh) => (
        <Fragment key={mesh.uuid}>
          {createPortal(
            <mesh
              name="SelectionHighlight"
              geometry={mesh.geometry}
              material={highlightMaterial}
              // Not pickable: taps should go through to the real mesh.
              raycast={() => undefined}
              // R3F disposes objects when they unmount. The geometry belongs to
              // the selected mesh and the material is shared, so opt out.
              dispose={null}
            />,
            mesh,
          )}
        </Fragment>
      ))}
    </>
  )
}
