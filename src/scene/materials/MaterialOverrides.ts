import { MeshStandardMaterial, type Mesh } from 'three'
import type { MaterialEdit } from '@/editor/store'

/**
 * Makes each mesh's live material match its MaterialEdit from the store.
 *
 * CLONE ON FIRST EDIT, and why:
 * In three.js a material is an object that meshes *reference*. Plinth_Base
 * and Plinth_Top both point at the same StandMaterial instance, and glTF
 * files share materials across meshes all the time (every lace eyelet using
 * one "Metal" material, say). If we set `mesh.material.color` directly, every
 * mesh sharing that material would change too, which is not what "edit the
 * selected mesh" means.
 *
 * So the first time a mesh is edited we give it its own copy:
 * `material.clone()` copies the parameters, while textures inside it (map,
 * normalMap, ...) stay shared by reference, so the clone is cheap and costs
 * no extra GPU texture memory. We keep the original so that clearing the
 * edit (reset, or undo in step 5) can put it back.
 *
 * Deriving from state: `apply(mesh, edit)` always computes the result from
 * (original material + edit), never from whatever the clone currently looks
 * like. Applying the same edit twice gives the same result, so the scene can
 * always be rebuilt from the store.
 */
export class MaterialOverrides {
  /** The material each mesh had before we touched it, keyed by mesh id. */
  private originals = new Map<string, MeshStandardMaterial>()
  /** Our private copy per edited mesh. */
  private clones = new Map<string, MeshStandardMaterial>()

  apply(mesh: Mesh, edit: MaterialEdit | undefined): void {
    const id = mesh.uuid
    let original = this.originals.get(id)
    if (!original) {
      // Only single MeshStandardMaterials are editable (matches readMaterialValues).
      if (!(mesh.material instanceof MeshStandardMaterial)) return
      original = mesh.material
      this.originals.set(id, original)
    }

    if (!edit || Object.keys(edit).length === 0) {
      this.restore(mesh)
      return
    }

    let clone = this.clones.get(id)
    if (!clone) {
      clone = original.clone()
      this.clones.set(id, clone)
      mesh.material = clone
    }

    // Start from the original's values, then apply only the edited fields.
    // These are all *uniforms* (values fed to the existing shader program),
    // so changing them is cheap: no `material.needsUpdate`, no shader recompile.
    clone.color.copy(original.color)
    if (edit.color !== undefined) clone.color.set(edit.color) // parses sRGB hex → linear
    clone.roughness = edit.roughness ?? original.roughness
    clone.metalness = edit.metalness ?? original.metalness
  }

  /** Puts the original material back and frees the clone. */
  restore(mesh: Mesh): void {
    const original = this.originals.get(mesh.uuid)
    const clone = this.clones.get(mesh.uuid)
    if (!original || !clone) return
    mesh.material = original
    // dispose() releases the clone's GPU-side state. It does NOT dispose
    // its textures, which is right, since they're shared with the original.
    clone.dispose()
    this.clones.delete(mesh.uuid)
  }

  /** Was this mesh given its own material copy? (Used by tests.) */
  hasClone(meshId: string): boolean {
    return this.clones.has(meshId)
  }
}
