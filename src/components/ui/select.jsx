import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectCtx = createContext(null);

export function Select({ value, onValueChange, defaultValue, children, disabled }) {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const currentValue = value !== undefined ? value : internalValue;
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectValue = (val) => {
        if (value === undefined) setInternalValue(val);
        if (onValueChange) onValueChange(val);
        setOpen(false);
    };

    return (
        <SelectCtx.Provider value={{ open, setOpen, value: currentValue, selectValue, disabled }}>
            <div className="relative" ref={ref}>
                {children}
            </div>
        </SelectCtx.Provider>
    );
}

export const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
    const ctx = useContext(SelectCtx);
    return (
        <button
            ref={ref}
            type="button"
            disabled={ctx?.disabled}
            onClick={() => ctx.setOpen(!ctx.open)}
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50',
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
    );
});
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({ placeholder, children }) {
    const ctx = useContext(SelectCtx);
    if (ctx.value && children !== undefined) {
        return <span>{children}</span>;
    }
    return <span className={cn(!ctx.value && 'text-gray-400')}>{ctx.value || placeholder}</span>;
}

export function SelectContent({ children, className }) {
    const ctx = useContext(SelectCtx);
    if (!ctx.open) return null;
    return (
        <div
            className={cn(
                'absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg p-1',
                className
            )}
        >
            {children}
        </div>
    );
}

export function SelectItem({ value, children, className }) {
    const ctx = useContext(SelectCtx);
    const isSelected = ctx.value === value;
    return (
        <div
            onClick={() => ctx.selectValue(value)}
            className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-100',
                isSelected && 'bg-blue-50 text-blue-700 font-medium',
                className
            )}
        >
            <span>{children}</span>
            {isSelected && <Check className="h-4 w-4" />}
        </div>
    );
}
