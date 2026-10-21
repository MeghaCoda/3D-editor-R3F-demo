import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { helpTopics, type HelpTopicId } from './helpTopics'

/**
 * A small (i) button that opens a modal explaining `topic`.
 *
 * Radix Dialog handles the modal behavior: focus moves into the dialog and is
 * trapped there, Esc and tapping the backdrop close it, and focus returns to
 * this button afterwards. The dialog's content is only mounted while open,
 * so dozens of these buttons cost almost nothing.
 */
export function InfoButton({ topic, className }: { topic: HelpTopicId; className?: string }) {
  const { title, summary, body } = helpTopics[topic]
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`About ${title}`}
          // The icon is small to stay out of the way; the button around it is
          // 24px so it's still a reasonable touch target.
          className={cn(
            'inline-grid size-6 shrink-0 place-items-center rounded text-muted-foreground/70 hover:bg-accent hover:text-foreground',
            className,
          )}
        >
          <Info className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{summary}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_li]:mt-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {body}
        </div>
      </DialogContent>
    </Dialog>
  )
}
