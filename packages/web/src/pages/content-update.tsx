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
import {
  RefreshCcwIcon,
  PresentationIcon,
  FileTextIcon,
  UploadIcon,
  ArrowLeftIcon,
  SettingsIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface WorkspaceSection {
  key: string
  title: string
  description: string
  type: 'file-upload' | 'settings'
  accept?: string
  multiple?: boolean
}

interface Automation {
  id: string
  name: string
  type: string
  lastUpdated: string
  status: 'up-to-date' | 'updating' | 'stale'
  workspace: WorkspaceSection[]
}

const automations: Automation[] = [
  {
    id: 'tombstones',
    name: 'Tombstones',
    type: 'Primary Markets',
    lastUpdated: '2026-02-14T10:30:00Z',
    status: 'up-to-date',
    workspace: [
      {
        key: 'dealData',
        title: 'Deal Data',
        description: 'Upload the Excel file with latest deal information',
        type: 'file-upload',
        accept: '.xlsx,.xls,.csv',
      },
    ],
  },
  {
    id: 'credentials',
    name: 'Credentials',
    type: 'Primary Markets',
    lastUpdated: '2026-02-12T16:45:00Z',
    status: 'up-to-date',
    workspace: [
      {
        key: 'credentialsData',
        title: 'Credentials Data',
        description: 'Upload the Excel file with updated credentials',
        type: 'file-upload',
        accept: '.xlsx,.xls,.csv',
      },
      {
        key: 'settings',
        title: 'Settings',
        description: 'Configure credential generation options',
        type: 'settings',
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

function FileUploadSection({ section }: { section: WorkspaceSection }) {
  const [files, setFiles] = useState<FileList | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <UploadIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{section.title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{section.description}</p>
      <Input
        type="file"
        accept={section.accept}
        multiple={section.multiple}
        onChange={(e) => setFiles(e.target.files)}
        className="cursor-pointer"
      />
      {files && files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {files.length} file(s) selected
        </p>
      )}
    </div>
  )
}

function SettingsSection({ section }: { section: WorkspaceSection }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SettingsIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{section.title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{section.description}</p>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Settings panel coming soon.
      </div>
    </div>
  )
}

function WorkspaceSectionRenderer({ section }: { section: WorkspaceSection }) {
  switch (section.type) {
    case 'file-upload':
      return <FileUploadSection section={section} />
    case 'settings':
      return <SettingsSection section={section} />
    default:
      return null
  }
}

function WorkspacePanel({
  automation,
  onBack,
}: {
  automation: Automation
  onBack: () => void
}) {
  const handleRefresh = () => {
    toast.success(`Refreshing ${automation.name}...`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{automation.name}</h2>
            <Badge variant={statusVariant[automation.status]}>
              {automation.status === 'up-to-date'
                ? 'Up to date'
                : automation.status === 'updating'
                  ? 'Updating...'
                  : 'Stale'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated {formatDate(automation.lastUpdated)}
          </p>
        </div>
      </div>

      {/* Workspace Sections */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-6">
          {automation.workspace.map((section) => (
            <WorkspaceSectionRenderer key={section.key} section={section} />
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="border-t px-4 py-3">
        <Button className="w-full" onClick={handleRefresh}>
          <RefreshCcwIcon className="size-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}

export default function ContentUpdatePage() {
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null)

  const activeAutomation = automations.find((a) => a.id === activeWorkspace)
  const selected = activeAutomation

  const handleRowClick = (id: string) => {
    setActiveWorkspace(id)
  }

  const handleBack = () => {
    setActiveWorkspace(null)
  }

  const handleDownload = (id: string, format: 'pptx' | 'pdf') => {
    console.log(`Downloading ${format} for: ${id}`)
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Panel: Table or Workspace */}
      <div className="flex-1 border-r overflow-auto">
        {activeAutomation ? (
          <WorkspacePanel automation={activeAutomation} onBack={handleBack} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((item) => (
                <TableRow
                  key={item.id}
                  data-state={activeWorkspace === item.id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(item.id)}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
