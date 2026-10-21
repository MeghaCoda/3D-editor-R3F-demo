import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Mesh } from 'three'
import { useEditorStore, type MaterialEdit } from '@/editor/store'
import { getObject } from '../objectRegistry'
import { MaterialOverrides } from './MaterialOverrides'

/**
 * Bridges editor state → three.js materials. Renders nothing.
 *
 * PERFORMANCE: dragging a roughness slider produces ~60 store updates per
 * second. If scene components *rendered* from `materialEdits` (via a
 * selector), each tick would re-render React components inside <Canvas>
 * and run R3F's reconciler. Instead we use Zustand's *transient* subscribe:
 * the callback runs on every store change, we mutate the material directly,
 * and React never re-renders anything in the scene. The next animation frame
 * simply draws the updated material.
 *
 * This is the standard R3F pattern for fast-changing values: React for
 * structure (what objects exist), direct mutation for values that change
 * every frame.
 */
export function MaterialEditsSync() {
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const overrides = new MaterialOverrides()

    const sync = (next: Record<string, MaterialEdit>, prev: Record<string, MaterialEdit>) => {
      // Only meshes whose edit object changed. The store updates immutably,
      // so a reference comparison is enough to detect a change.
      const ids = new Set([...Object.keys(next), ...Object.keys(prev)])
      for (const id of ids) {
        if (next[id] === prev[id]) continue
        const object = getObject(id)
        if (object instanceof Mesh) overrides.apply(object, next[id])
      }
      // With the default frameloop="always" R3F redraws every frame anyway.
      // invalidate() makes this also work with frameloop="demand" (render
      // only when something changed), a common battery saver on tablets.
      invalidate()
    }

    sync(useEditorStore.getState().materialEdits, {})
    return useEditorStore.subscribe((state, prev) => {
      if (state.materialEdits !== prev.materialEdits) sync(state.materialEdits, prev.materialEdits)
    })
  }, [invalidate])

  return null
}
