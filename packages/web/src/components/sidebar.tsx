import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { routes } from '@/routes'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function Railbar() {
  const location = useLocation()

  return (
    <nav className="flex h-full w-16 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex flex-col items-center gap-2 pt-4">
        {routes.map((route) => {
          const isActive =
            route.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(route.path)

          return (
            <Tooltip key={route.path}>
              <TooltipTrigger asChild>
                <Link
                  to={route.path}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/60'
                  )}
                >
                  <route.icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
                {route.label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </nav>
  )
}
