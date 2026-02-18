import { useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import {
  CellStyleModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  QuickFilterModule,
  TextFilterModule,
  NumberFilterModule,
  ValidationModule,
  themeQuartz,
  colorSchemeLight,
  colorSchemeDark,
} from 'ag-grid-community'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LockIcon, UploadIcon, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useServices } from '@/hooks/use-services'
import { useTheme } from '@/components/theme-provider'

ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule,
  QuickFilterModule,
  TextFilterModule,
  NumberFilterModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
])

function buildGridTheme(mode: 'light' | 'dark') {
  const colorScheme = mode === 'dark' ? colorSchemeDark : colorSchemeLight
  return themeQuartz.withPart(colorScheme).withParams({
    backgroundColor: 'var(--background)',
    foregroundColor: 'var(--foreground)',
    borderColor: 'var(--border)',
    headerBackgroundColor: 'var(--muted)',
    headerTextColor: 'var(--foreground)',
    rowHoverColor: 'var(--accent)',
    selectedRowBackgroundColor: 'var(--accent)',
    browserColorScheme: mode,
  })
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const issuanceData = [
  { issuer: 'Apple Inc.', ticker: 'AAPL', dealSize: 5500, currency: 'USD', pricingDate: '2026-02-10', status: 'Priced' },
  { issuer: 'Microsoft Corp', ticker: 'MSFT', dealSize: 3000, currency: 'USD', pricingDate: '2026-02-08', status: 'Priced' },
  { issuer: 'Amazon.com', ticker: 'AMZN', dealSize: 4000, currency: 'USD', pricingDate: '2026-02-05', status: 'Priced' },
  { issuer: 'Deutsche Bank AG', ticker: 'DB', dealSize: 2000, currency: 'EUR', pricingDate: '2026-02-12', status: 'Announced' },
  { issuer: 'HSBC Holdings', ticker: 'HSBA', dealSize: 1500, currency: 'GBP', pricingDate: '2026-02-14', status: 'Roadshow' },
  { issuer: 'Toyota Motor', ticker: 'TM', dealSize: 3500, currency: 'JPY', pricingDate: '2026-01-28', status: 'Priced' },
  { issuer: 'BNP Paribas', ticker: 'BNP', dealSize: 2500, currency: 'EUR', pricingDate: '2026-02-03', status: 'Priced' },
  { issuer: 'Goldman Sachs', ticker: 'GS', dealSize: 4500, currency: 'USD', pricingDate: '2026-02-15', status: 'Announced' },
]

const allocationsData = [
  { deal: 'Apple 5Y Senior', investor: 'BlackRock', amount: 250, allocationPct: 4.5, status: 'Confirmed' },
  { deal: 'Apple 5Y Senior', investor: 'Vanguard', amount: 200, allocationPct: 3.6, status: 'Confirmed' },
  { deal: 'Apple 5Y Senior', investor: 'PIMCO', amount: 180, allocationPct: 3.3, status: 'Pending' },
  { deal: 'Microsoft 10Y', investor: 'Fidelity', amount: 300, allocationPct: 10.0, status: 'Confirmed' },
  { deal: 'Microsoft 10Y', investor: 'Capital Group', amount: 150, allocationPct: 5.0, status: 'Confirmed' },
  { deal: 'Deutsche Bank 3Y', investor: 'Allianz', amount: 100, allocationPct: 5.0, status: 'Pending' },
  { deal: 'Deutsche Bank 3Y', investor: 'AXA IM', amount: 120, allocationPct: 6.0, status: 'Confirmed' },
  { deal: 'Goldman Sachs 7Y', investor: 'State Street', amount: 200, allocationPct: 4.4, status: 'Pending' },
]

const secondaryData = [
  { bond: 'AAPL 2.40 05/03/2030', isin: 'US037833DV96', price: 98.25, yield: 2.65, spread: 45, lastUpdated: '2026-02-18T09:30:00Z' },
  { bond: 'MSFT 2.525 06/01/2050', isin: 'US594918BW55', price: 82.10, yield: 3.45, spread: 72, lastUpdated: '2026-02-18T09:28:00Z' },
  { bond: 'AMZN 3.15 08/22/2027', isin: 'US023135BT22', price: 99.50, yield: 3.25, spread: 55, lastUpdated: '2026-02-18T09:25:00Z' },
  { bond: 'DB 4.10 01/13/2026', isin: 'DE000DL19VR6', price: 100.15, yield: 3.95, spread: 120, lastUpdated: '2026-02-17T16:00:00Z' },
  { bond: 'HSBA 3.95 05/18/2030', isin: 'XS2342543210', price: 97.80, yield: 4.25, spread: 95, lastUpdated: '2026-02-18T08:45:00Z' },
  { bond: 'TM 2.00 10/15/2029', isin: 'US892331AZ12', price: 96.40, yield: 2.75, spread: 38, lastUpdated: '2026-02-18T06:00:00Z' },
  { bond: 'BNP 3.375 01/09/2028', isin: 'FR0014003N87', price: 98.90, yield: 3.55, spread: 82, lastUpdated: '2026-02-18T09:15:00Z' },
  { bond: 'GS 3.50 11/16/2026', isin: 'US38141GXK39', price: 99.80, yield: 3.55, spread: 65, lastUpdated: '2026-02-18T09:32:00Z' },
]

// ── Column Definitions ──────────────────────────────────────────────────────

const issuanceCols: ColDef[] = [
  { field: 'issuer', headerName: 'Issuer', flex: 2 },
  { field: 'ticker', headerName: 'Ticker', flex: 1 },
  { field: 'dealSize', headerName: 'Deal Size (M)', flex: 1, type: 'numericColumn' },
  { field: 'currency', headerName: 'Currency', flex: 1 },
  { field: 'pricingDate', headerName: 'Pricing Date', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
]

const allocationCols: ColDef[] = [
  { field: 'deal', headerName: 'Deal', flex: 2 },
  { field: 'investor', headerName: 'Investor', flex: 2 },
  { field: 'amount', headerName: 'Amount (M)', flex: 1, type: 'numericColumn' },
  { field: 'allocationPct', headerName: 'Allocation %', flex: 1, type: 'numericColumn' },
  { field: 'status', headerName: 'Status', flex: 1 },
]

const secondaryCols: ColDef[] = [
  { field: 'bond', headerName: 'Bond', flex: 2 },
  { field: 'isin', headerName: 'ISIN', flex: 1.5 },
  { field: 'price', headerName: 'Price', flex: 1, type: 'numericColumn' },
  { field: 'yield', headerName: 'Yield', flex: 1, type: 'numericColumn' },
  { field: 'spread', headerName: 'Spread (bps)', flex: 1, type: 'numericColumn' },
  { field: 'lastUpdated', headerName: 'Last Updated', flex: 1.5 },
]

const myDataCols: ColDef[] = [
  { field: 'name', headerName: 'Name', flex: 2 },
  { field: 'type', headerName: 'Type', flex: 1 },
  { field: 'uploaded', headerName: 'Uploaded', flex: 1.5 },
  { field: 'rows', headerName: 'Rows', flex: 1, type: 'numericColumn' },
]

// ── Tab Definitions ─────────────────────────────────────────────────────────

interface TabConfig {
  id: string
  label: string
  colDefs: ColDef[]
  data: Record<string, unknown>[]
  requiresService?: string
}

const tabs: TabConfig[] = [
  { id: 'issuance', label: 'Issuance Data', colDefs: issuanceCols, data: issuanceData },
  { id: 'allocations', label: 'Allocations', colDefs: allocationCols, data: allocationsData },
  { id: 'secondary', label: 'Secondary Data', colDefs: secondaryCols, data: secondaryData },
  { id: 'bloomberg', label: 'Bloomberg', colDefs: secondaryCols, data: [], requiresService: 'bloomberg' },
  { id: 'mydata', label: 'My Data', colDefs: myDataCols, data: [] },
]

// ── Components ──────────────────────────────────────────────────────────────

interface MyDataFile {
  name: string
  type: string
  uploaded: string
  rows: number
}

function MyDataUpload({
  files,
  onUpload,
}: {
  files: MyDataFile[]
  onUpload: (file: File) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" asChild>
            <span>
              <UploadIcon className="size-4" />
              Upload Data
            </span>
          </Button>
        </label>
      </div>
      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3 max-w-xs">
            <UploadIcon className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No custom data yet. Upload a CSV, Excel, or JSON file to get started.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function DataLayerPage() {
  const { services } = useServices()
  const { theme } = useTheme()
  const gridTheme = useMemo(() => buildGridTheme(theme), [theme])
  const [activeTab, setActiveTab] = useState('issuance')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [myDataFiles, setMyDataFiles] = useState<MyDataFile[]>([])

  const bloombergConnected = services.find((s) => s.id === 'bloomberg')?.connected ?? false

  const activeTabConfig = tabs.find((t) => t.id === activeTab)!

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    filter: true,
    sortable: true,
    resizable: true,
  }), [])

  const isTabDisabled = (tab: TabConfig) => {
    if (!tab.requiresService) return false
    const svc = services.find((s) => s.id === tab.requiresService)
    return !svc?.connected
  }

  const handleFileUpload = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const typeMap: Record<string, string> = { csv: 'CSV', xlsx: 'Excel', xls: 'Excel', json: 'JSON' }
    setMyDataFiles((prev) => [
      ...prev,
      {
        name: file.name,
        type: typeMap[ext] ?? ext.toUpperCase(),
        uploaded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rows: Math.floor(Math.random() * 5000) + 100,
      },
    ])
  }

  // Build row data — for My Data tab, use the uploaded files list
  const rowData = activeTab === 'mydata' ? myDataFiles : activeTabConfig.data

  // Apply status filter client-side (only for tabs that have a status column)
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return rowData
    return rowData.filter((row) => {
      const status = (row as Record<string, unknown>).status
      if (!status) return true
      return (status as string).toLowerCase() === statusFilter.toLowerCase()
    })
  }, [rowData, statusFilter])

  // Collect unique statuses from active tab data for the filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    activeTabConfig.data.forEach((row) => {
      const s = (row as Record<string, unknown>).status
      if (typeof s === 'string') statuses.add(s)
    })
    return Array.from(statuses)
  }, [activeTabConfig])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top bar: search + filters */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search across all columns..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        {availableStatuses.length > 0 && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {availableStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b shrink-0 overflow-x-auto">
        {tabs.map((tab) => {
          const disabled = isTabDisabled(tab)
          const active = activeTab === tab.id

          if (disabled) {
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground/50 cursor-not-allowed"
                  >
                    <LockIcon className="size-3" />
                    {tab.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Connect {tab.label} in Settings to enable
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setStatusFilter('all')
              }}
              className={cn(
                'inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.id === 'mydata' && myDataFiles.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                  {myDataFiles.length}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Grid / Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'mydata' && myDataFiles.length === 0 ? (
          <MyDataUpload files={myDataFiles} onUpload={handleFileUpload} />
        ) : activeTab === 'bloomberg' && !bloombergConnected ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="flex flex-col items-center gap-3 max-w-xs">
              <LockIcon className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Connect to Bloomberg in Settings to view live market data.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full">
            {activeTab === 'mydata' && (
              <div className="px-4 py-2 border-b">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileUpload(f)
                      e.target.value = ''
                    }}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <UploadIcon className="size-4" />
                      Upload More
                    </span>
                  </Button>
                </label>
              </div>
            )}
            <AgGridReact
              theme={gridTheme}
              rowData={filteredData}
              columnDefs={activeTabConfig.id === 'mydata' ? myDataCols : activeTabConfig.colDefs}
              defaultColDef={defaultColDef}
              quickFilterText={searchText}
              animateRows={false}
              domLayout="normal"
            />
          </div>
        )}
      </div>
    </div>
  )
}
