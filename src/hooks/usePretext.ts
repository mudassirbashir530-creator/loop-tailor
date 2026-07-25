import { useState, useEffect, useMemo } from 'react';
import { prepare, layout, layoutWithLines, PreparedText, LayoutWithLinesResult } from '../lib/pretext';

export function usePretext(
  text: string,
  font: string = '16px Inter, sans-serif',
  maxWidth: number = 320,
  lineHeight: number = 24
): LayoutWithLinesResult {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 320);
  const [orientation, setOrientation] = useState<string>(
    typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setOrientation(window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const prepared: PreparedText = useMemo(() => {
    return prepare(text, font);
  }, [text, font]);

  const effectiveMaxWidth = useMemo(() => {
    // Dynamic responsive width capping for phones/tablets/landscape
    if (windowWidth < 640) {
      return Math.min(maxWidth, windowWidth - 32); // mobile padding
    }
    return maxWidth;
  }, [maxWidth, windowWidth]);

  const result = useMemo(() => {
    return layoutWithLines(prepared, effectiveMaxWidth, lineHeight);
  }, [prepared, effectiveMaxWidth, lineHeight]);

  return result;
}
