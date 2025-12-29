import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number, currency = 'BRL') => {
  return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency });
};
