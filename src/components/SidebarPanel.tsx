import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoButton } from '@/help/InfoButton'
import type { HelpTopicId } from '@/help/helpTopics'
import { cn } from '@/lib/utils'

type SidebarPanelProps = {
  side: 'left' | 'right'
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Help topic for the (i) button next to the title. */
  info?: HelpTopicId
  children: React.ReactNode
}

/**
 * A sidebar that collapses to a slim rail.
 *
 * Collapsed content is hidden, not unmounted, so panel state (like which
 * outliner rows are expanded) survives. The canvas next to it resizes on its
 * own: R3F watches its container with a ResizeObserver and updates the
 * renderer size and camera aspect ratio.
 */
export function SidebarPanel({ side, title, open, onOpenChange, info, children }: SidebarPanelProps) {
  const isLeft = side === 'left'
  const CloseIcon = isLeft ? PanelLeftClose : PanelRightClose
  const OpenIcon = isLeft ? PanelLeftOpen : PanelRightOpen

  return (
    <aside
      aria-label={title}
      className={cn(
        'flex h-full shrink-0 flex-col border-border bg-background',
        isLeft ? 'border-r' : 'border-l',
        open ? 'w-80' : 'w-11 items-center',
      )}
    >
      {open ? (
        <div className={cn('flex items-center gap-1 border-b border-border py-1 pl-3 pr-1', !isLeft && 'flex-row-reverse pl-1 pr-3')}>
          <h2 className="flex flex-1 items-center gap-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
            {info && <InfoButton topic={info} />}
          </h2>
          <Button variant="ghost" size="icon-sm" aria-label={`Hide ${title}`} onClick={() => onOpenChange(false)}>
            <CloseIcon />
          </Button>
        </div>
      ) : (
        // The whole rail is the "open" button: an easy target on a tablet.
        <button
          type="button"
          aria-label={`Show ${title}`}
          onClick={() => onOpenChange(true)}
          className="flex h-full w-full flex-col items-center gap-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <span className="grid size-8 place-items-center">
            <OpenIcon className="size-4" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase [writing-mode:vertical-rl]">{title}</span>
        </button>
      )}
      <div className={cn('flex min-h-0 flex-1 flex-col', !open && 'hidden')}>{children}</div>
    </aside>
  )
}
