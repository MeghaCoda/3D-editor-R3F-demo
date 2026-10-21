import { MathUtils, Mesh, MeshStandardMaterial, type Material, type Object3D } from 'three'

export type Vec3 = readonly [number, number, number]

/**
 * The editable PBR ("physically based rendering") inputs of a material.
 * - color: base color ("albedo"), as an sRGB hex string like '#d9d4cc'
 * - roughness: 0 = mirror-sharp reflections, 1 = fully diffuse/matte
 * - metalness: 0 = dielectric (plastic, leather, fabric), 1 = bare metal.
 *   Real materials are almost always one or the other, rarely in between.
 */
export type MaterialValues = { color: string; roughness: number; metalness: number }

/**
 * A plain-data snapshot of one node in the three.js scene graph.
 *
 * Why not just hand the UI the Object3D tree? Three.js objects are mutable
 * class instances that React can't see changes in. The UI renders from
 * serializable data it owns (like any other React state), and only the scene
 * layer touches live Object3Ds, looking them up by `id`.
 */
export type SceneNode = {
  /** Object3D.uuid: unique and stable for the lifetime of the loaded object. */
  id: string
  name: string
  /** three.js class name: 'Mesh', 'Group', 'Object3D', ... */
  type: string
  /** Material name(s) for meshes, [] for everything else. A mesh can have an
   *  array of materials (one per "geometry group"), hence the array. */
  materialNames: string[]
  /** Material.uuid per slot. Two meshes with the same id share one material. */
  materialIds: string[]
  /** Base values of the mesh's material, if it's editable (a single
   *  MeshStandardMaterial, which is what glTF materials load as). */
  material: MaterialValues | null
  /**
   * Local transform, i.e. relative to the parent node. A node's world
   * position is its parent's world transform applied to this, all the way up
   * the tree. That's why moving a Group moves all its children.
   */
  transform: { position: Vec3; rotationDeg: Vec3; scale: Vec3 }
  /** Size of the mesh's geometry; null for non-meshes. */
  geometry: { vertices: number; triangles: number } | null
  children: SceneNode[]
}

export function buildSceneTree(object: Object3D): SceneNode {
  const isMesh = object instanceof Mesh
  const materials = isMesh ? toArray<Material>(object.material) : []
  return {
    id: object.uuid,
    name: object.name,
    type: object.type,
    materialNames: materials.map((m) => m.name),
    materialIds: materials.map((m) => m.uuid),
    material: isMesh ? readMaterialValues(object.material) : null,
    transform: {
      position: object.position.toArray(),
      // Rotation is stored as Euler angles in radians; degrees read better.
      rotationDeg: [
        MathUtils.radToDeg(object.rotation.x),
        MathUtils.radToDeg(object.rotation.y),
        MathUtils.radToDeg(object.rotation.z),
      ],
      scale: object.scale.toArray(),
    },
    geometry: isMesh ? geometryStats(object) : null,
    children: object.children.map(buildSceneTree),
  }
}

function geometryStats(mesh: Mesh): { vertices: number; triangles: number } {
  // Every geometry has a `position` attribute: one xyz per vertex.
  const vertices = mesh.geometry.getAttribute('position').count
  // Indexed geometry reuses vertices: triangles are triples of indices.
  // Non-indexed geometry lists every triangle's three vertices in order.
  const index = mesh.geometry.getIndex()
  return { vertices, triangles: (index ? index.count : vertices) / 3 }
}

/**
 * Reads editable values from a material, or null if it isn't editable here.
 * (MeshPhysicalMaterial extends MeshStandardMaterial, so it counts too.)
 */
export function readMaterialValues(material: Material | Material[]): MaterialValues | null {
  if (!(material instanceof MeshStandardMaterial)) return null
  return {
    // Color management: three.js stores colors in *linear* space internally,
    // because lighting math only works on linear values. getHexString()
    // converts back to sRGB, the space color pickers and CSS use.
    color: `#${material.color.getHexString()}`,
    roughness: material.roughness,
    metalness: material.metalness,
  }
}

/** Ids of every mesh whose material slot list includes `materialId`. */
export function meshesUsingMaterial(index: Record<string, IndexedNode>, materialId: string): string[] {
  return Object.values(index)
    .filter(({ node }) => node.materialIds.includes(materialId))
    .map(({ node }) => node.id)
}

export type IndexedNode = { node: SceneNode; parentId: string | null }

/** Flat id → node lookup, so selection code doesn't walk the tree each time. */
export function indexSceneTree(root: SceneNode): Record<string, IndexedNode> {
  const index: Record<string, IndexedNode> = {}
  const visit = (node: SceneNode, parentId: string | null) => {
    index[node.id] = { node, parentId }
    for (const child of node.children) visit(child, node.id)
  }
  visit(root, null)
  return index
}

/** Ids of every ancestor of `id`, nearest parent first. */
export function getAncestorIds(index: Record<string, IndexedNode>, id: string): string[] {
  const ancestors: string[] = []
  let parentId = index[id]?.parentId ?? null
  while (parentId) {
    ancestors.push(parentId)
    parentId = index[parentId]?.parentId ?? null
  }
  return ancestors
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
