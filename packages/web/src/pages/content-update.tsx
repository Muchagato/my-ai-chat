import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── API stubs ────────────────────────────────────────────────────────────────
// TODO: replace with Orval-generated client once endpoints are ready.

async function generateSlides(_documentType: string): Promise<{ status: string }> {
  // POST /slides/generate  { documentType }
  await new Promise((r) => setTimeout(r, 800)) // fake latency
  return { status: 'ok' }
}

async function getSlidesPreviews(_documentType: string): Promise<{ images: string[] }> {
  // GET /slides/previews?documentType=...
  return { images: [] }
}

async function downloadSlides(
  _documentType: string,
  _format: 'pdf' | 'pptx',
): Promise<{ content: string; filename: string; mimeType: string }> {
  // GET /slides/download?documentType=...&format=...
  throw new Error('not implemented yet')
}

async function getSlidesMetadata(
  _documentType: string,
): Promise<{ lastUpdated: string } | null> {
  // GET /slides/metadata?documentType=...
  return null // stub returns null until real endpoint is connected
}

// ─── Status derivation ───────────────────────────────────────────────────────

type DerivedStatus = 'up-to-date' | 'outdated' | 'stale' | 'unknown'

function deriveStatus(lastUpdated: string | null): DerivedStatus {
  if (!lastUpdated) return 'unknown'
  const days = (Date.now() - new Date(lastUpdated).getTime()) / 86_400_000
  if (days < 7) return 'up-to-date'
  if (days < 14) return 'outdated'
  return 'stale'
}

const statusConfig: Record<
  DerivedStatus,
  { variant: 'secondary' | 'default' | 'destructive' | 'outline'; label: string }
> = {
  'up-to-date': { variant: 'secondary', label: 'Up to date' },
  outdated:     { variant: 'default',   label: 'Outdated' },
  stale:        { variant: 'destructive', label: 'Stale' },
  unknown:      { variant: 'outline',   label: '-' },
}

// ─────────────────────────────────────────────────────────────────────────────

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
  workspace: WorkspaceSection[]
}

const automations: Automation[] = [
  {
    id: 'tombstones',
    name: 'Tombstones',
    type: 'Primary Markets',
    lastUpdated: '2026-02-14T10:30:00Z',
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
  onRefresh,
  isGenerating,
}: {
  automation: Automation
  onBack: () => void
  onRefresh: () => void
  isGenerating: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{automation.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-6">
          {automation.workspace.map((section) => (
            <WorkspaceSectionRenderer key={section.key} section={section} />
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-3">
        <Button className="w-full" onClick={onRefresh} disabled={isGenerating}>
          <RefreshCcwIcon className={`size-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Refresh'}
        </Button>
      </div>
    </div>
  )
}

export default function ContentUpdatePage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [previews, setPreviews] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fetchedLastUpdated, setFetchedLastUpdated] = useState<string | null>(null)

  const selected = automations.find((a) => a.id === id)

  const updatePreviews = (images: string[]) => {
    setPreviews(images)
    setCurrentSlide(0)
  }

  // Fetch previews + metadata whenever the URL param changes
  useEffect(() => {
    updatePreviews([])
    setFetchedLastUpdated(null)
    if (!id) return

    let cancelled = false
    Promise.all([getSlidesPreviews(id), getSlidesMetadata(id)])
      .then(([previewsData, meta]) => {
        if (cancelled) return
        updatePreviews(previewsData.images)
        setFetchedLastUpdated(meta?.lastUpdated ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [id])

  const handleRowClick = (rowId: string) => {
    navigate(`/content-update/${rowId}`)
  }

  const handleBack = () => {
    navigate('/content-update')
  }

  const handleRefresh = async () => {
    if (!id) return
    setIsGenerating(true)
    try {
      await generateSlides(id)
      const [previewsData, meta] = await Promise.all([
        getSlidesPreviews(id),
        getSlidesMetadata(id),
      ])
      updatePreviews(previewsData.images)
      setFetchedLastUpdated(meta?.lastUpdated ?? null)
      toast.success('Slides generated successfully')
    } catch {
      toast.error('Failed to generate slides')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (docId: string, format: 'pptx' | 'pdf') => {
    try {
      const { content, filename, mimeType } = await downloadSlides(docId, format)
      const link = document.createElement('a')
      link.href = `data:${mimeType};base64,${content}`
      link.download = filename
      link.click()
    } catch {
      toast.error('Download not available yet')
    }
  }

  // Derived status for preview header — based on fetched metadata
  const previewStatus = deriveStatus(fetchedLastUpdated)
  const { variant: previewVariant, label: previewLabel } = statusConfig[previewStatus]

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Panel: Table or Workspace */}
      <div className="flex-1 border-r overflow-auto">
        {selected ? (
          <WorkspacePanel
            automation={selected}
            onBack={handleBack}
            onRefresh={handleRefresh}
            isGenerating={isGenerating}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((item) => {
                const status = deriveStatus(item.lastUpdated)
                const { variant, label } = statusConfig[status]
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(item.id)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant}>{label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(item.lastUpdated)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <div className="flex flex-col h-full">
            {/* Preview Header */}
            <div className="grid grid-cols-3 items-center px-6 py-3 border-b">
              <Badge variant={previewVariant} className="w-fit">
                {previewLabel}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                {fetchedLastUpdated
                  ? `Last updated ${formatDate(fetchedLastUpdated)}`
                  : 'Last updated –'}
              </p>
              <div className="flex items-center gap-2 justify-end">
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
            {previews.length > 0 ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Slide image */}
                <div className="flex-1 overflow-hidden flex items-center justify-center p-6 bg-muted/30">
                  <img
                    src={`data:image/png;base64,${previews[currentSlide]}`}
                    alt={`Slide ${currentSlide + 1}`}
                    className="max-h-full max-w-full rounded border shadow-sm object-contain"
                  />
                </div>
                {/* Slide navigation */}
                <div className="flex items-center justify-center gap-3 px-4 py-3 border-t">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentSlide((s) => s - 1)}
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {currentSlide + 1} / {previews.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentSlide((s) => s + 1)}
                    disabled={currentSlide === previews.length - 1}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
