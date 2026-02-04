# Generative UI System

This document explains the generative UI implementation that allows AI tool calls to return rich, interactive UI components instead of raw JSON.

## Overview

The system enables Claude to respond with visual dashboards, tables, charts, and other UI components rendered directly in the chat. When a user asks "show me analytics" or "display a chart", the AI calls a tool that returns a **UI tree** - a declarative JSON structure that the frontend renders as interactive React components.

```
User Query → AI decides tool → Backend executes → Returns UI Tree → Frontend renders component
```

## What is a UI Tree?

A UI tree is a JSON structure that declaratively describes a component hierarchy. Instead of returning raw data, tools return this structure which the frontend interprets and renders.

### Structure

```json
{
  "_type": "ui-tree",
  "root": "dashboard",
  "elements": {
    "dashboard": {
      "key": "dashboard",
      "type": "Card",
      "props": { "title": "Analytics Dashboard" },
      "children": ["metrics-grid"]
    },
    "metrics-grid": {
      "key": "metrics-grid",
      "type": "Grid",
      "props": { "columns": 4 },
      "children": ["revenue", "users"]
    },
    "revenue": {
      "key": "revenue",
      "type": "Metric",
      "props": {
        "label": "Revenue",
        "value": 125000,
        "format": "currency",
        "trend": "up",
        "change": "+12.5%"
      }
    }
  }
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `_type` | Always `"ui-tree"` - used to identify this as a renderable UI structure |
| `root` | The key of the root element to start rendering from |
| `elements` | A flat map of all elements, keyed by their unique `key` |

### Element Structure

Each element in the `elements` map has:

| Field | Description |
|-------|-------------|
| `key` | Unique identifier for this element |
| `type` | Component type (e.g., `Card`, `Metric`, `Table`, `Chart`) |
| `props` | Properties passed to the component |
| `children` | Array of child element keys (optional) |

## Available Components

The component catalog defines what UI elements can be rendered:

### Layout Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Card` | `title`, `description`, `footer` | Container with optional header/footer |
| `Grid` | `columns` (1-6), `gap` | Responsive grid layout |
| `Stack` | `direction` (row/column), `gap`, `align`, `justify` | Flexbox container |

### Data Display

| Component | Props | Description |
|-----------|-------|-------------|
| `Metric` | `label`, `value`, `format`, `trend`, `change`, `icon` | Single KPI with optional trend indicator |
| `Table` | `columns`, `data`, `striped`, `hoverable` | Data table with headers |
| `Chart` | `type`, `data`, `xKey`, `yKey`, `title`, `height` | Bar, line, pie, or area chart |
| `Progress` | `value`, `max`, `label`, `showValue`, `variant` | Progress bar |
| `Badge` | `children`, `variant` | Status badge |

### Interactive

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `children`, `variant`, `size`, `action`, `actionParams` | Clickable button with action handler |

### Feedback

| Component | Props | Description |
|-----------|-------|-------------|
| `Alert` | `title`, `children`, `variant` | Alert box (info, success, warning, error) |

### Content

| Component | Props | Description |
|-----------|-------|-------------|
| `Text` | `children`, `variant`, `className` | Text with styling variants |
| `Image` | `src`, `alt`, `width`, `height`, `className` | Image element |
| `Divider` | `orientation`, `className` | Horizontal or vertical separator |

## How It Works

### 1. Backend Tool Execution

When the AI decides to call a tool, the backend executes it and builds a UI tree:

```python
# packages/api/app/ui_trees.py

def metric(key: str, label: str, value, format: str = None, trend: str = None, change: str = None):
    """Create a Metric element."""
    return {
        "key": key,
        "type": "Metric",
        "props": {
            "label": label,
            "value": value,
            "format": format,
            "trend": trend,
            "change": change,
        }
    }

def card(key: str, title: str, children: list, description: str = None):
    """Create a Card element."""
    return {
        "key": key,
        "type": "Card",
        "props": {"title": title, "description": description},
        "children": [c["key"] for c in children]
    }

def ui_tree(root_element: dict, *other_elements) -> dict:
    """Build a complete UI tree from elements."""
    elements = {}
    all_elements = [root_element] + list(other_elements)

    def collect(el):
        elements[el["key"]] = el
        for child_key in el.get("children", []):
            # Find child in all_elements and collect recursively
            ...

    collect(root_element)
    return {
        "_type": "ui-tree",
        "root": root_element["key"],
        "elements": elements
    }
```

