import { describe, expect, it } from 'vitest'
import { isTap } from './tap'

const at = (x: number, y: number, time: number) => ({ x, y, time })

describe('isTap', () => {
  it('accepts a quick, still press', () => {
    expect(isTap(at(100, 100, 0), at(101, 100, 120), 'mouse')).toBe(true)
  })

  it('rejects a drag (orbiting the camera)', () => {
    expect(isTap(at(100, 100, 0), at(140, 100, 120), 'mouse')).toBe(false)
  })

  it('tolerates more wobble for touch than for mouse', () => {
    const down = at(100, 100, 0)
    const up = at(108, 100, 120)
    expect(isTap(down, up, 'mouse')).toBe(false)
    expect(isTap(down, up, 'touch')).toBe(true)
  })

  it('rejects a long press', () => {
    expect(isTap(at(100, 100, 0), at(100, 100, 900), 'touch')).toBe(false)
  })
})
