import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-200 text-gray-700 bg-transparent',
    destructive: 'bg-red-600 text-white',
};

export const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
    <span
        ref={ref}
        className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
            VARIANTS[variant] || VARIANTS.default,
            className
        )}
        {...props}
    />
));
Badge.displayName = 'Badge';
