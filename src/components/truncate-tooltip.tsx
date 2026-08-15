import { useLayoutEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Truncates its content with an ellipsis and only shows a tooltip with the
 * full text when the content is actually overflowing — never on text that
 * already fits. Use anywhere a select label, table cell, or card field can
 * grow long enough to clip (company/position names, free-text notes, etc).
 */
export function TruncateTooltip({
  children,
  className,
  tooltipText,
}: {
  children: React.ReactNode;
  className?: string;
  /** Overrides what the tooltip shows; defaults to `children`. */
  tooltipText?: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      // A disconnected node (e.g. the plain span right before it's swapped for
      // the Tooltip-wrapped one) reports 0x0 — ignore that instead of using it
      // to incorrectly reset an already-detected truncation.
      if (el.scrollWidth === 0 && el.clientWidth === 0) return;
      setTruncated(el.scrollWidth > el.clientWidth + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  if (!truncated) {
    return (
      <span ref={ref} className={cn('block truncate', className)}>
        {children}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span ref={ref} className={cn('block truncate', className)} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltipText ?? children}</TooltipContent>
    </Tooltip>
  );
}
