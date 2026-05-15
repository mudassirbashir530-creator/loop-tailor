import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function isOrderOverdue(deliveryDate: string, status?: string) {
  if (status === 'delivered') return false;
  return new Date(deliveryDate).getTime() < new Date().setHours(0, 0, 0, 0);
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
