import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'
import { buildSceneTree } from '@/editor/sceneTree'
import { useEditorStore } from '@/editor/store'
import { DisplayStand, STAND_HEIGHT } from './DisplayStand'
import { registerSubtree } from './objectRegistry'
import { TapToSelect } from './selection/TapToSelect'
import { ShoeModel } from './ShoeModel'

/**
 * The editable content of the scene: everything under this group appears in
 * the Outliner. Lights, shadows and helpers live outside it on purpose, the
 * same way a DCC tool separates "your model" from "the viewport".
 *
 * This component must render inside a <Suspense> that also wraps ShoeModel:
 * then it mounts only once the glTF is loaded, so the snapshot below sees the
 * complete hierarchy.
 */
export function Product() {
  const groupRef = useRef<Group>(null)
  const setSceneTree = useEditorStore((s) => s.setSceneTree)

  // Layout effects run after R3F has attached every child Object3D to its
  // parent, so the whole subtree is in place here. We:
  //  1. register the live objects by id, for scene-side code (picking, highlight)
  //  2. snapshot them into plain data for the DOM side (Outliner, Inspector),
  //     which can't reach inside <Canvas>.
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    const unregister = registerSubtree(group)
    setSceneTree(buildSceneTree(group))
    return () => {
      setSceneTree(null)
      unregister()
    }
  }, [setSceneTree])

  return (
    <group ref={groupRef} name="Product">
      <DisplayStand />
      <group name="ShoeMount" position-y={STAND_HEIGHT}>
        <ShoeModel />
      </group>
      <TapToSelect targetRef={groupRef} />
    </group>
  )
}
