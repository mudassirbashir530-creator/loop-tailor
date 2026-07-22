import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateValue: any) {
  if (!dateValue) return 'N/A';
  try {
    let date: Date;
    if (typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("formatDate error:", error);
    return 'N/A';
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function isOrderOverdue(deliveryDate: any, status?: string) {
  if (status === 'delivered' || !deliveryDate) return false;
  try {
    const date = deliveryDate.seconds ? new Date(deliveryDate.seconds * 1000) : new Date(deliveryDate);
    if (isNaN(date.getTime())) return false;
    return date.getTime() < new Date().setHours(0, 0, 0, 0);
  } catch {
    return false;
  }
}

export async function generateTokenId(userId: string): Promise<string> {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export function cleanPhoneNumber(phone: string, countryCode: string = '+92'): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = countryCode + cleaned.substring(1);
  } else if (cleaned.startsWith('92')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

export function getWhatsAppLink(cleanedNumber: string): string {
  if (!cleanedNumber) return '';
  const finalNumber = cleanedNumber.replace(/\+/g, '');
  return `https://wa.me/${finalNumber}`;
}
