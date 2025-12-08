import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function StatisticsCard({
  title,
  value,
  icon,
  isLoading = false,
  className,
}: StatisticsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-glow-sm text-2xl font-bold text-primary">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
