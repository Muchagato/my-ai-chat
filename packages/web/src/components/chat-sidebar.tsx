import {
  PlusIcon,
  StarIcon,
  PinIcon,
  EllipsisIcon,
  PencilIcon,
  TrashIcon,
  ArchiveIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mockPinnedChats = [
  { id: 'p1', title: 'Weekly standup notes' },
  { id: 'p2', title: 'Project roadmap discussion' },
]

const mockConversations = [
  { id: '1', title: 'Quarterly revenue analysis', date: 'Today' },
  { id: '2', title: 'Draft investor update email', date: 'Today' },
  { id: '3', title: 'Compare Q3 vs Q4 metrics', date: 'Yesterday' },
  { id: '4', title: 'Summarize board deck', date: 'Yesterday' },
  { id: '5', title: 'Risk assessment for Project X', date: '2 days ago' },
  { id: '6', title: 'Meeting prep notes', date: '3 days ago' },
  { id: '7', title: 'Market research summary', date: 'Last week' },
]

function ChatItemMenu({ isPinned = false }: { isPinned?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <EllipsisIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <PinIcon className="size-4" />
          {isPinned ? 'Unpin chat' : 'Pin chat'}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PencilIcon className="size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArchiveIcon className="size-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TrashIcon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ChatSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1 p-3 border-b">
        <Button variant="ghost" className="justify-start gap-2">
          <PlusIcon className="size-4" />
          New chat
        </Button>
        <Button variant="ghost" className="justify-start gap-2">
          <StarIcon className="size-4" />
          Favorite prompts
        </Button>
      </div>

      {mockPinnedChats.length > 0 && (
        <>
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Pinned
            </span>
          </div>
          <div className="border-b">
            {mockPinnedChats.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                className="group flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <PinIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium flex-1">
                  {chat.title}
                </span>
                <ChatItemMenu isPinned />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          History
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {mockConversations.map((conv) => (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            className="group flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-sidebar-accent transition-colors cursor-pointer"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">{conv.title}</span>
              <span className="text-xs text-muted-foreground">{conv.date}</span>
            </div>
            <ChatItemMenu />
          </div>
        ))}
      </div>
    </div>
  )
}
