import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@revertdotdev/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                GET: 'border-transparent bg-[#052E16] text-[#4ADE80] shadow',
                POST: 'border-transparent bg-[#172554] text-[#93C5FD] shadow',
                PUT: 'border-transparent bg-[#431407] text-[#FDBA74] shadow',
            },
        },
        defaultVariants: {
            variant: 'GET',
        },
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };