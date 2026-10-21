import { useEffect, useState } from 'react'
import { Inspector } from './components/Inspector'
import { Outliner } from './components/Outliner'
import { SidebarPanel } from './components/SidebarPanel'
import { InfoButton } from './help/InfoButton'
import { useEditorStore } from './editor/store'
import { Viewport } from './scene/Viewport'

/** Sidebars start open only when there's room for them next to the canvas. */
const startsWide = () => window.matchMedia('(min-width: 1024px)').matches

export function App() {
  // Panel visibility is UI layout state, not editor state, so it lives here
  // rather than in the editor store (it shouldn't be undoable, for one).
  const [outlinerOpen, setOutlinerOpen] = useState(startsWide)
  const [inspectorOpen, setInspectorOpen] = useState(startsWide)

  // Escape clears the selection, as in most editors.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // An open dialog handles Esc first (closing itself) and marks the event
      // defaultPrevented; don't also clear the selection underneath it.
      if (e.key === 'Escape' && !e.defaultPrevented) useEditorStore.getState().select(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex h-full">
      <SidebarPanel side="left" title="Outliner" info="outliner" open={outlinerOpen} onOpenChange={setOutlinerOpen}>
        <Outliner />
      </SidebarPanel>
      {/* min-w-0 lets the canvas shrink; flex children default to min-width: auto. */}
      <main className="relative min-w-0 flex-1">
        <Viewport />
        <InfoButton topic="viewport" className="absolute top-2 left-2 size-8 bg-background/70 backdrop-blur" />
      </main>
      <SidebarPanel side="right" title="Inspector" info="inspector" open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <Inspector />
      </SidebarPanel>
    </div>
  )
}
