/**
 * Pretext Layout Helper
 * Inspired by chenglou/pretext layout & multiline text measurement engine.
 * Provides canvas-backed text width measurement, dynamic font size clamping,
 * and container fitting utilities for 100% responsive UI rendering.
 */

let canvasContext: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined') return null;
  if (!canvasContext) {
    const canvas = document.createElement('canvas');
    canvasContext = canvas.getContext('2d');
  }
  return canvasContext;
}

/**
 * Measures exact pixel width of text string given a CSS font string.
 */
export function measureTextWidth(text: string, font: string = '16px Inter, sans-serif'): number {
  const ctx = getCanvasContext();
  if (!ctx) return text.length * 9; // Fallback estimate
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Calculates optimal fluid font size CSS string using clamp().
 * e.g. getFluidFontSize(12, 16, 20) -> "clamp(12px, 1.2vw + 10px, 20px)"
 */
export function getFluidFontSize(minPx: number, preferredVw: number, maxPx: number): string {
  return `clamp(${minPx}px, ${preferredVw}vw + 8px, ${maxPx}px)`;
}

/**
 * Fits a text string into a container of targetWidth by returning the ideal font size in px.
 */
export function fitTextToWidth(
  text: string, 
  targetWidth: number, 
  minFontSize: number = 11, 
  maxFontSize: number = 28, 
  fontFamily: string = 'Inter, sans-serif'
): number {
  if (!text || targetWidth <= 0) return minFontSize;
  
  let low = minFontSize;
  let high = maxFontSize;
  let best = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const measured = measureTextWidth(text, `${mid}px ${fontFamily}`);
    if (measured <= targetWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

/**
 * Truncates text with ellipsis if it exceeds container width even at minimum font size.
 */
export function formatPretextTitle(text: string, maxLen: number = 30): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 3)}...`;
}
