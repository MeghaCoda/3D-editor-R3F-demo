import type { Object3D } from 'three'

/**
 * id → live Object3D lookup for the scene layer.
 *
 * The editor store holds ids and plain data; this table is how code inside
 * <Canvas> turns an id back into the real three.js object to draw or mutate.
 * It's a plain module-level Map, not React or Zustand state: nothing should
 * re-render because an object was registered, and Object3Ds aren't data.
 */
const objects = new Map<string, Object3D>()

/** Registers `root` and all its descendants. Returns an unregister function. */
export function registerSubtree(root: Object3D): () => void {
  const ids: string[] = []
  root.traverse((object) => {
    objects.set(object.uuid, object)
    ids.push(object.uuid)
  })
  return () => {
    for (const id of ids) objects.delete(id)
  }
}

export function getObject(id: string): Object3D | undefined {
  return objects.get(id)
}

export function isRegistered(id: string): boolean {
  return objects.has(id)
}
