import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyNumberFormat = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
});

export function curr(input: number | string){
    let inputAsNumber: number = 0;
    if (input as number) {
        inputAsNumber = input as number;
    } else if (input as string) {
        inputAsNumber = Number((input as string).replace(",", "."));
    }
    return currencyNumberFormat.format(inputAsNumber);
}