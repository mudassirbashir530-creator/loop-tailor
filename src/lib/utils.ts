import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isOrderOverdue(dueDate: string, currentDate: Date = new Date()): boolean {
  if (!dueDate) return false;
  try {
    // Normalize to UTC to avoid timezone mismatch
    const due = new Date(dueDate);
    const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
    const currentUTC = Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate());
    
    return currentUTC > dueUTC;
  } catch (e) {
    return false;
  }
}
