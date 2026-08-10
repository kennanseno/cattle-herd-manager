import { addDays, subDays, format, parseISO, differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const GESTATION_DAYS = 283;

export function calcCalvingDate(breedDate: string): string {
  return format(addDays(parseISO(breedDate), GESTATION_DAYS), 'yyyy-MM-dd');
}

export function calcBreedDate(dob: string): string {
  return format(subDays(parseISO(dob), GESTATION_DAYS), 'yyyy-MM-dd');
}

export function formatPHP(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
}

export function getAgeInYears(dob: string): number {
  return differenceInYears(new Date(), parseISO(dob));
}

export function getAgeInMonths(dob: string): number {
  return differenceInMonths(new Date(), parseISO(dob));
}

export function formatAgeWithMonths(dob: string): string {
  const months = getAgeInMonths(dob)
  if (months < 1) return "< 1 mo"
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  const yearsStr = `${years} yr${years !== 1 ? "s" : ""}`
  const remStr = rem > 0 ? ` ${rem} mo` : ""
  const totalMonths = `${months} mo`
  return `${yearsStr}${remStr} (${totalMonths})`
}

export function isCalf(dob: string): boolean {
  return getAgeInMonths(dob) <= 12;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateRange(startDate: string, endDate?: string): string {
  if (!startDate) return '—';
  if (!endDate) return formatDate(startDate);

  try {
    const start = format(parseISO(startDate), 'MMMM dd, yyyy');
    const end = format(parseISO(endDate), 'MMMM dd, yyyy');
    return start === end ? start : `${start} – ${end}`;
  } catch {
    return [startDate, endDate].filter(Boolean).join(' – ');
  }
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
