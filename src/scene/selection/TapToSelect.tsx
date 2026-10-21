import { useEffect, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { Raycaster, Vector2, type Object3D } from 'three'
import { useEditorStore } from '@/editor/store'
import { isRegistered } from '../objectRegistry'
import { isTap, type PointerSample } from './tap'

/**
 * Selects whatever mesh is under a tap (mouse click, pen tap, or finger tap).
 *
 * Why raw pointer events instead of R3F's `onClick` on meshes?
 * - R3F's onClick is built on the DOM `click` event, which also fires at the
 *   end of an orbit drag; we want only real taps.
 * - We need to see *every* pointer to notice multi-touch: a two-finger pinch
 *   on the iPad must never select anything when the fingers lift.
 * - Taps on empty space should deselect, which per-mesh handlers can't see.
 *
 * Doing the pick ourselves also shows what R3F does under the hood: raycasting.
 */
export function TapToSelect({ targetRef }: { targetRef: RefObject<Object3D | null> }) {
  const domElement = useThree((s) => s.gl.domElement)
  // `get` reads the latest R3F state at call time without subscribing, so the
  // effect doesn't re-run if, say, the camera object is replaced.
  const getThree = useThree((s) => s.get)

  useEffect(() => {
    const raycaster = new Raycaster()
    const ndc = new Vector2()
    /** Pointers currently pressed, keyed by pointerId (one per finger). */
    const pressed = new Map<number, PointerSample>()
    /** Set once a second pointer joins; cleared when all pointers lift. */
    let isMultiTouch = false

    const sample = (e: PointerEvent): PointerSample => ({ x: e.clientX, y: e.clientY, time: e.timeStamp })

    /**
     * Raycasting: shoot an invisible ray from the camera through the tapped
     * pixel and list every mesh it passes through, nearest first.
     *
     * The ray needs the pixel in *normalized device coordinates* (NDC):
     * x and y from -1 to +1 across the canvas, with +y pointing up (the DOM's
     * y points down, hence the minus sign).
     */
    const pick = (e: PointerEvent): string | null => {
      const target = targetRef.current
      if (!target) return null
      const rect = domElement.getBoundingClientRect()
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, getThree().camera)
      const hits = raycaster.intersectObject(target, true)
      // Skip anything that isn't part of the indexed model, such as the
      // overlay mesh that the selection highlight adds as a child.
      const hit = hits.find((h) => h.object.visible && isRegistered(h.object.uuid))
      return hit ? hit.object.uuid : null
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return // right/middle = pan
      pressed.set(e.pointerId, sample(e))
      if (pressed.size > 1) isMultiTouch = true
    }

    const onPointerUp = (e: PointerEvent) => {
      const down = pressed.get(e.pointerId)
      pressed.delete(e.pointerId)
      const wasMultiTouch = isMultiTouch
      if (pressed.size === 0) isMultiTouch = false
      if (!down || wasMultiTouch || !isTap(down, sample(e), e.pointerType)) return
      // Event handlers call store actions via getState(): no subscription and
      // no re-render of this component. Tapping empty space selects null.
      useEditorStore.getState().select(pick(e))
    }

    // The browser sends pointercancel when it takes over a gesture (e.g. iOS
    // system swipes). Forget that pointer; it never produces a tap.
    const onPointerCancel = (e: PointerEvent) => {
      pressed.delete(e.pointerId)
      if (pressed.size === 0) isMultiTouch = false
    }

    domElement.addEventListener('pointerdown', onPointerDown)
    domElement.addEventListener('pointerup', onPointerUp)
    domElement.addEventListener('pointercancel', onPointerCancel)
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown)
      domElement.removeEventListener('pointerup', onPointerUp)
      domElement.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [domElement, getThree, targetRef])

  return null
}
