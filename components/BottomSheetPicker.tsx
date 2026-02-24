import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

export interface PickerOption {
  label: string;
  value: number | string;
}

export interface PickerColumn {
  options: PickerOption[];
  value: number | string;
  onChange: (value: any) => void;
  suffix?: string;
}

interface BottomSheetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  columns: PickerColumn[];
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const PickerColumnView: React.FC<{ column: PickerColumn }> = ({ column }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Scroll to initial value
  useEffect(() => {
    // Don't force scroll if the user is currently interacting
    if (isScrolling.current) return;

    if (containerRef.current) {
      const index = column.options.findIndex(o => o.value === column.value);
      if (index !== -1) {
        const targetScrollTop = index * ITEM_HEIGHT;
        // Only force scroll if we are far off (prevents fighting with user scroll)
        if (Math.abs(containerRef.current.scrollTop - targetScrollTop) > ITEM_HEIGHT / 2) {
            containerRef.current.scrollTop = targetScrollTop;
        }
      }
    }
  }, [column.value, column.options]);

  const handleScroll = () => {
    // Mark as scrolling to block useEffect sync
    isScrolling.current = true;

    // Clear existing timeout for "scroll end" detection
    if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
    }
    
    // Set timeout to clear "isScrolling" flag after scroll stops
    scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        // Optional: Ensure final snap alignment here if needed, 
        // but CSS snap-y usually handles the visual part.
        // We can do a final value check here to be safe.
        if (containerRef.current) {
             const scrollTop = containerRef.current.scrollTop;
             const index = Math.round(scrollTop / ITEM_HEIGHT);
             const clampedIndex = Math.max(0, Math.min(index, column.options.length - 1));
             const option = column.options[clampedIndex];
             if (option && option.value !== column.value) {
                 column.onChange(option.value);
             }
        }
    }, 150);

    // Immediate update (throttled by rAF) for responsive UI
    requestAnimationFrame(() => {
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop;
            const index = Math.round(scrollTop / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(index, column.options.length - 1));
            
            const option = column.options[clampedIndex];
            if (option && option.value !== column.value) {
                column.onChange(option.value);
            }
        }
    });
  };

  return (
    <div className="flex-1 h-full relative z-10 overflow-hidden">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scrollbar-hide touch-pan-y"
        style={{ padding: `${(CONTAINER_HEIGHT - ITEM_HEIGHT) / 2}px 0` }}
      >
        {column.options.map((option) => (
          <div 
            key={option.value}
            onClick={() => {
                // Allow click to select
                const index = column.options.findIndex(o => o.value === option.value);
                if (containerRef.current) {
                    containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
                }
                column.onChange(option.value);
            }}
            className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-200 ${
              column.value === option.value 
                ? 'text-amber-400 font-bold text-lg scale-110' 
                : 'text-slate-500 text-sm opacity-60'
            }`}
          >
            {option.label}{column.suffix}
          </div>
        ))}
      </div>
    </div>
  );
};

const BottomSheetPicker: React.FC<BottomSheetPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  columns,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        ref={overlayRef}
        className="w-full max-w-md bg-slate-900 border-t border-slate-700 rounded-t-2xl shadow-2xl animate-slide-up pb-8 mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur rounded-t-2xl">
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-slate-200 font-bold text-sm tracking-wide">{title}</h3>
          <button 
            onClick={onConfirm}
            className="p-2 text-amber-500 hover:text-amber-400 transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Columns Container */}
        <div className="relative" style={{ height: CONTAINER_HEIGHT }}>
          {/* Selection Highlight Bar */}
          <div className="absolute top-1/2 left-0 w-full h-[40px] -translate-y-1/2 bg-slate-800/50 border-y border-slate-700/50 pointer-events-none z-0"></div>
          
          {/* Gradient Masks */}
          <div className="absolute top-0 left-0 w-full h-[80px] bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-[80px] bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-20"></div>

          <div className="flex h-full relative z-10">
            {columns.map((col, i) => (
                <PickerColumnView key={i} column={col} />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BottomSheetPicker;
