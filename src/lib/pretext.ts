/**
 * Pretext Text Measurement & Layout Engine
 * Inspired by Cheng Lou's pretext (https://github.com/chenglou/pretext)
 * High performance, zero-reflow text measurement and dynamic multiline layout engine.
 */

export interface PrepareOptions {
  whiteSpace?: 'normal' | 'pre-wrap';
  wordBreak?: 'normal' | 'keep-all';
  letterSpacing?: number;
}

export interface PreparedSegment {
  text: string;
  width: number;
  isSpace: boolean;
  isHardBreak: boolean;
}

export interface PreparedText {
  text: string;
  font: string;
  segments: PreparedSegment[];
  totalWidth: number;
  options: PrepareOptions;
}

export interface LayoutResult {
  height: number;
  lineCount: number;
  maxLineWidth: number;
}

export interface LayoutLine {
  text: string;
  width: number;
}

export interface LayoutWithLinesResult extends LayoutResult {
  lines: LayoutLine[];
}

let canvasContextCache: CanvasRenderingContext2D | null = null;

function getCanvasContext(font: string): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined') return null;
  if (!canvasContextCache) {
    const canvas = document.createElement('canvas');
    canvasContextCache = canvas.getContext('2d');
  }
  if (canvasContextCache) {
    canvasContextCache.font = font;
  }
  return canvasContextCache;
}

/**
 * Pre-measures text segments using HTML5 Canvas engine without touching the DOM.
 */
export function prepare(text: string, font: string, options: PrepareOptions = {}): PreparedText {
  if (!text) {
    return { text: '', font, segments: [], totalWidth: 0, options };
  }

  const ctx = getCanvasContext(font);
  const letterSpacing = options.letterSpacing || 0;

  // Split into words/whitespace/newlines while preserving structure
  const rawTokens = text.split(/(\s+|\n)/g).filter(Boolean);
  const segments: PreparedSegment[] = [];
  let totalWidth = 0;

  for (const token of rawTokens) {
    const isHardBreak = token === '\n';
    const isSpace = /^\s+$/.test(token) && !isHardBreak;
    
    let baseWidth = 0;
    if (ctx && !isHardBreak) {
      baseWidth = ctx.measureText(token).width;
      if (letterSpacing !== 0) {
        baseWidth += token.length * letterSpacing;
      }
    } else if (!isHardBreak) {
      baseWidth = token.length * 8; // fallback estimate
    }

    segments.push({
      text: token,
      width: baseWidth,
      isSpace,
      isHardBreak
    });

    totalWidth += baseWidth;
  }

  return {
    text,
    font,
    segments,
    totalWidth,
    options
  };
}

/**
 * Pure arithmetic hot-path: calculates multiline height and line count given a maxWidth.
 */
export function layout(prepared: PreparedText, maxWidth: number, lineHeight: number): LayoutResult {
  if (!prepared || prepared.segments.length === 0 || maxWidth <= 0) {
    return { height: lineHeight, lineCount: 1, maxLineWidth: 0 };
  }

  let lineCount = 1;
  let currentLineWidth = 0;
  let maxLineWidth = 0;

  for (const seg of prepared.segments) {
    if (seg.isHardBreak) {
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
      lineCount++;
      currentLineWidth = 0;
      continue;
    }

    if (currentLineWidth > 0 && currentLineWidth + seg.width > maxWidth) {
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
      lineCount++;
      currentLineWidth = seg.isSpace ? 0 : seg.width;
    } else {
      currentLineWidth += seg.width;
    }
  }

  maxLineWidth = Math.max(maxLineWidth, currentLineWidth);

  return {
    height: Math.ceil(lineCount * lineHeight),
    lineCount,
    maxLineWidth: Math.ceil(maxLineWidth)
  };
}

/**
 * High-level layout with line breakdown.
 */
export function layoutWithLines(prepared: PreparedText, maxWidth: number, lineHeight: number): LayoutWithLinesResult {
  if (!prepared || prepared.segments.length === 0 || maxWidth <= 0) {
    return { height: lineHeight, lineCount: 1, maxLineWidth: 0, lines: [{ text: prepared?.text || '', width: 0 }] };
  }

  const lines: LayoutLine[] = [];
  let currentLineText = '';
  let currentLineWidth = 0;
  let maxLineWidth = 0;

  for (const seg of prepared.segments) {
    if (seg.isHardBreak) {
      lines.push({ text: currentLineText.trimEnd(), width: currentLineWidth });
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
      currentLineText = '';
      currentLineWidth = 0;
      continue;
    }

    if (currentLineWidth > 0 && currentLineWidth + seg.width > maxWidth) {
      lines.push({ text: currentLineText.trimEnd(), width: currentLineWidth });
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
      currentLineText = seg.isSpace ? '' : seg.text;
      currentLineWidth = seg.isSpace ? 0 : seg.width;
    } else {
      currentLineText += seg.text;
      currentLineWidth += seg.width;
    }
  }

  if (currentLineText.length > 0 || lines.length === 0) {
    lines.push({ text: currentLineText.trimEnd(), width: currentLineWidth });
    maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
  }

  return {
    height: Math.ceil(lines.length * lineHeight),
    lineCount: lines.length,
    maxLineWidth: Math.ceil(maxLineWidth),
    lines
  };
}
