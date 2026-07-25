import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCIES = [
  { code: 'PKR', symbol: 'PKR', label: 'PKR — Pakistani Rupee' },
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
  { code: 'BDT', symbol: '৳', label: 'BDT — Bangladeshi Taka' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
];

export function renderSafeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object') {
    if ('value' in val && typeof val.value === 'number') return val.value;
    if ('amount' in val && typeof val.amount === 'number') return val.amount;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
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

export function formatCurrency(amount: any, currencyCode: string = 'PKR') {
  const num = renderSafeNumber(amount);
  const curr = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  return `${curr.symbol} ${num.toLocaleString('en-US')}`;
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
