import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number | undefined | null, currency = 'BRL') => {
  const safeValue = value ?? 0;
  return safeValue.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency });
};

export const safeDate = (val: any): Date | undefined => {
  if (!val) return undefined;

  let date: Date | undefined;

  if (val?.toDate && typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    date = new Date(val);
  } else if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      date = new Date(num);
    } else {
      date = new Date(val);
    }
  }

  if (date && !isNaN(date.getTime())) {
    return date;
  }

  return undefined;
};
