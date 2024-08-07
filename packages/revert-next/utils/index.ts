import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNumber(number: number) {
    return Intl.NumberFormat('en-IN').format(number);
}

export { ZodError, z } from 'zod';

export { v4 as uuid } from 'uuid';

export { cva, type VariantProps } from 'class-variance-authority';