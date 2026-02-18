import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ServiceConnection {
  id: string
  name: string
  description: string
  connected: boolean
}

interface ServicesContextValue {
  services: ServiceConnection[]
  connect: (serviceId: string) => void
  disconnect: (serviceId: string) => void
}

const ServicesContext = createContext<ServicesContextValue | null>(null)

const initialServices: ServiceConnection[] = [
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    description: 'Market data, analytics and news',
    connected: false,
  },
]

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState(initialServices)

  const connect = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, connected: true } : s)),
    )
  }

  const disconnect = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, connected: false } : s)),
    )
  }

  return (
    <ServicesContext value={{ services, connect, disconnect }}>
      {children}
    </ServicesContext>
  )
}

export function useServices() {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within ServicesProvider')
  return ctx
}
