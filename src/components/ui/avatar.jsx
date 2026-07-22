import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export const Avatar = React.forwardRef(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
        {...props}
    />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef(({ className, src, alt = '', ...props }, ref) => {
    const [error, setError] = useState(false);
    if (!src || error) return null;
    return (
        <img
            ref={ref}
            src={src}
            alt={alt}
            onError={() => setError(true)}
            className={cn('aspect-square h-full w-full', className)}
            {...props}
        />
    );
});
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn('flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-600', className)}
        {...props}
    />
));
AvatarFallback.displayName = 'AvatarFallback';
