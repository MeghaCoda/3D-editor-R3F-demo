import { beforeEach, describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { buildSceneTree } from './sceneTree'
import { resolveMaterial, useEditorStore } from './store'

// Zustand stores work outside React: getState() reads, actions mutate.
const store = useEditorStore

function loadScene() {
  const root = new Group()
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial())
  root.add(mesh)
  store.getState().setSceneTree(buildSceneTree(root))
  return { root, mesh }
}

describe('selection', () => {
  beforeEach(() => store.getState().setSceneTree(null))

  it('selects and deselects known nodes', () => {
    const { mesh } = loadScene()
    store.getState().select(mesh.uuid)
    expect(store.getState().selectedId).toBe(mesh.uuid)
    store.getState().select(null)
    expect(store.getState().selectedId).toBeNull()
  })

  it('ignores ids that are not in the scene', () => {
    const { mesh } = loadScene()
    store.getState().select(mesh.uuid)
    store.getState().select('not-a-node')
    expect(store.getState().selectedId).toBe(mesh.uuid)
  })

  it('clears selection when the scene is replaced', () => {
    const { mesh } = loadScene()
    store.getState().select(mesh.uuid)
    loadScene()
    expect(store.getState().selectedId).toBeNull()
  })
})

describe('material edits', () => {
  beforeEach(() => store.getState().setSceneTree(null))

  it('merges successive edits for a mesh', () => {
    const { mesh } = loadScene()
    store.getState().editMaterial(mesh.uuid, { roughness: 0.2 })
    store.getState().editMaterial(mesh.uuid, { color: '#ff0000' })
    expect(store.getState().materialEdits[mesh.uuid]).toEqual({ roughness: 0.2, color: '#ff0000' })
  })

  it('ignores edits to nodes without an editable material', () => {
    const { root } = loadScene()
    store.getState().editMaterial(root.uuid, { roughness: 0.2 })
    expect(store.getState().materialEdits).toEqual({})
  })

  it('reset removes the override entirely', () => {
    const { mesh } = loadScene()
    store.getState().editMaterial(mesh.uuid, { metalness: 1 })
    store.getState().resetMaterial(mesh.uuid)
    expect(store.getState().materialEdits).toEqual({})
  })

  it('resolveMaterial overlays edits on base values', () => {
    expect(
      resolveMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0 }, { roughness: 0.9 }),
    ).toEqual({ color: '#ffffff', roughness: 0.9, metalness: 0 })
  })
})
