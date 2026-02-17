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
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RefreshCcwIcon,
  PresentationIcon,
  FileTextIcon,
  UploadIcon,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface RefreshInput {
  key: string
  label: string
  description: string
  type: 'file' | 'images'
  accept?: string
}

interface Automation {
  id: string
  name: string
  type: string
  lastUpdated: string
  status: 'up-to-date' | 'updating' | 'stale'
  refreshInputs?: RefreshInput[]
}

const automations: Automation[] = [
  {
    id: 'tombstones',
    name: 'Tombstones',
    type: 'Primary Markets',
    lastUpdated: '2026-02-14T10:30:00Z',
    status: 'up-to-date',
    refreshInputs: [
      {
        key: 'dealData',
        label: 'Deal data',
        description: 'Upload the Excel file with latest deal information',
        type: 'file',
        accept: '.xlsx,.xls,.csv',
      }
    ],
  },
  {
    id: 'credentials',
    name: 'Credentials',
    type: 'Primary Markets',
    lastUpdated: '2026-02-12T16:45:00Z',
    status: 'up-to-date',
    refreshInputs: [
      {
        key: 'credentialsData',
        label: 'Credentials data',
        description: 'Upload the Excel file with updated credentials',
        type: 'file',
        accept: '.xlsx,.xls,.csv',
      },
    ],
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

function RefreshDialog({
  automation,
  open,
  onOpenChange,
}: {
  automation: Automation
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [files, setFiles] = useState<Record<string, FileList | null>>({})

  const handleFileChange = (key: string, fileList: FileList | null) => {
    setFiles((prev) => ({ ...prev, [key]: fileList }))
  }

  const handleRefresh = () => {
    console.log(`Refreshing ${automation.id} with files:`, files)
    toast.success(`Refreshing ${automation.name}...`)
    setFiles({})
    onOpenChange(false)
  }

  const inputs = automation.refreshInputs ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refresh {automation.name}</DialogTitle>
          <DialogDescription>
            Provide the required files to refresh this automation. All fields
            are optional — leave empty to use existing data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          {inputs.map((input) => (
            <div key={input.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {input.type === 'images' ? (
                  <ImageIcon className="size-4 text-muted-foreground" />
                ) : (
                  <UploadIcon className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{input.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {input.description}
              </p>
              <Input
                type="file"
                accept={input.accept}
                multiple={input.type === 'images'}
                onChange={(e) => handleFileChange(input.key, e.target.files)}
                className="cursor-pointer"
              />
              {files[input.key] && files[input.key]!.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {files[input.key]!.length} file(s) selected
                </p>
              )}
            </div>
          ))}
          {inputs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No additional inputs required. Click refresh to proceed.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCcwIcon className="size-4" />
            Refresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ContentUpdatePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshTarget, setRefreshTarget] = useState<Automation | null>(null)
  const selected = automations.find((a) => a.id === selectedId)

  const handleRefresh = (automation: Automation) => {
    setRefreshTarget(automation)
  }

  const handleDownload = (id: string, format: 'pptx' | 'pdf') => {
    console.log(`Downloading ${format} for: ${id}`)
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Refresh Dialog */}
      {refreshTarget && (
        <RefreshDialog
          automation={refreshTarget}
          open={!!refreshTarget}
          onOpenChange={(open) => !open && setRefreshTarget(null)}
        />
      )}

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
                            onClick={() => handleRefresh(item)}
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
                    onClick={() => handleRefresh(selected)}
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