### 2. Tool Returns UI Tree

The `execute_tool` function in `main.py` builds and returns UI trees:

```python
def execute_tool(tool_name: str, tool_input: dict) -> dict:
    if tool_name == "get_analytics_dashboard":
        # Build metrics
        revenue = metric("revenue", "Revenue", 125000, format="currency", trend="up", change="+12.5%")
        users = metric("users", "Active Users", 8420, trend="up", change="+5.2%")

        # Build grid containing metrics
        metrics_grid = grid("metrics-grid", [revenue, users], columns=2)

        # Wrap in card
        dashboard = card("dashboard", "Analytics Dashboard", [metrics_grid])

        # Return as UI tree
        return ui_tree(dashboard, metrics_grid, revenue, users)
```

### 3. Streaming Protocol

The UI tree is sent to the frontend via Server-Sent Events using the AI SDK v6 protocol:

```python
# Tool call events
yield {"type": "tool-input-start", "toolCallId": id, "toolName": name}
yield {"type": "tool-input-delta", "toolCallId": id, "inputTextDelta": "{}"}
yield {"type": "tool-input-available", "toolCallId": id, "toolName": name, "input": {}}

# Tool output with UI tree
yield {"type": "tool-output-available", "toolCallId": id, "output": ui_tree_dict}
```

### 4. Frontend Detection

The frontend checks if a tool output is a UI tree:

```typescript
// packages/web/src/components/ai-elements/ui-tree-renderer.tsx

export function isUITree(output: unknown): output is UITree {
  return (
    typeof output === 'object' &&
    output !== null &&
    '_type' in output &&
    (output as { _type: string })._type === 'ui-tree' &&
    'root' in output &&
    'elements' in output
  );
}
```

### 5. Rendering

When a UI tree is detected, it renders directly in chat (not in a collapsible):

```tsx
// packages/web/src/App.tsx

if (part.type.startsWith('tool-')) {
  const toolPart = part as ToolUIPart;

  // UI trees render directly in chat
  if (isUITree(toolPart.output)) {
    return <UITreeRenderer tree={toolPart.output} />;
  }

  // Regular tool output shows in collapsible
  return (
    <Tool>
      <ToolHeader ... />
      <ToolContent>
        <ToolOutput output={toolPart.output} />
      </ToolContent>
    </Tool>
  );
}
```

### 6. Component Registry

The `UITreeRenderer` uses `@json-render/react` with a component registry that maps type names to React components:

```typescript
// packages/web/src/lib/ui-registry.tsx

export const componentRegistry = createRegistry(catalog, {
  Card: ({ title, description, children }) => (
    <CardUI>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </CardUI>
  ),

  Metric: ({ label, value, format, trend, change }) => (
    <div className="p-4 rounded-lg border">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">
        {format === 'currency' ? `$${value.toLocaleString()}` : value}
      </p>
      {trend && (
        <p className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
          {change}
        </p>
      )}
    </div>
  ),

  // ... more components
});
```

## Available Tools

### get_analytics_dashboard

Shows a dashboard with business metrics.

**Input:**
```json
{"metrics": ["revenue", "users", "orders", "conversion"]}
```
All metrics are optional; defaults to showing all four.

**Triggers:** "show analytics", "show dashboard", "business metrics"

### show_data_table

Displays a data table.

**Input:**
```json
{"data_type": "users" | "orders", "title": "optional title"}
```

**Triggers:** "show users table", "list orders", "display data"

### show_chart

Renders a chart visualization.

