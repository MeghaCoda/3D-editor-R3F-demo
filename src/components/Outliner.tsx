import { useEffect, useRef, useState } from 'react'
import { Box, ChevronRight, Circle, Folder, type LucideIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEditorStore } from '@/editor/store'
import { getAncestorIds, type SceneNode } from '@/editor/sceneTree'
import { cn } from '@/lib/utils'

/**
 * Scene-graph tree, like the devtools Elements panel.
 *
 * It renders from the plain `sceneTree` snapshot in the store, never from
 * three.js objects. Note that this component does NOT subscribe to
 * `selectedId`: each row subscribes to its own "am I selected?" boolean, so a
 * selection change re-renders two rows instead of the whole tree.
 */
export function Outliner() {
  const sceneTree = useEditorStore((s) => s.sceneTree)
  // Expansion is view state, local to this panel, so it stays out of the
  // editor store. We track *collapsed* ids so everything starts expanded.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const listRef = useRef<HTMLUListElement>(null)

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // When something is selected (e.g. by tapping the canvas), expand its
  // ancestors and scroll its row into view, like devtools' "Inspect element".
  // `subscribe` is Zustand's *transient* API: the callback runs on every store
  // change without re-rendering this component. We only call setState when
  // an ancestor actually needs expanding.
  useEffect(
    () =>
      useEditorStore.subscribe((state, prev) => {
        const id = state.selectedId
        if (!id || id === prev.selectedId) return
        const ancestors = getAncestorIds(state.nodes, id)
        setCollapsed((current) => {
          if (!ancestors.some((a) => current.has(a))) return current
          const next = new Set(current)
          for (const a of ancestors) next.delete(a)
          return next
        })
        // Wait a frame so newly expanded rows exist in the DOM.
        requestAnimationFrame(() => {
          listRef.current
            ?.querySelector(`[data-node-id="${CSS.escape(id)}"]`)
            ?.scrollIntoView({ block: 'nearest' })
        })
      }),
    [],
  )

  return (
    <ScrollArea className="min-h-0 flex-1">
      {sceneTree ? (
        <ul ref={listRef} role="tree" aria-label="Scene graph" className="py-1 font-mono text-xs">
          <TreeRow node={sceneTree} depth={0} collapsed={collapsed} onToggle={toggle} />
        </ul>
      ) : (
        <p className="px-3 py-2 text-xs text-muted-foreground">Loading scene…</p>
      )}
    </ScrollArea>
  )
}

const typeIcons: Record<string, LucideIcon> = { Mesh: Box, Group: Folder }

type TreeRowProps = {
  node: SceneNode
  depth: number
  collapsed: ReadonlySet<string>
  onToggle: (id: string) => void
}

function TreeRow({ node, depth, collapsed, onToggle }: TreeRowProps) {
  // A boolean selector: this row re-renders only when *its* selected state flips.
  const isSelected = useEditorStore((s) => s.selectedId === node.id)
  const hasChildren = node.children.length > 0
  const isOpen = hasChildren && !collapsed.has(node.id)
  const Icon = typeIcons[node.type] ?? Circle

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-selected={isSelected}
      aria-level={depth + 1}
    >
      <div
        data-node-id={node.id}
        className={cn(
          'flex h-7 items-center gap-1 pr-2',
          isSelected ? 'bg-primary/25 text-foreground' : 'hover:bg-accent',
        )}
        // Indent by depth; the chevron column keeps names aligned for leaves.
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => onToggle(node.id)}
            // Bigger hit area than the icon: fingers on an iPad are not cursors.
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        {/* DOM controls use onClick, which browsers fire for mouse, touch,
            pen *and* keyboard (Enter/Space). The raw pointer-event handling
            is only needed on the canvas, where taps compete with orbiting. */}
        <button
          type="button"
          onClick={() => useEditorStore.getState().select(node.id)}
          className="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <Icon className={cn('size-3.5 shrink-0', node.type === 'Mesh' ? 'text-primary' : 'text-muted-foreground')} />
          <span className="truncate">{node.name || <em className="text-muted-foreground">(unnamed)</em>}</span>
          <span className="shrink-0 text-muted-foreground">{node.type}</span>
          {node.materialNames.length > 0 && (
            <span className="ml-auto truncate pl-2 text-amber-300/80" title="Material">
              {node.materialNames.join(', ')}
            </span>
          )}
        </button>
      </div>
      {isOpen && (
        <ul role="group">
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  )
}
