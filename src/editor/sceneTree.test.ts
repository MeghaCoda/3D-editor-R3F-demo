import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { buildSceneTree, getAncestorIds, indexSceneTree } from './sceneTree'

function makeScene() {
  const root = new Group()
  root.name = 'Root'
  const inner = new Group()
  inner.name = 'Inner'
  inner.position.set(1, 2, 3)
  inner.rotation.y = Math.PI / 2
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: 'Leather' }))
  mesh.name = 'Upper'
  root.add(inner)
  inner.add(mesh)
  return { root, inner, mesh }
}

describe('buildSceneTree', () => {
  it('mirrors the hierarchy with names, types and material names', () => {
    const { root, inner, mesh } = makeScene()
    const tree = buildSceneTree(root)

    expect(tree).toMatchObject({
      id: root.uuid,
      name: 'Root',
      type: 'Group',
      materialNames: [],
      geometry: null,
      children: [
        {
          id: inner.uuid,
          name: 'Inner',
          children: [{ id: mesh.uuid, name: 'Upper', type: 'Mesh', materialNames: ['Leather'] }],
        },
      ],
    })
  })

  it('records local transforms with rotation in degrees', () => {
    const { inner } = makeScene()
    const { transform } = buildSceneTree(inner)
    expect(transform.position).toEqual([1, 2, 3])
    expect(transform.rotationDeg[1]).toBeCloseTo(90)
    expect(transform.scale).toEqual([1, 1, 1])
  })

  it('counts vertices and triangles', () => {
    // A 1-segment box: 6 faces x 4 vertices (corners are duplicated per face
    // so each face can have its own normal), 6 faces x 2 triangles.
    const { mesh } = makeScene()
    expect(buildSceneTree(mesh).geometry).toEqual({ vertices: 24, triangles: 12 })
  })

  it('records material ids and editable values', () => {
    const { mesh } = makeScene()
    const material = mesh.material as MeshStandardMaterial
    material.color.set('#336699')
    material.roughness = 0.25
    const node = buildSceneTree(mesh)
    expect(node.materialIds).toEqual([material.uuid])
    expect(node.material).toEqual({ color: '#336699', roughness: 0.25, metalness: 0 })
  })

  it('handles multi-material meshes (not editable)', () => {
    const mesh = new Mesh(new BoxGeometry(), [
      new MeshStandardMaterial({ name: 'A' }),
      new MeshStandardMaterial({ name: 'B' }),
    ])
    expect(buildSceneTree(mesh).materialNames).toEqual(['A', 'B'])
    expect(buildSceneTree(mesh).material).toBeNull()
  })
})

describe('indexSceneTree / getAncestorIds', () => {
  it('maps ids to nodes and walks parents up to the root', () => {
    const { root, inner, mesh } = makeScene()
    const index = indexSceneTree(buildSceneTree(root))

    expect(Object.keys(index)).toHaveLength(3)
    expect(index[mesh.uuid]?.parentId).toBe(inner.uuid)
    expect(getAncestorIds(index, mesh.uuid)).toEqual([inner.uuid, root.uuid])
    expect(getAncestorIds(index, root.uuid)).toEqual([])
    expect(getAncestorIds(index, 'missing')).toEqual([])
  })
})
