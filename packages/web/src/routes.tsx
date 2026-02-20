import { MessageSquareIcon, FileTextIcon, DatabaseIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'

export interface RouteConfig {
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
  page: LazyExoticComponent<ComponentType> | ComponentType
  /** Optional sidebar component rendered alongside the page. */
  sidebar?: LazyExoticComponent<ComponentType> | ComponentType
}

/**
 * Add new apps here. The railbar and router are generated from this list.
 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    label: 'Chat',
    icon: MessageSquareIcon,
    page: lazy(() => import('./pages/chat')),
    sidebar: lazy(() => import('./components/chat-sidebar')),
  },
  {
    path: '/content-update/:id?',
    label: 'Content Update',
    icon: FileTextIcon,
    page: lazy(() => import('./pages/content-update')),
  },
  {
    path: '/data-layer',
    label: 'Data Layer',
    icon: DatabaseIcon,
    page: lazy(() => import('./pages/data-layer')),
  },
]
