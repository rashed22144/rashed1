import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const AlertCtx = createContext(null);

export function AlertDialog({ open, onOpenChange, children }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setOpen = (val) => {
        if (!isControlled) setInternalOpen(val);
        if (onOpenChange) onOpenChange(val);
    };

    return <AlertCtx.Provider value={{ open: isOpen, setOpen }}>{children}</AlertCtx.Provider>;
}

export function AlertDialogTrigger({ asChild, children }) {
    const ctx = useContext(AlertCtx);
    const onClick = (e) => {
        children.props?.onClick?.(e);
        if (!e.defaultPrevented) ctx.setOpen(true);
    };
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}

export function AlertDialogContent({ className, children }) {
    const ctx = useContext(AlertCtx);
    if (!ctx.open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={cn('relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl', className)}>
                {children}
            </div>
        </div>
    );
}

export function AlertDialogHeader({ className, ...props }) {
    return <div className={cn('mb-3 space-y-1.5', className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }) {
    return <h2 className={cn('text-lg font-bold text-gray-900', className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
    return <p className={cn('text-sm text-gray-500', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
    return <div className={cn('mt-5 flex justify-end gap-2', className)} {...props} />;
}

export function AlertDialogCancel({ className, onClick, ...props }) {
    const ctx = useContext(AlertCtx);
    return (
        <button
            type="button"
            onClick={(e) => { onClick?.(e); ctx.setOpen(false); }}
            className={cn('rounded-xl border border-gray-200 px-4 h-10 text-sm font-medium hover:bg-gray-50', className)}
            {...props}
        />
    );
}

export function AlertDialogAction({ className, onClick, ...props }) {
    const ctx = useContext(AlertCtx);
    return (
        <button
            type="button"
            onClick={(e) => { onClick?.(e); }}
            className={cn('rounded-xl bg-red-600 text-white px-4 h-10 text-sm font-bold hover:bg-red-700', className)}
            {...props}
        />
    );
}
