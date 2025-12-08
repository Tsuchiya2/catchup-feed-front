/**
 * PageHeader Component
 *
 * A reusable page header component with title, optional description, and optional action.
 * Used at the top of pages to provide consistent styling and layout.
 * Features cyber/tech theme with glow effects.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the PageHeader component
 */
interface PageHeaderProps {
  /** The main title of the page */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional action element (e.g., button) on the right side */
  action?: React.ReactNode;
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * PageHeader displays a page title with optional description and action.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Articles"
 *   description="Browse all articles from your sources"
 *   action={<Button>Add Source</Button>}
 * />
 * ```
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex-1">
        <h1 className="text-glow-sm text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
