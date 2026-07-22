import React from 'react';
import { cn } from '@/lib/utils';

const VARIANTS = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'hover:bg-gray-100 text-gray-700',
    link: 'text-blue-600 underline-offset-4 hover:underline',
};

const SIZES = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 rounded-lg px-3 text-xs',
    lg: 'h-11 rounded-xl px-8 text-base',
    icon: 'h-9 w-9',
};

export const Button = React.forwardRef(
    ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
        const classes = cn(
            'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
            VARIANTS[variant] || VARIANTS.default,
            SIZES[size] || SIZES.default,
            className
        );

        // دعم asChild: نطبق نفس الأصناف على العنصر الابن الوحيد (مثل <Link>) بدل عمل <button> إضافي
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children, {
                className: cn(classes, children.props.className),
                ref,
                ...props,
            });
        }

        return (
            <button ref={ref} className={classes} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
