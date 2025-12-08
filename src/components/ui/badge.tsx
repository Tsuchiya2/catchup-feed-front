import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 hover:shadow-glow-sm',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success: 'border-green-500/50 bg-green-500/20 text-green-400 hover:bg-green-500/30',
        destructive:
          'border-destructive/50 bg-destructive/20 text-destructive hover:bg-destructive/30',
        outline: 'border-primary/30 text-foreground hover:border-primary/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
