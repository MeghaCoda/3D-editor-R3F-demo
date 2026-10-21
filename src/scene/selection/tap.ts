/**
 * Tap vs. drag detection, kept pure so it's unit-testable.
 *
 * On the canvas, the same pointerdown → pointerup sequence can mean
 * "select this" (a tap) or "orbit the camera" (a drag). We only treat it as a
 * tap if the pointer barely moved and was released fairly quickly. Fingers
 * wobble more than mice, so the movement tolerance depends on pointerType.
 */
export type PointerSample = { x: number; y: number; time: number }

const MAX_DISTANCE_PX: Record<string, number> = { mouse: 4, pen: 6, touch: 12 }
const MAX_DURATION_MS = 500

export function isTap(down: PointerSample, up: PointerSample, pointerType: string): boolean {
  const maxDistance = MAX_DISTANCE_PX[pointerType] ?? MAX_DISTANCE_PX.touch ?? 12
  const distance = Math.hypot(up.x - down.x, up.y - down.y)
  return distance <= maxDistance && up.time - down.time <= MAX_DURATION_MS
}
