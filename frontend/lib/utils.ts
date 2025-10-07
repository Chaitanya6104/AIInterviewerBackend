import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe rendering utility to prevent React object rendering errors
export function safeRender(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  
  if (Array.isArray(value)) {
    return value.map(safeRender).join(', ')
  }
  
  if (typeof value === 'object') {
    // Handle common object patterns
    if (value.msg) return String(value.msg)
    if (value.message) return String(value.message)
    if (value.detail) return safeRender(value.detail)
    if (value.error) return safeRender(value.error)
    
    // For other objects, return a safe representation
    return '[Object]'
  }
  
  return String(value)
}

// Safe date formatting
export function safeDateFormat(date: any): string {
  if (!date) return ''
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    return dateObj.toLocaleDateString()
  } catch {
    return ''
  }
}

// Safe number formatting
export function safeNumberFormat(value: any, decimals = 0): string {
  if (value === null || value === undefined) return ''
  
  const num = Number(value)
  if (isNaN(num)) return ''
  
  return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString()
}