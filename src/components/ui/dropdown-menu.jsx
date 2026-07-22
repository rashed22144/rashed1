import React, { createContext, useContext, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const DropdownCtx = createContext(null);

export function DropdownMenu({ children }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);

    return (
        <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
            <div className="relative inline-block" ref={triggerRef}>
                {children}
            </div>
        </DropdownCtx.Provider>
    );
}

export function DropdownMenuTrigger({ asChild, children }) {
    const ctx = useContext(DropdownCtx);
    const onClick = (e) => {
        e.stopPropagation();
        children.props?.onClick?.(e);
        ctx.setOpen(!ctx.open);
    };
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick });
    }
    return <button onClick={onClick}>{children}</button>;
}

// تعرض القائمة عبر Portal مباشرة بجسم الصفحة (document.body) عشان ما تنقص/تنحجب
// خلف أي عنصر أب فيه overflow-hidden (زي بطاقات الخدمات ذات الحواف المدورة)
export function DropdownMenuContent({ align = 'start', className, children }) {
    const ctx = useContext(DropdownCtx);
    const [position, setPosition] = useState(null);
    const contentRef = useRef(null);

    useLayoutEffect(() => {
        if (ctx.open && ctx.triggerRef.current) {
            const rect = ctx.triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 6,
                left: align === 'end' ? rect.right + window.scrollX : rect.left + window.scrollX,
                alignEnd: align === 'end',
            });
        }
    }, [ctx.open, ctx.triggerRef, align]);

    useEffect(() => {
        if (!ctx.open) return;
        const handleClickOutside = (e) => {
            const clickedTrigger = ctx.triggerRef.current && ctx.triggerRef.current.contains(e.target);
            const clickedContent = contentRef.current && contentRef.current.contains(e.target);
            if (!clickedTrigger && !clickedContent) ctx.setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ctx, ctx.open]);

    if (!ctx.open || !position) return null;

    return createPortal(
        <div
            ref={contentRef}
            style={{
                position: 'absolute',
                top: position.top,
                left: position.alignEnd ? undefined : position.left,
                right: position.alignEnd ? window.innerWidth - position.left : undefined,
            }}
            className={cn(
                'z-50 min-w-[160px] rounded-xl border border-gray-100 bg-white shadow-lg p-1',
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}

export function DropdownMenuItem({ className, onClick, onSelect, children, ...props }) {
    const ctx = useContext(DropdownCtx);
    const handleClick = (e) => {
        if (onSelect) onSelect(e);
        if (!e.defaultPrevented) {
            onClick?.(e);
            ctx.setOpen(false);
        }
    };
    return (
        <div
            onClick={handleClick}
            className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50', className)}
            {...props}
        >
            {children}
        </div>
    );
}
