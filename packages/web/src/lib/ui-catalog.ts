import { createCatalog, generateCatalogPrompt, ActionSchema } from '@json-render/core';
import { z } from 'zod';

/**
 * UI Component Catalog for Generative UI
 *
 * This catalog defines all available components that the AI can generate,
 * with Zod schemas for validation.
 */
export const uiCatalog = createCatalog({
  name: 'chat-ui',
  components: {
    // Layout Components
    Card: {
      props: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
      }),
      hasChildren: true,
      description: 'Container card for content sections',
    },
    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).default(2),
        gap: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      hasChildren: true,
      description: 'Grid layout for arranging children in columns',
    },
    Stack: {
      props: z.object({
        direction: z.enum(['horizontal', 'vertical']).default('vertical'),
        gap: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      hasChildren: true,
      description: 'Flex stack for linear layouts',
    },

    // Data Display Components
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        format: z.enum(['currency', 'percent', 'number', 'text']).optional(),
        trend: z.enum(['up', 'down', 'neutral']).optional(),
        trendValue: z.string().optional(),
      }),
      description: 'Displays a single metric with optional trend indicator',
    },
    Table: {
      props: z.object({
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          format: z.enum(['text', 'number', 'currency', 'date']).optional(),
        })),
        data: z.array(z.record(z.string(), z.unknown())),
        striped: z.boolean().optional(),
      }),
      description: 'Data table with columns and rows',
    },
    Chart: {
      props: z.object({
        type: z.enum(['bar', 'line', 'pie', 'area']),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
          color: z.string().optional(),
        })),
        title: z.string().optional(),
        height: z.number().optional(),
      }),
      description: 'Chart visualization (bar, line, pie, or area)',
    },
    Progress: {
      props: z.object({
        value: z.number().min(0).max(100),
        label: z.string().optional(),
        showValue: z.boolean().optional(),
      }),
      description: 'Progress bar indicator',
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'secondary', 'destructive', 'outline']).optional(),
      }),
      description: 'Small status badge',
    },

    // Interactive Components
    Button: {
      props: z.object({
        label: z.string(),
        action: ActionSchema,
        variant: z.enum(['default', 'secondary', 'destructive', 'outline', 'ghost']).optional(),
        size: z.enum(['default', 'sm', 'lg']).optional(),
      }),
      description: 'Clickable button that triggers an action',
    },

    // Feedback Components
    Alert: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
        variant: z.enum(['default', 'destructive']).optional(),
      }),
      description: 'Alert message box',
    },

    // Content Components
    Text: {
      props: z.object({
        content: z.string(),
        variant: z.enum(['p', 'h1', 'h2', 'h3', 'muted', 'lead']).optional(),
      }),
      description: 'Text content with styling',
    },
    Image: {
      props: z.object({
        src: z.string(),
        alt: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
      description: 'Image display',
    },
    Divider: {
      props: z.object({
        orientation: z.enum(['horizontal', 'vertical']).optional(),
      }),
      description: 'Visual separator',
    },
    List: {
      props: z.object({
        items: z.array(z.object({
          label: z.string(),
          value: z.string().optional(),
          icon: z.string().optional(),
        })),
        ordered: z.boolean().optional(),
      }),
      description: 'List of items',
    },

    // Form/Filter Components
    FilterPanel: {
      props: z.object({
        title: z.string().optional(),
        filters: z.array(z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(['text', 'select', 'date', 'dateRange', 'checkbox', 'number']),
          placeholder: z.string().optional(),
          options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
          value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
        })),
        activeFilters: z.record(z.string(), z.unknown()).optional(),
      }),
      description: 'Filter panel with various input types for querying/filtering data',
    },

    // Document Components
    DocumentPreview: {
      props: z.object({
        title: z.string(),
        type: z.enum(['invoice', 'report', 'letter', 'contract', 'receipt', 'custom']),
        status: z.enum(['draft', 'final', 'pending']).optional(),
        sections: z.array(z.object({
          heading: z.string().optional(),
          content: z.string(),
          type: z.enum(['text', 'table', 'list', 'signature']).optional(),
        })),
        metadata: z.record(z.string(), z.string()).optional(),
      }),
      description: 'Document preview with sections, metadata, and action buttons',
    },
  },

  actions: {
    refresh: {
      description: 'Refresh the current data'
    },
    export: {
      params: z.object({ format: z.enum(['csv', 'json', 'pdf']) }),
      description: 'Export data in specified format'
    },
    navigate: {
      params: z.object({ url: z.string() }),
      description: 'Navigate to a URL'
    },
    copy: {
      params: z.object({ text: z.string() }),
      description: 'Copy text to clipboard'
    },
    submit: {
      params: z.object({ data: z.record(z.string(), z.unknown()) }),
      description: 'Submit form data',
    },
    applyFilter: {
      params: z.object({ filters: z.record(z.string(), z.unknown()) }),
      description: 'Apply filter criteria to query data',
    },
    clearFilters: {
      description: 'Clear all active filters',
    },
    downloadDocument: {
      params: z.object({ format: z.enum(['pdf', 'docx', 'txt']) }),
      description: 'Download document in specified format',
    },
    printDocument: {
      description: 'Print the document',
    },
  },

  validation: 'strict',
});

// Generate prompt for AI (to be used in backend system prompts)
export const catalogPrompt = generateCatalogPrompt(uiCatalog);

// Type helper for component props
export type CatalogComponentProps = {
  Card: { title?: string; description?: string };
  Grid: { columns?: number; gap?: 'sm' | 'md' | 'lg' };
  Stack: { direction?: 'horizontal' | 'vertical'; gap?: 'sm' | 'md' | 'lg' };
  Metric: {
    label: string;
    value: string | number;
    format?: 'currency' | 'percent' | 'number' | 'text';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  };
  Table: {
    columns: Array<{ key: string; label: string; format?: 'text' | 'number' | 'currency' | 'date' }>;
    data: Array<Record<string, unknown>>;
    striped?: boolean;
  };
  Chart: {
    type: 'bar' | 'line' | 'pie' | 'area';
    data: Array<{ label: string; value: number; color?: string }>;
    title?: string;
    height?: number;
  };
  Progress: { value: number; label?: string; showValue?: boolean };
  Badge: { text: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' };
  Button: {
    label: string;
    action: { name: string; params?: Record<string, unknown> };
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
  };
  Alert: { title: string; description?: string; variant?: 'default' | 'destructive' };
  Text: { content: string; variant?: 'p' | 'h1' | 'h2' | 'h3' | 'muted' | 'lead' };
  Image: { src: string; alt: string; width?: number; height?: number };
  Divider: { orientation?: 'horizontal' | 'vertical' };
  List: {
    items: Array<{ label: string; value?: string; icon?: string }>;
    ordered?: boolean;
  };
  FilterPanel: {
    title?: string;
    filters: Array<{
      id: string;
      label: string;
      type: 'text' | 'select' | 'date' | 'dateRange' | 'checkbox' | 'number';
      placeholder?: string;
      options?: Array<{ label: string; value: string }>;
      value?: string | number | boolean | string[];
    }>;
    activeFilters?: Record<string, unknown>;
  };
  DocumentPreview: {
    title: string;
    type: 'invoice' | 'report' | 'letter' | 'contract' | 'receipt' | 'custom';
    status?: 'draft' | 'final' | 'pending';
    sections: Array<{
      heading?: string;
      content: string;
      type?: 'text' | 'table' | 'list' | 'signature';
    }>;
    metadata?: Record<string, string>;
  };
};
