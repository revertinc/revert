import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(number: number) {
    return Intl.NumberFormat('en-IN').format(number);
}

export { v4 as uuid } from 'uuid';
