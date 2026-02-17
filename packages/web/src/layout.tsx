import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useState } from 'react'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { Railbar } from '@/components/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { routes } from '@/routes'
import { cn } from '@/lib/utils'

export function RootLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeRoute = routes.find((r) =>
    r.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(r.path)
  )
  const SidebarComponent = activeRoute?.sidebar

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen">
        <Railbar />

        {/* Collapsible sidebar panel */}
        {SidebarComponent && (
          <div
            className={cn(
              'relative shrink-0 border-r bg-sidebar transition-[width] duration-200 overflow-hidden',
              sidebarOpen ? 'w-72' : 'w-0 border-r-0'
            )}
          >
            <div className="w-72 h-full">
              <Suspense>
                <SidebarComponent />
              </Suspense>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0 h-full">
          {/* Toggle button for sidebar */}
          {SidebarComponent && (
            <div className="flex items-center px-2 py-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <PanelLeftCloseIcon className="size-4" />
                ) : (
                  <PanelLeftOpenIcon className="size-4" />
                )}
              </Button>
            </div>
          )}
          <div className="flex flex-1 flex-col min-h-0">
            <Outlet />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
