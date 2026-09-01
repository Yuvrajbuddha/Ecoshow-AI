import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryBadgeClasses(category: string): {
  bg: string;
  text: string;
  border: string;
  iconBg: string;
} {
  switch (category) {
    case 'recyclable':
      return {
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100 text-emerald-700',
      };
    case 'organic':
      return {
        bg: 'bg-amber-50 text-amber-900',
        text: 'text-amber-800',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100 text-amber-800',
      };
    case 'ewaste':
      return {
        bg: 'bg-blue-50 text-blue-900',
        text: 'text-blue-700',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100 text-blue-700',
      };
    case 'hazardous':
      return {
        bg: 'bg-rose-50 text-rose-900',
        text: 'text-rose-700',
        border: 'border-rose-200',
        iconBg: 'bg-rose-100 text-rose-700',
      };
    case 'context_dependent':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-700',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100 text-amber-700',
      };
    case 'general':
    default:
      return {
        bg: 'bg-slate-100 text-slate-800',
        text: 'text-slate-700',
        border: 'border-slate-300',
        iconBg: 'bg-slate-200 text-slate-700',
      };
  }
}
