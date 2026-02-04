'use client';

import { JSONUIProvider, Renderer } from '@json-render/react';
import type { UITree } from '@json-render/core';
import { componentRegistry } from '@/lib/ui-registry';

interface UITreeRendererProps {
  tree: UITree;
}

/**
 * Renders a UI tree structure using json-render
 *
 * This component wraps the json-render Renderer with necessary providers
 * and action handlers for interactive elements.
 */
export function UITreeRenderer({ tree }: UITreeRendererProps) {
  // Action handlers for interactive elements
  const actionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown> = {
    refresh: async () => {
      console.log('Refresh action triggered');
      // Could trigger a re-fetch or callback to parent
    },
    export: async ({ format }: { format?: string }) => {
      console.log('Export action:', format);
      // Implement export logic based on format
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(tree, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    navigate: ({ url }: { url?: string }) => {
      if (url) {
        window.open(url, '_blank');
      }
    },
    copy: async ({ text }: { text?: string }) => {
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    },
    submit: async ({ data }: { data?: Record<string, unknown> }) => {
      console.log('Submit action:', data);
      // Could send to API
    },
  };

  return (
    <JSONUIProvider
      registry={componentRegistry}
      actionHandlers={actionHandlers}
    >
      <Renderer
        tree={tree}
        registry={componentRegistry}
        fallback={({ element }) => (
          <div className="text-muted-foreground text-sm p-2 border border-dashed rounded">
            Unknown component: {element.type}
          </div>
        )}
      />
    </JSONUIProvider>
  );
}

/**
 * Type guard to check if an object is a UI tree structure
 */
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
