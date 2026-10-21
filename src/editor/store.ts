import { create } from 'zustand'
import { indexSceneTree, type IndexedNode, type MaterialValues, type SceneNode } from './sceneTree'

/**
 * A user's overrides for one mesh's material. Only the fields the user has
 * touched are present; everything else falls through to the base value from
 * the loaded asset (see resolveMaterial).
 */
export type MaterialEdit = Partial<MaterialValues>

/**
 * Editor state lives here, as plain data, separate from three.js objects.
 *
 * Components subscribe to exactly the slice they need with a selector, e.g.
 * `useEditorStore((s) => s.selectedId === node.id)`. Zustand re-renders a
 * component only when its selector's result changes (compared with
 * Object.is), so selecting a node re-renders the two outliner rows whose
 * boolean flipped, not the whole tree.
 *
 * The 3D scene is *derived* from this state: the scene layer reads
 * `materialEdits` and makes the three.js materials match it. Nothing here
 * ever holds a three.js object.
 */
type EditorState = {
  /** Snapshot of the editable part of the scene, built once the model loads. */
  sceneTree: SceneNode | null
  /** Flat lookup derived from sceneTree (kept in sync by setSceneTree). */
  nodes: Record<string, IndexedNode>
  /** The one selected node, by id. Groups are selectable from the outliner;
   *  canvas taps always hit meshes. */
  selectedId: string | null
  /** Material overrides, keyed by mesh id. Absent key = untouched mesh. */
  materialEdits: Record<string, MaterialEdit>

  setSceneTree: (tree: SceneNode | null) => void
  select: (id: string | null) => void
  /** Merges `patch` into the mesh's overrides. */
  editMaterial: (meshId: string, patch: MaterialEdit) => void
  /** Drops all overrides for a mesh, restoring the asset's material. */
  resetMaterial: (meshId: string) => void
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  sceneTree: null,
  nodes: {},
  selectedId: null,
  materialEdits: {},

  setSceneTree: (sceneTree) =>
    set({
      sceneTree,
      nodes: sceneTree ? indexSceneTree(sceneTree) : {},
      selectedId: null,
      // Edits are keyed by object ids from the old scene; they don't carry over.
      materialEdits: {},
    }),

  select: (id) => {
    // Ignore ids that aren't in the current scene (e.g. a stale reference).
    if (id !== null && !(id in get().nodes)) return
    set({ selectedId: id })
  },

  editMaterial: (meshId, patch) => {
    if (!get().nodes[meshId]?.node.material) return // not an editable mesh
    // Immutable update: new top-level object and new per-mesh object, so
    // selectors like (s) => s.materialEdits[id] see a changed reference.
    set((s) => ({ materialEdits: { ...s.materialEdits, [meshId]: { ...s.materialEdits[meshId], ...patch } } }))
  },

  resetMaterial: (meshId) =>
    set((s) => {
      if (!(meshId in s.materialEdits)) return s
      const { [meshId]: _removed, ...rest } = s.materialEdits
      return { materialEdits: rest }
    }),
}))

/** Effective values = base values from the asset, overridden by edits. */
export function resolveMaterial(base: MaterialValues, edit: MaterialEdit | undefined): MaterialValues {
  return { ...base, ...edit }
}
