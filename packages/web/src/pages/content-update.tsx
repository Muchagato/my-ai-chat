import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  RefreshCcwIcon,
  PresentationIcon,
  FileTextIcon,
} from 'lucide-react'

interface Automation {
  id: string
  name: string
  type: string
  lastUpdated: string
  status: 'up-to-date' | 'updating' | 'stale'
}

const automations: Automation[] = [
  {
    id: 'tombstones',
    name: 'Tombstones',
    type: 'Primary Markets',
    lastUpdated: '2026-02-14T10:30:00Z',
    status: 'up-to-date',
  },
  {
    id: 'credentials',
    name: 'Credentials',
    type: 'Primary Markets',
    lastUpdated: '2026-02-12T16:45:00Z',
    status: 'up-to-date',
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusVariant = {
  'up-to-date': 'secondary',
  updating: 'default',
  stale: 'destructive',
} as const

export default function ContentUpdatePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = automations.find((a) => a.id === selectedId)

  const handleRefresh = (id: string) => {
    console.log(`Refreshing automation: ${id}`)
  }

  const handleDownload = (id: string, format: 'pptx' | 'pdf') => {
    console.log(`Downloading ${format} for: ${id}`)
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Table Panel */}
      <div className="flex-1 border-r overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((item) => (
                <TableRow
                  key={item.id}
                  data-state={selectedId === item.id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(item.id)}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(item.lastUpdated)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status]}>
                      {item.status === 'up-to-date'
                        ? 'Up to date'
                        : item.status === 'updating'
                          ? 'Updating...'
                          : 'Stale'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRefresh(item.id)}
                          >
                            <RefreshCcwIcon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDownload(item.id, 'pptx')}
                          >
                            <PresentationIcon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download PPT</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDownload(item.id, 'pdf')}
                          >
                            <FileTextIcon className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download PDF</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-auto">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b">
                <div>
                  <h2 className="font-semibold">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Last updated {formatDate(selected.lastUpdated)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selected.id, 'pptx')}
                  >
                    <PresentationIcon className="size-4" />
                    PPT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selected.id, 'pdf')}
                  >
                    <FileTextIcon className="size-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRefresh(selected.id)}
                  >
                    <RefreshCcwIcon className="size-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 flex items-center justify-center bg-muted/30 p-6">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                  <div className="rounded-lg border bg-card p-8 shadow-sm">
                    <FileTextIcon className="size-16 text-muted-foreground/50 mx-auto" />
                  </div>
                  <div>
                    <p className="font-medium">{selected.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Document preview will be displayed here once the backend
                      integration is connected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="flex flex-col items-center gap-3 max-w-xs">
                <FileTextIcon className="size-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium text-muted-foreground">
                    No document selected
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Select an automation from the table to preview its document
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}
