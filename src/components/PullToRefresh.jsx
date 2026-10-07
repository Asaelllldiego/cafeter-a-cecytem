import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Native-like pull-to-refresh wrapper for touch devices.
 * Detects a downward pull when the page is scrolled to the top,
 * shows a spinner, and calls `onRefresh` (async) when released past the threshold.
 */
export default function PullToRefresh({ onRefresh, children, className }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY <= 0) {
      e.preventDefault();
      setPull(Math.min(dy * 0.5, 80));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > 50) {
      setRefreshing(true);
      setPull(60);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const moving = pulling.current && !refreshing;
  return (
    <div ref={containerRef} className={cn('relative min-h-[60vh]', className)}>
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 grid place-items-center transition-opacity"
        style={{
          top: refreshing ? 16 : Math.max(pull - 16, -40),
          opacity: pull > 10 || refreshing ? 1 : 0,
        }}
      >
        <Loader2 className={cn('w-6 h-6 text-brand', (refreshing || pull > 10) && 'animate-spin')} />
      </div>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: moving ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}