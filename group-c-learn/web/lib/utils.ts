import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge intelligent de classes Tailwind (clsx + tailwind-merge).
 * Pattern standard Hello Mira (cf. book-web, account-web).
 *
 * Usage :
 *   cn("px-4 py-2", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
