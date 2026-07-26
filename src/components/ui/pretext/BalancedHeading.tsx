import React, { useEffect, useRef, useState, useMemo } from 'react';
import { prepare, layout, PreparedText } from '../../../lib/pretext';

export interface BalancedHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  text: string;
  font?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export const BalancedHeading: React.FC<BalancedHeadingProps> = ({
  text,
  font = 'bold 28px Inter',
  as: Component = 'h2',
  className = '',
  style,
  ...props
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [balancedWidth, setBalancedWidth] = useState<number | null>(null);

  const prepared = useMemo<PreparedText | null>(() => {
    if (!text) return null;
    try {
      return prepare(text, font);
    } catch {
      return null;
    }
  }, [text, font]);

  useEffect(() => {
    if (!prepared || !headingRef.current) return;

    const balanceHeadingWidth = () => {
      if (!headingRef.current || !prepared) return;
      const fullWidth = headingRef.current.parentElement?.clientWidth || 600;
      if (fullWidth <= 0) return;

      const initialResult = layout(prepared, fullWidth, 32);
      if (initialResult.lineCount <= 1) {
        setBalancedWidth(null);
        return;
      }

      let low = 100;
      let high = fullWidth;
      let optimalWidth = fullWidth;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midResult = layout(prepared, mid, 32);

        if (midResult.lineCount <= initialResult.lineCount) {
          optimalWidth = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      setBalancedWidth(Math.ceil(optimalWidth) + 4);
    };

    balanceHeadingWidth();

    const resizeObserver = new ResizeObserver(() => balanceHeadingWidth());
    if (headingRef.current.parentElement) {
      resizeObserver.observe(headingRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [prepared]);

  return (
    <Component
      ref={headingRef as any}
      className={className}
      style={{
        ...style,
        maxWidth: balancedWidth ? `${balancedWidth}px` : '100%',
        marginRight: balancedWidth ? 'auto' : undefined,
        marginLeft: balancedWidth ? 'auto' : undefined,
        font: font,
      }}
      {...props}
    >
      {text}
    </Component>
  );
};
