// Utility functions for formatting and calculations
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Number formatting utilities
export const formatNumber = {
  // Format large numbers with K, M, B suffixes
  compact: (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(2);
  },

  // Format currency with proper decimals
  currency: (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  // Format percentage
  percentage: (num: number, decimals: number = 1): string => {
    return `${num.toFixed(decimals)}%`;
  },

  // Format gas amounts
  gas: (gas: bigint): string => {
    const gasNum = Number(gas);
    return gasNum.toLocaleString();
  },

  // Format token amounts
  token: (amount: string | number, decimals: number = 4): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(decimals);
  },
};

// Time formatting utilities
export const formatTime = {
  // Format duration in seconds to human readable
  duration: (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  },

  // Format timestamp to relative time
  relative: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  },

  // Format date to readable string
  date: (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};

// Address formatting utilities
export const formatAddress = {
  // Truncate address for display
  short: (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  // Format with ENS if available
  display: (address: string, ens?: string): string => {
    return ens || formatAddress.short(address);
  },
};

// Validation utilities
export const validate = {
  // Check if string is valid number
  isNumber: (value: string): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  },

  // Check if address is valid Ethereum address
  isAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  // Check if amount is valid for token decimals
  isValidAmount: (amount: string, decimals: number): boolean => {
    if (!validate.isNumber(amount)) return false;
    const parts = amount.split('.');
    return parts.length === 1 || (parts[1] && parts[1].length <= decimals);
  },
};

// Color utilities for dynamic theming
export const colors = {
  // Get color based on percentage (red to green)
  percentage: (percentage: number): string => {
    if (percentage >= 75) return 'text-green-400';
    if (percentage >= 50) return 'text-yellow-400';
    if (percentage >= 25) return 'text-orange-400';
    return 'text-red-400';
  },

  // Get gradient based on value
  gradient: (value: number, max: number): string => {
    const ratio = Math.min(value / max, 1);
    if (ratio >= 0.8) return 'from-green-500 to-emerald-500';
    if (ratio >= 0.6) return 'from-blue-500 to-cyan-500';
    if (ratio >= 0.4) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  },
};

// Animation utilities
export const animations = {
  // Stagger delay for list items
  stagger: (index: number, delay: number = 0.1): number => {
    return index * delay;
  },

  // Bounce animation values
  bounce: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },

  // Slide animation values
  slide: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
};

// Local storage utilities
export const storage = {
  // Get item from localStorage with fallback
  get: <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  // Set item in localStorage
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  // Remove item from localStorage
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Copy to clipboard utility
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Generate random ID
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Sleep utility for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}