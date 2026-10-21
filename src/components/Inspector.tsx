import { useEditorStore } from '@/editor/store'
import type { Vec3 } from '@/editor/sceneTree'
import { InfoButton } from '@/help/InfoButton'
import type { HelpTopicId } from '@/help/helpTopics'
import { MaterialSection } from './MaterialSection'

/**
 * Right sidebar: properties of the selected node.
 *
 * Everything shown comes from plain data in the store. This component reads
 * the selection and the node snapshot (which change only on select/load);
 * the fast-changing material values are read further down, in
 * <MaterialSection>, so a slider drag re-renders that section, not this.
 */
export function Inspector() {
  const entry = useEditorStore((s) => (s.selectedId ? s.nodes[s.selectedId] : undefined))
  const parentName = useEditorStore((s) => (entry?.parentId ? s.nodes[entry.parentId]?.node.name : undefined))

  if (!entry) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Tap a mesh in the viewport or a row in the outliner.</p>
  }
  const { node } = entry

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 text-xs">
      <div>
        <div className="truncate text-sm font-medium">{node.name || '(unnamed)'}</div>
        <div className="text-muted-foreground">
          {node.type}
          {parentName !== undefined && <> in {parentName || '(unnamed)'}</>}
        </div>
      </div>

      {node.material ? (
        // key: remount per mesh so no slider/drag state leaks between meshes.
        <MaterialSection key={node.id} meshId={node.id} />
      ) : node.type === 'Mesh' ? (
        <p className="text-muted-foreground">This mesh's material type isn't editable here.</p>
      ) : (
        <p className="text-muted-foreground">Select a mesh to edit its material.</p>
      )}

      <Section title="Transform (local)" info="transform">
        <VecRow label="Position" info="position" value={node.transform.position} digits={3} />
        <VecRow label="Rotation°" info="rotation" value={node.transform.rotationDeg} digits={1} />
        <VecRow label="Scale" info="scale" value={node.transform.scale} digits={3} />
      </Section>

      {node.geometry && (
        <Section title="Geometry" info="geometry">
          <Row label="Vertices" info="vertices" value={node.geometry.vertices.toLocaleString()} />
          <Row label="Triangles" info="triangles" value={node.geometry.triangles.toLocaleString()} />
        </Section>
      )}
    </div>
  )
}

type SectionProps = { title: string; info?: HelpTopicId; children: React.ReactNode }

export function Section({ title, info, children }: SectionProps) {
  return (
    <section className="space-y-1.5">
      <h3 className="flex items-center gap-0.5 font-semibold text-muted-foreground">
        {title}
        {info && <InfoButton topic={info} />}
      </h3>
      {children}
    </section>
  )
}

type RowProps = { label: string; info?: HelpTopicId; value: string }

function Row({ label, info, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <FieldLabel label={label} info={info} />
      <span className="truncate font-mono">{value}</span>
    </div>
  )
}

function VecRow({ label, info, value, digits }: Omit<RowProps, 'value'> & { value: Vec3; digits: number }) {
  return <Row label={label} info={info} value={value.map((n) => n.toFixed(digits)).join('  ')} />
}

/** A property name with an optional (i) button after it. */
export function FieldLabel({ label, info, htmlFor }: { label: string; info?: HelpTopicId; htmlFor?: string }) {
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
      {info && <InfoButton topic={info} />}
    </span>
  )
}
