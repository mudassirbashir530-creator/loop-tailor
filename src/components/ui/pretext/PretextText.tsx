import React, { useEffect, useRef, useState, useMemo } from 'react';
import { prepare, layout, PreparedText } from '../../../lib/pretext';

export interface PretextTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  font?: string;
  lineHeight?: number;
  whiteSpace?: 'normal' | 'pre-wrap';
  wordBreak?: 'normal' | 'keep-all';
  letterSpacing?: number;
  maxLines?: number;
  className?: string;
  as?: 'div' | 'p' | 'span';
}

export const PretextText: React.FC<PretextTextProps> = ({
  text,
  font = '16px Inter',
  lineHeight = 24,
  whiteSpace = 'normal',
  wordBreak = 'normal',
  letterSpacing = 0,
  maxLines,
  className = '',
  as: Component = 'div',
  style,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [computedHeight, setComputedHeight] = useState<number | null>(null);
  const [computedLineCount, setComputedLineCount] = useState<number | null>(null);

  const prepared = useMemo<PreparedText | null>(() => {
    if (!text) return null;
    try {
      return prepare(text, font, { whiteSpace, wordBreak, letterSpacing });
    } catch {
      return null;
    }
  }, [text, font, whiteSpace, wordBreak, letterSpacing]);

  useEffect(() => {
    if (!prepared || !containerRef.current) return;

    const measureLayout = () => {
      if (!containerRef.current || !prepared) return;
      const width = containerRef.current.clientWidth;
      if (width <= 0) return;

      const result = layout(prepared, width, lineHeight);
      let targetHeight = result.height;
      if (maxLines && result.lineCount > maxLines) {
        targetHeight = maxLines * lineHeight;
      }

      setComputedHeight(targetHeight);
      setComputedLineCount(result.lineCount);
    };

    measureLayout();

    const resizeObserver = new ResizeObserver(() => {
      measureLayout();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [prepared, lineHeight, maxLines]);

  return (
    <Component
      ref={containerRef as any}
      className={className}
      style={{
        ...style,
        minHeight: computedHeight ? `${computedHeight}px` : undefined,
        lineHeight: `${lineHeight}px`,
        font: font,
      }}
      {...props}
    >
      {text}
    </Component>
  );
};
