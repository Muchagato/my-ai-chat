import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockConversations = [
  { id: '1', title: 'Quarterly revenue analysis', date: 'Today' },
  { id: '2', title: 'Draft investor update email', date: 'Today' },
  { id: '3', title: 'Compare Q3 vs Q4 metrics', date: 'Yesterday' },
  { id: '4', title: 'Summarize board deck', date: 'Yesterday' },
  { id: '5', title: 'Risk assessment for Project X', date: '2 days ago' },
  { id: '6', title: 'Meeting prep notes', date: '3 days ago' },
  { id: '7', title: 'Market research summary', date: 'Last week' },
]

export default function ChatSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <span className="text-sm font-medium">History</span>
        <Button variant="ghost" size="icon-sm">
          <PlusIcon className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {mockConversations.map((conv) => (
          <button
            key={conv.id}
            className="flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left text-sm hover:bg-sidebar-accent transition-colors"
          >
            <span className="truncate font-medium">{conv.title}</span>
            <span className="text-xs text-muted-foreground">{conv.date}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
