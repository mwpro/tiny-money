import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TransactionsUrlParams = {
  dateFrom?: Date;
  dateTo?: Date;
  isExpense?: boolean | 'true' | 'false';
  amountTo?: number;
  vendorId?: number;
  subcategoryId?: number;
  tagId?: number;
};

export const getTransactionsUrl = (params: TransactionsUrlParams = {}): string => {
  const baseUrl = '/transactions';
  
  const queryParts = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
          console.log(value);
        if (value instanceof Date) {
          acc[key] = format(value, "yyyy-MM-dd");
        } else {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>);

  const queryString = new URLSearchParams(queryParts).toString();

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};