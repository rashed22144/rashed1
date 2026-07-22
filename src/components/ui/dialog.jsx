import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DialogCtx = createContext(null);

export function Dialog({ open, onOpenChange, children }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setOpen = (val) => {
        if (!isControlled) setInternalOpen(val);
        if (onOpenChange) onOpenChange(val);
    };

    return <DialogCtx.Provider value={{ open: isOpen, setOpen }}>{children}</DialogCtx.Provider>;
}

export function DialogTrigger({ asChild, children }) {
    const ctx = useContext(DialogCtx);
    const onClick = (e) => {
        children.props.onClick?.(e);
        ctx.setOpen(true);
    };
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}

export function DialogContent({ className, children, dir }) {
    const ctx = useContext(DialogCtx);
    if (!ctx.open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => ctx.setOpen(false)}>
            <div
                dir={dir}
                onClick={(e) => e.stopPropagation()}
                className={cn('relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl', className)}
            >
                <button
                    onClick={() => ctx.setOpen(false)}
                    className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-gray-700"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn('mb-4 space-y-1.5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
    return <h2 className={cn('text-lg font-bold text-gray-900', className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
    return <p className={cn('text-sm text-gray-500', className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
    return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />;
}