**Input:**
```json
{"chart_type": "bar" | "line" | "pie" | "area", "title": "optional title"}
```

**Triggers:** "show a chart", "visualize data", "graph"

### show_status

Shows a system status panel with progress bar and alert.

**Input:**
```json
{}
```

**Triggers:** "system status", "show progress"

## Adding New Components

### 1. Define in Catalog

Add the component schema to `packages/web/src/lib/ui-catalog.ts`:

```typescript
export const catalog = defineCatalog({
  // ... existing components

  MyComponent: {
    schema: z.object({
      title: z.string(),
      items: z.array(z.string()),
    }),
    defaultProps: {
      items: [],
    },
  },
});
```

### 2. Register React Component

Add the renderer to `packages/web/src/lib/ui-registry.tsx`:

```typescript
export const componentRegistry = createRegistry(catalog, {
  // ... existing components

  MyComponent: ({ title, items, children }) => (
    <div className="my-component">
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      {children}
    </div>
  ),
});
```

### 3. Create Backend Helper

Add a helper function in `packages/api/app/ui_trees.py`:

```python
def my_component(key: str, title: str, items: list):
    return {
        "key": key,
        "type": "MyComponent",
        "props": {"title": title, "items": items}
    }
```

### 4. Use in Tools

Use the helper when building UI trees in `execute_tool`:

```python
def execute_tool(tool_name: str, tool_input: dict) -> dict:
    if tool_name == "my_tool":
        component = my_component("my-key", "Title", ["item1", "item2"])
        return ui_tree(component)
```

## Action Handlers

Interactive components like `Button` can trigger actions. The `UITreeRenderer` provides handlers:

```typescript
const actionHandlers = {
  refresh: async () => {
    // Re-fetch data
  },
  export: async ({ format }) => {
    // Export as JSON, CSV, etc.
  },
  copy: async ({ text }) => {
    await navigator.clipboard.writeText(text);
  },
  navigate: ({ url }) => {
    window.open(url, '_blank');
  },
};
```

Button elements specify actions in their props:

```json
{
  "type": "Button",
  "props": {
    "children": "Export",
    "action": "export",
    "actionParams": { "format": "json" }
  }
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  App.tsx                                                         │
│    └── isUITree(output) ?                                        │
│          ├── Yes → UITreeRenderer                                │
│          │           └── json-render Renderer                    │
│          │                 └── componentRegistry                 │
│          │                       ├── Card → <Card>               │
│          │                       ├── Metric → <Metric>           │
│          │                       ├── Table → <Table>             │
│          │                       └── ...                         │
│          └── No → ToolOutput (JSON in collapsible)               │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ SSE Stream
                              │ tool-output-available: {ui-tree}
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│  main.py                                                         │
│    └── execute_tool(name, input)                                 │
│          └── Returns UI tree dict                                │
│                                                                  │
│  ui_trees.py                                                     │
│    ├── metric(key, label, value, ...)                            │
│    ├── card(key, title, children, ...)                           │
│    ├── grid(key, children, columns)                              │
│    ├── table(key, columns, data)                                 │
│    ├── chart(key, type, data, ...)                               │
│    └── ui_tree(root, *elements) → {"_type": "ui-tree", ...}      │
└─────────────────────────────────────────────────────────────────┘
```

## File Reference

| File | Purpose |
|------|---------|
| `packages/web/src/lib/ui-catalog.ts` | Zod schemas defining available component types |
| `packages/web/src/lib/ui-registry.tsx` | Maps component types to React components |
| `packages/web/src/components/ai-elements/ui-tree-renderer.tsx` | Renders UI trees with action handlers |
| `packages/web/src/components/ai-elements/tool.tsx` | Tool output display (detects UI trees) |
| `packages/web/src/App.tsx` | Main chat UI, routes UI trees to renderer |
| `packages/api/app/ui_trees.py` | Python helpers for building UI trees |
| `packages/api/app/main.py` | Tool definitions and execution |
