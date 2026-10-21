import { useId, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { meshesUsingMaterial } from '@/editor/sceneTree'
import { resolveMaterial, useEditorStore } from '@/editor/store'
import type { HelpTopicId } from '@/help/helpTopics'
import { FieldLabel, Section } from './Inspector'

/**
 * Color / roughness / metalness controls for one mesh.
 *
 * Data flow for a slider drag:
 *   Slider onValueChange → editMaterial() updates the store
 *     → this component re-renders (it selects this mesh's edit) to move the thumb
 *     → MaterialEditsSync's transient subscription mutates the three.js material
 *   Nothing else re-renders: not the Inspector, the Outliner, or the scene.
 */
export function MaterialSection({ meshId }: { meshId: string }) {
  const node = useEditorStore((s) => s.nodes[meshId]?.node)
  // Selecting just this mesh's edit: edits to other meshes don't re-render us.
  const edit = useEditorStore((s) => s.materialEdits[meshId])
  const nodes = useEditorStore((s) => s.nodes)

  // Which other meshes use the same material? Recomputed only when the
  // scene or the mesh changes, not on every edit.
  const sharedWith = useMemo(() => {
    const materialId = node?.materialIds[0]
    if (!materialId) return []
    return meshesUsingMaterial(nodes, materialId)
      .filter((id) => id !== meshId)
      .map((id) => nodes[id]?.node.name || '(unnamed)')
  }, [nodes, node, meshId])

  if (!node?.material) return null
  const values = resolveMaterial(node.material, edit)
  // Actions are stable functions; calling them via getState() avoids subscribing.
  const { editMaterial, resetMaterial } = useEditorStore.getState()
  const isEdited = edit !== undefined

  return (
    <Section title="Material" info="material">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono">{node.materialNames[0] || '(unnamed)'}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!isEdited}
          onClick={() => resetMaterial(meshId)}
          className="h-7 text-xs"
        >
          <RotateCcw /> Reset
        </Button>
      </div>
      <p className="text-muted-foreground">
        {isEdited
          ? 'Edited: this mesh now has its own copy of the material.'
          : sharedWith.length > 0
            ? `Shared with ${sharedWith.join(', ')}. Editing gives this mesh its own copy.`
            : 'Not shared with other meshes.'}
      </p>

      <ColorRow value={values.color} onChange={(color) => editMaterial(meshId, { color })} />
      <SliderRow
        label="Roughness"
        info="roughness"
        value={values.roughness}
        onChange={(roughness) => editMaterial(meshId, { roughness })}
      />
      <SliderRow
        label="Metalness"
        info="metalness"
        value={values.metalness}
        onChange={(metalness) => editMaterial(meshId, { metalness })}
      />
    </Section>
  )
}

function ColorRow({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <FieldLabel label="Color" info="color" htmlFor={id} />
      <div className="flex items-center gap-2">
        <span className="font-mono">{value}</span>
        {/* The native color input opens the OS picker (including on iPad).
            React's onChange fires continuously while you drag in the picker. */}
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-11 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
      </div>
    </div>
  )
}

type SliderRowProps = { label: string; info: HelpTopicId; value: number; onChange: (v: number) => void }

function SliderRow({ label, info, value, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between">
        <FieldLabel label={label} info={info} />
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      {/* Radix sliders use pointer events + pointer capture, so dragging works
          the same with mouse, pen and touch. py-2 enlarges the touch target. */}
      <Slider
        aria-label={label}
        min={0}
        max={1}
        step={0.01}
        value={[value]}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v)
        }}
        className="py-2"
      />
    </div>
  )
}
