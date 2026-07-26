import React, { useEffect, useRef, useState, useMemo } from 'react';
import { prepare, layout, PreparedText } from '../../../lib/pretext';

export interface ShrinkWrapTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  font?: string;
  className?: string;
  paddingX?: number;
}

export const ShrinkWrapText: React.FC<ShrinkWrapTextProps> = ({
  text,
  font = '14px Inter',
  className = '',
  paddingX = 0,
  children,
  style,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tightWidth, setTightWidth] = useState<number | null>(null);

  const prepared = useMemo<PreparedText | null>(() => {
    if (!text) return null;
    try {
      return prepare(text, font);
    } catch {
      return null;
    }
  }, [text, font]);

  useEffect(() => {
    if (!prepared || !containerRef.current) return;

    const computeTightWidth = () => {
      if (!containerRef.current || !prepared) return;
      const availableWidth = containerRef.current.parentElement?.clientWidth || 320;
      const result = layout(prepared, availableWidth, 20);
      if (result.lineCount === 1) {
        let low = 10;
        let high = availableWidth;
        let best = availableWidth;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (layout(prepared, mid, 20).lineCount === 1) {
            best = mid;
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
        setTightWidth(best + paddingX);
      }
    };

    computeTightWidth();

    const observer = new ResizeObserver(() => computeTightWidth());
    if (containerRef.current.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    return () => observer.disconnect();
  }, [prepared, paddingX]);

  return (
    <div
      ref={containerRef}
      className={`inline-block ${className}`}
      style={{
        ...style,
        width: tightWidth ? `${tightWidth}px` : undefined,
        maxWidth: '100%',
        font: font,
      }}
      {...props}
    >
      {children || text}
    </div>
  );
};
