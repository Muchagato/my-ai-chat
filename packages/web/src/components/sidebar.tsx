import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MoonIcon,
  SunIcon,
  SettingsIcon,
  CheckIcon,
  UserIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { routes } from '@/routes'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/theme-provider'
import { toast } from 'sonner'
import { useServices, type ServiceConnection } from '@/hooks/use-services'

function ConnectServiceDialog({
  service,
  open,
  onOpenChange,
  onConnected,
}: {
  service: ServiceConnection
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    if (!username || !password) return
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      setUsername('')
      setPassword('')
      onConnected()
      onOpenChange(false)
      toast.success(`Connected to ${service.name}`)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect to {service.name}</DialogTitle>
          <DialogDescription>
            Enter your {service.name} credentials to connect.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`${service.name} username`}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={connecting || !username || !password}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { theme, toggleTheme } = useTheme()
  const { services, connect, disconnect } = useServices()
  const [connectingService, setConnectingService] =
    useState<ServiceConnection | null>(null)

  const handleConnected = (serviceId: string) => {
    connect(serviceId)
  }

  const handleDisconnect = (serviceId: string, name: string) => {
    disconnect(serviceId)
    toast(`Disconnected from ${name}`)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your profile, preferences, and connected services.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-2">
            {/* Profile section */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Profile</span>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">
                    john.doe@company.com
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Appearance */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Appearance</span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-1.5"
                >
                  {theme === 'dark' ? (
                    <SunIcon className="size-3.5" />
                  ) : (
                    <MoonIcon className="size-3.5" />
                  )}
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Connected Services */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Connected services</span>
              <div className="flex flex-col gap-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{service.name}</p>
                        {service.connected && (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-xs py-0"
                          >
                            <CheckIcon className="size-3" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                    {service.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDisconnect(service.id, service.name)
                        }
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setConnectingService(service)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {connectingService && (
        <ConnectServiceDialog
          service={connectingService}
          open={!!connectingService}
          onOpenChange={(open) => !open && setConnectingService(null)}
          onConnected={() => handleConnected(connectingService.id)}
        />
      )}
    </>
  )
}

export function Railbar() {
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
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
        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex size-10 items-center justify-center rounded-xl text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <SettingsIcon className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
