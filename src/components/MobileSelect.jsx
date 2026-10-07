import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select that renders as a Radix popover on desktop and as a vaul
 * bottom-sheet drawer on mobile, for a native picker feel.
 * options: [{ value, label }]
 */
export default function MobileSelect({ value, onValueChange, options, placeholder, className }) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const current = options.find((o) => o.value === value);
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-border bg-card text-[13px] text-foreground focus:outline-none focus:border-brand',
            className
          )}
        >
          <span className={cn(!current && 'text-muted-foreground')}>
            {current ? current.label : (placeholder || 'Selecciona')}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{placeholder || 'Selecciona una opción'}</DrawerTitle>
        </DrawerHeader>
        <div className="px-2 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[60vh] overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onValueChange(o.value)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-[14px] text-left mb-1',
                o.value === value ? 'bg-brand-light text-brand' : 'text-foreground hover:bg-muted'
              )}
            >
              {o.label}
              {o.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}