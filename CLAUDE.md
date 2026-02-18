# My AI Chat — Project Guide

> **Read this file at the start of every session.** Update it whenever a described feature changes.

## Overview

Full-stack AI chat application with a React frontend and Python FastAPI backend. Uses Claude/OpenAI APIs with support for generative UI components, tool calls, and streaming.

## Tech Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Monorepo | pnpm workspaces (`packages/*`)                             |
| Frontend | React 19, TypeScript 5.9, Vite 7, TailwindCSS 4, shadcn/ui |
| Backend  | Python FastAPI, Uvicorn, Anthropic SDK, OpenAI SDK         |
| AI       | AI SDK v5+ (`ai`, `@ai-sdk/react`), streaming protocol    |
| Icons    | lucide-react                                               |
| Toasts   | sonner (import `toast` from `'sonner'` anywhere)           |

**Package manager: pnpm** (never npm or yarn)

## Scripts

```bash
pnpm dev          # Run API + web concurrently
pnpm dev:web      # Web only (Vite)
pnpm dev:api      # API only (uvicorn on :8000)
pnpm build        # Build web
```

## Project Structure

```
my-ai-chat/
├── packages/
│   ├── web/                        # React frontend
│   │   └── src/
│   │       ├── main.tsx            # Entry point (ThemeProvider, Toaster, BrowserRouter)
│   │       ├── layout.tsx          # RootLayout: Railbar + collapsible sidebar + <Outlet>
│   │       ├── routes.tsx          # Route registry (single source of truth)
│   │       ├── index.css           # Tailwind + dark mode via `.dark` class
│   │       ├── pages/
│   │       │   ├── chat.tsx        # AI chat page (useChat, streaming, tool rendering)
│   │       │   ├── content-update.tsx  # Document automation table/workspace + preview
│   │       │   └── data-layer.tsx     # Data layer dashboard (AG Grid, tabbed data sources)
│   │       ├── components/
│   │       │   ├── sidebar.tsx     # Railbar (nav icons) + Settings dialog
│   │       │   ├── chat-sidebar.tsx    # Chat history sidebar (pinned + history)
│   │       │   ├── theme-provider.tsx  # ThemeProvider + useTheme hook
│   │       │   ├── ai-elements/   # 31 AI/chat UI components
│   │       │   ├── auth/          # auth-form.tsx
│   │       │   └── ui/            # 21 shadcn primitives
│   │       ├── hooks/
│   │       │   └── use-services.tsx  # ServicesProvider + useServices (shared connected services state)
│   │       └── lib/
│   │           ├── utils.ts       # cn() helper
│   │           ├── ui-catalog.ts  # UI component catalog
│   │           └── ui-registry.tsx # Dynamic UI rendering
│   └── api/                        # Python backend
│       ├── app/
│       │   ├── main.py            # FastAPI app + /api/chat endpoint
│       │   ├── auth.py            # Auth logic
│       │   └── ui_trees.py        # Generative UI tree definitions
│       ├── requirements.txt
│       └── .env
```

## Architecture Patterns

### Routing (routes.tsx)

Single registry that drives **both** the railbar nav and the router. To add a new page:

```tsx
// routes.tsx
{
  path: '/my-page',
  label: 'My Page',
  icon: SomeIcon,
  page: lazy(() => import('./pages/my-page')),
  sidebar: lazy(() => import('./components/my-sidebar')), // optional
}
```

The `RootLayout` in `layout.tsx` reads `routes` to:
1. Render the `<Railbar>` (left icon column, always visible)
2. Show the route's `sidebar` component (collapsible, 288px wide) if defined
3. Render the page via `<Outlet>`

### Theme (theme-provider.tsx)

- `ThemeProvider` wraps the app in `main.tsx`
- Toggles `.dark` class on `<html>`, persists to `localStorage`
- Use `useTheme()` → `{ theme, toggleTheme }`

### Toasts (sonner)

- `<Toaster>` is mounted in `main.tsx`
- Use anywhere: `import { toast } from 'sonner'` → `toast.success(...)`, `toast.error(...)`, etc.

### Railbar & Settings (sidebar.tsx)

The railbar has:
- **Top section**: Route icons from `routes` array
- **Bottom section**: Settings button (gear icon) + Theme toggle (sun/moon)

**Settings dialog** contains:
- **Profile**: Mock user info (name, email)
- **Appearance**: Theme toggle
- **Connected services**: List of external services (Bloomberg, etc.) — each with a Connect button that opens a credentials dialog (username + password)

### Chat Page (pages/chat.tsx)

- Uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport` pointing to `http://localhost:8000/api/chat`
- Renders message parts: text, reasoning, sources, tool calls (including generative UI via `ui-tree-renderer`)
- Has model selector (Sonnet 4, Opus 4, Haiku 3.5), web search toggle, file attachments
- Auth check on mount via `checkAuthStatus()`; shows `AuthForm` if unauthenticated

### Chat Sidebar (chat-sidebar.tsx)

- **Action buttons**: New chat, Favorite prompts
- **Pinned section**: Pinned chats with pin icon
- **History section**: Chat list with date labels
- Each chat item has a `...` dropdown menu (pin/unpin, rename, archive, delete)
- All data is currently mock

### Connected Services (hooks/use-services.tsx)

- `ServicesProvider` wraps the app in `main.tsx`
- `useServices()` → `{ services, connect, disconnect }`
- Used by sidebar Settings dialog and Data Layer page to check connection status (e.g., Bloomberg)

### Content Update Page (pages/content-update.tsx)

- Left panel: Table of automations (default) or workspace view (when a row is clicked)
- Clicking a row replaces the table with a configurable workspace (back button to return)
- Each automation defines its own `workspace` array of sections (`file-upload`, `settings`)
- Right panel: Document preview (placeholder)

### Data Layer Page (pages/data-layer.tsx)

- Dashboard for all data sources using AG Grid (`ag-grid-react`)
- **Tabs**: Issuance Data, Allocations, Secondary Data, Bloomberg (disabled when not connected), My Data (user uploads)
- Top bar: Global search (AG Grid `quickFilterText`), status filter dropdown, date range dropdown
- Bloomberg tab checks `useServices()` for connection status
- My Data tab allows file uploads (CSV, Excel, JSON) tracked in local state
- All data is currently mock

## UI Components (shadcn)

Available in `components/ui/`: alert, badge, button, button-group, card, carousel, collapsible, command, dialog, dropdown-menu, hover-card, input, input-group, progress, scroll-area, select, separator, sonner, table, textarea, tooltip.

To add new shadcn components: `pnpm dlx shadcn@latest add <component>`

## Backend (packages/api)

FastAPI app on port 8000. Key endpoints:
- `POST /api/chat` — Streaming chat endpoint (AI SDK protocol)
- Auth via cookies (`credentials: 'include'` on frontend)

Dependencies: fastapi, uvicorn, anthropic, openai, httpx, pydantic
