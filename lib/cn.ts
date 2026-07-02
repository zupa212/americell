import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Combines clsx (conditional logic) with tailwind-merge (dedupe).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
