import { describe, expect, it } from 'vitest'
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three'
import { MaterialOverrides } from './MaterialOverrides'

function twoMeshesSharingAMaterial() {
  const shared = new MeshStandardMaterial({ name: 'Shared', color: '#ffffff', roughness: 0.5, metalness: 0 })
  const a = new Mesh(new BoxGeometry(), shared)
  const b = new Mesh(new BoxGeometry(), shared)
  return { shared, a, b }
}

describe('MaterialOverrides', () => {
  it('clones on first edit so meshes sharing the material are unaffected', () => {
    const { shared, a, b } = twoMeshesSharingAMaterial()
    const overrides = new MaterialOverrides()

    overrides.apply(a, { color: '#ff0000', roughness: 0.9 })

    expect(a.material).not.toBe(shared)
    expect(b.material).toBe(shared)
    expect(shared.color.getHexString()).toBe('ffffff')
    expect(shared.roughness).toBe(0.5)
    const edited = a.material as MeshStandardMaterial
    expect(edited.color.getHexString()).toBe('ff0000')
    expect(edited.roughness).toBe(0.9)
    expect(edited.name).toBe('Shared')
  })

  it('reuses the same clone for later edits', () => {
    const { a } = twoMeshesSharingAMaterial()
    const overrides = new MaterialOverrides()
    overrides.apply(a, { roughness: 0.1 })
    const firstClone = a.material
    overrides.apply(a, { roughness: 0.2 })
    expect(a.material).toBe(firstClone)
  })

  it('derives from the original: fields dropped from the edit revert', () => {
    const { a } = twoMeshesSharingAMaterial()
    const overrides = new MaterialOverrides()
    overrides.apply(a, { color: '#00ff00', metalness: 1 })
    overrides.apply(a, { metalness: 1 }) // color no longer overridden
    expect((a.material as MeshStandardMaterial).color.getHexString()).toBe('ffffff')
  })

  it('restores the original material when the edit is cleared', () => {
    const { shared, a } = twoMeshesSharingAMaterial()
    const overrides = new MaterialOverrides()
    overrides.apply(a, { metalness: 1 })
    overrides.apply(a, undefined)
    expect(a.material).toBe(shared)
    expect(overrides.hasClone(a.uuid)).toBe(false)
  })
})
