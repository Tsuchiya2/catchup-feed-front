/**
 * DateRangePicker Component
 *
 * Date range selection with from/to inputs and quick range presets.
 * Used for filtering articles by date range.
 */

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DateRangePickerProps {
  /** Start date (YYYY-MM-DD) */
  fromDate: string | null;
  /** End date (YYYY-MM-DD) */
  toDate: string | null;
  /** Callback when date range changes */
  onChange: (fromDate: string | null, toDate: string | null) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable the inputs */
  disabled?: boolean;
}

/**
 * Quick range preset type
 */
type QuickRange = 'week' | 'month' | 'year';

/**
 * Calculate quick range dates
 */
function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getQuickRangeDates(range: QuickRange): { from: string; to: string } {
  const today = new Date();
  const to = formatDateToISO(today);
  let from: string;

  switch (range) {
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      from = formatDateToISO(weekAgo);
      break;
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      from = formatDateToISO(monthAgo);
      break;
    }
    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      from = formatDateToISO(yearAgo);
      break;
    }
  }

  return { from, to };
}

/**
 * DateRangePicker component
 *
 * @example
 * ```tsx
 * const [fromDate, setFromDate] = useState<string | null>(null);
 * const [toDate, setToDate] = useState<string | null>(null);
 *
 * <DateRangePicker
 *   fromDate={fromDate}
 *   toDate={toDate}
 *   onChange={(from, to) => {
 *     setFromDate(from);
 *     setToDate(to);
 *   }}
 * />
 * ```
 */
export function DateRangePicker({
  fromDate,
  toDate,
  onChange,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [error, setError] = React.useState<string | null>(null);

  const validateDateRange = React.useCallback((from: string | null, to: string | null): boolean => {
    if (from && to) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();
      if (toTime < fromTime) {
        setError('End date must be after start date');
        return false;
      }
    }
    setError(null);
    return true;
  }, []);

  const handleFromChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFrom = e.target.value || null;
      if (validateDateRange(newFrom, toDate)) {
        onChange(newFrom, toDate);
      }
    },
    [toDate, onChange, validateDateRange]
  );

  const handleToChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTo = e.target.value || null;
      if (validateDateRange(fromDate, newTo)) {
        onChange(fromDate, newTo);
      }
    },
    [fromDate, onChange, validateDateRange]
  );

  const handleQuickRange = React.useCallback(
    (range: QuickRange) => {
      const { from, to } = getQuickRangeDates(range);
      setError(null);
      onChange(from, to);
    },
    [onChange]
  );

  const handleClear = React.useCallback(() => {
    setError(null);
    onChange(null, null);
  }, [onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="from-date" className="text-sm font-medium">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate || ''}
            onChange={handleFromChange}
            disabled={disabled}
            className="w-full"
            aria-describedby={error ? 'date-error' : undefined}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="to-date" className="text-sm font-medium">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate || ''}
            onChange={handleToChange}
            disabled={disabled}
            className="w-full"
            aria-describedby={error ? 'date-error' : undefined}
          />
        </div>
      </div>

      {error && (
        <p id="date-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange('week')}
          disabled={disabled}
        >
          Last 7 Days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange('month')}
          disabled={disabled}
        >
          Last 30 Days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleQuickRange('year')}
          disabled={disabled}
        >
          This Year
        </Button>
        {(fromDate || toDate) && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
