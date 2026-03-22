import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind.
 * @param inputs Lista de clases a combinar.
 * @returns Cadena final de clases normalizada.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
