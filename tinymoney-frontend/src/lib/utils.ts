import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TransactionsUrlParams = {
  dateFrom?: string;
  dateTo?: string;
  isExpense?: boolean | 'true' | 'false';
  amountTo?: number;
  vendorId?: number;
  subcategoryId?: number;
  tagId?: number;
};

export const getTransactionsUrl = (params: TransactionsUrlParams = {}): string => {
  const baseUrl = '/transactions';

  const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {});

  const queryString = new URLSearchParams(cleanParams).toString();

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};