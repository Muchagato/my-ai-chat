import type { ComponentRegistry, ComponentRenderProps } from '@json-render/react';
import type { Action } from '@json-render/core';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
} from 'lucide-react';
import type { CatalogComponentProps } from './ui-catalog';

// Gap mapping for consistent spacing
const gapMap = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };

// Column mapping for grid
const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

/**
 * Component Registry mapping catalog types to React components
 */
export const componentRegistry: ComponentRegistry = {
  // ============================================
  // Layout Components
  // ============================================
  Card: ({ element, children }: ComponentRenderProps<CatalogComponentProps['Card']>) => (
    <Card className="w-full">
      {(element.props.title || element.props.description) && (
        <CardHeader>
          {element.props.title && <CardTitle>{element.props.title}</CardTitle>}
          {element.props.description && (
            <CardDescription>{element.props.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  ),

  Grid: ({ element, children }: ComponentRenderProps<CatalogComponentProps['Grid']>) => (
    <div
      className={cn(
        'grid w-full',
        colsMap[element.props.columns || 2],
        gapMap[element.props.gap || 'md']
      )}
    >
      {children}
    </div>
  ),

  Stack: ({ element, children }: ComponentRenderProps<CatalogComponentProps['Stack']>) => (
    <div
      className={cn(
        'flex w-full',
        element.props.direction === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        gapMap[element.props.gap || 'md']
      )}
    >
      {children}
    </div>
  ),

  // ============================================
  // Data Display Components
  // ============================================
  Metric: ({ element }: ComponentRenderProps<CatalogComponentProps['Metric']>) => {
    const { label, value, format, trend, trendValue } = element.props;

    const formatValue = (val: string | number) => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(Number(val));
      }
      if (format === 'percent') return `${val}%`;
      if (format === 'number') return Number(val).toLocaleString();
      return val;
    };

    const TrendIcon =
      trend === 'up'
        ? TrendingUpIcon
        : trend === 'down'
          ? TrendingDownIcon
          : MinusIcon;

    const trendColor =
      trend === 'up'
        ? 'text-green-600'
        : trend === 'down'
          ? 'text-red-600'
          : 'text-muted-foreground';

    return (
      <div className="flex flex-col space-y-1 p-3 rounded-lg bg-muted/30">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatValue(value)}</span>
          {trend && (
            <span className={cn('flex items-center text-sm', trendColor)}>
              <TrendIcon className="size-4 mr-1" />
              {trendValue}
            </span>
          )}
        </div>
      </div>
    );
  },

  Table: ({ element }: ComponentRenderProps<CatalogComponentProps['Table']>) => {
    const { columns, data, striped } = element.props;

    const formatCell = (
      value: unknown,
      format?: 'text' | 'number' | 'currency' | 'date'
    ) => {
      if (value === null || value === undefined) return '-';
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
      }
      if (format === 'number') return Number(value).toLocaleString();
      if (format === 'date') {
        return new Date(String(value)).toLocaleDateString();
      }
      return String(value);
    };

    return (
      <div className="w-full overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-left font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'border-t border-border/50',
                  striped && i % 2 === 1 && 'bg-muted/30'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2">
                    {formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  Chart: ({ element }: ComponentRenderProps<CatalogComponentProps['Chart']>) => {
    const { type, data, title, height = 200 } = element.props;
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    // Bar chart
    if (type === 'bar') {
      return (
        <div className="w-full space-y-3">
          {title && <h4 className="font-medium text-sm">{title}</h4>}
          <div className="space-y-2" style={{ maxHeight: height }}>
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-20 text-sm text-muted-foreground truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded transition-all duration-500"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="w-16 text-sm text-right font-medium">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Pie chart (simple representation)
    if (type === 'pie') {
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const colors = [
        'bg-primary',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
      ];

      return (
        <div className="w-full space-y-3">
          {title && <h4 className="font-medium text-sm">{title}</h4>}
          <div className="flex items-center gap-4">
            {/* Pie visualization as stacked bar */}
            <div className="flex-1 h-8 rounded-full overflow-hidden flex">
              {data.map((item, i) => (
                <div
                  key={i}
                  className={cn(colors[i % colors.length])}
                  style={{
                    width: `${(item.value / total) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className={cn('w-3 h-3 rounded-full', colors[i % colors.length])}
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Line/Area chart (simple visualization)
    if (type === 'line' || type === 'area') {
      return (
        <div className="w-full space-y-3">
          {title && <h4 className="font-medium text-sm">{title}</h4>}
          <div
            className="relative w-full border-l border-b border-border"
            style={{ height }}
          >
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1="0"
                  y1={`${ratio * 100}%`}
                  x2="100%"
                  y2={`${ratio * 100}%`}
                  className="stroke-border"
                  strokeDasharray="4"
                />
              ))}
              {/* Line path */}
              <polyline
                fill={type === 'area' ? 'currentColor' : 'none'}
                className={cn(
                  type === 'area' ? 'text-primary/20' : '',
                  'stroke-primary stroke-2'
                )}
                points={data
                  .map((d, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - (d.value / maxValue) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
              />
              {/* Data points */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - (d.value / maxValue) * 100;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    className="fill-primary"
                  />
                );
              })}
            </svg>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {data.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="text-muted-foreground p-4 text-center">
        Chart type "{type}" is not supported
      </div>
    );
  },

  Progress: ({ element }: ComponentRenderProps<CatalogComponentProps['Progress']>) => (
    <div className="w-full space-y-1">
      {(element.props.label || element.props.showValue) && (
        <div className="flex justify-between text-sm">
          {element.props.label && <span>{element.props.label}</span>}
          {element.props.showValue && (
            <span className="text-muted-foreground">{element.props.value}%</span>
          )}
        </div>
      )}
      <Progress value={element.props.value} />
    </div>
  ),

  Badge: ({ element }: ComponentRenderProps<CatalogComponentProps['Badge']>) => (
    <Badge variant={element.props.variant}>{element.props.text}</Badge>
  ),

  // ============================================
  // Interactive Components
  // ============================================
  Button: ({
    element,
    onAction,
  }: ComponentRenderProps<CatalogComponentProps['Button']>) => (
    <Button
      variant={element.props.variant}
      size={element.props.size}
      onClick={() => onAction?.(element.props.action as Action)}
    >
      {element.props.label}
    </Button>
  ),

  // ============================================
  // Feedback Components
  // ============================================
  Alert: ({ element }: ComponentRenderProps<CatalogComponentProps['Alert']>) => (
    <Alert variant={element.props.variant}>
      {element.props.variant === 'destructive' ? (
        <AlertCircleIcon className="size-4" />
      ) : (
        <InfoIcon className="size-4" />
      )}
      <AlertTitle>{element.props.title}</AlertTitle>
      {element.props.description && (
        <AlertDescription>{element.props.description}</AlertDescription>
      )}
    </Alert>
  ),

  // ============================================
  // Content Components
  // ============================================
  Text: ({ element }: ComponentRenderProps<CatalogComponentProps['Text']>) => {
    const { content, variant = 'p' } = element.props;
    const classMap: Record<string, string> = {
      p: 'text-base',
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-medium',
      muted: 'text-sm text-muted-foreground',
      lead: 'text-lg text-muted-foreground',
    };
    return <p className={classMap[variant]}>{content}</p>;
  },

  Image: ({ element }: ComponentRenderProps<CatalogComponentProps['Image']>) => (
    <img
      src={element.props.src}
      alt={element.props.alt}
      width={element.props.width}
      height={element.props.height}
      className="rounded-md max-w-full object-cover"
    />
  ),

  Divider: ({ element }: ComponentRenderProps<CatalogComponentProps['Divider']>) => (
    <Separator orientation={element.props.orientation} />
  ),

  List: ({ element }: ComponentRenderProps<CatalogComponentProps['List']>) => {
    const { items, ordered } = element.props;
    const ListTag = ordered ? 'ol' : 'ul';

    return (
      <ListTag className={cn('space-y-2', ordered ? 'list-decimal pl-4' : 'list-none')}>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {!ordered && <CheckCircleIcon className="size-4 text-primary shrink-0" />}
            <span className="flex-1">{item.label}</span>
            {item.value && (
              <span className="text-muted-foreground">{item.value}</span>
            )}
          </li>
        ))}
      </ListTag>
    );
  },
};
