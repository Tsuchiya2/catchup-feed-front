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
        secondary: 'border-gray-600/50 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30',
        success:
          'border-[#00ffff]/50 bg-[#a0ffff]/20 text-[#a0ffff] shadow-[0_0_8px_#00ffff40] hover:bg-[#a0ffff]/30 hover:shadow-[0_0_12px_#00ffff60]',
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
