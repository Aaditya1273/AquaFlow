// Elite Utility Functions - Production-grade helpers
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatUnits, parseUnits } from 'viem';

// Tailwind class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Number formatting utilities
export const formatNumber = {
  // Format currency with appropriate precision
  currency: (value: number | string, decimals = 2): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(decimals)}`;
  },
  
  // Format token amounts
  token: (value: bigint | string, decimals = 18, precision = 4): string => {
    const formatted = typeof value === 'string' 
      ? value 
      : formatUnits(value, decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    
    return num.toFixed(precision).replace(/\.?0+$/, '');
  },
  
  // Format percentage
  percentage: (value: number, decimals = 2): string => {
    return `${value.toFixed(decimals)}%`;
  },
  
  // Format gas
  gas: (value: bigint | number): string => {
    const num = typeof value === 'bigint' ? Number(value) : value;
    return num.toLocaleString();
  },
};

// Time utilities
export const formatTime = {
  // Relative time (e.g., "2 minutes ago")
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
  
  // Duration (e.g., "2m 30s")
  duration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  },
  
  // Deadline formatting
  deadline: (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  },
};

// Address utilities
export const formatAddress = {
  // Truncate address (0x1234...5678)
  truncate: (address: string, start = 6, end = 4): string => {
    if (!address) return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  },
  
  // Check if address is valid
  isValid: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  // Compare addresses (case insensitive)
  isEqual: (a: string, b: string): boolean => {
    return a.toLowerCase() === b.toLowerCase();
  },
};

// Token utilities
export const tokenUtils = {
  // Parse token amount to bigint
  parseAmount: (amount: string, decimals: number): bigint => {
    try {
      return parseUnits(amount, decimals);
    } catch {
      return 0n;
    }
  },
  
  // Format token amount from bigint
  formatAmount: (amount: bigint, decimals: number, precision = 4): string => {
    return formatNumber.token(amount, decimals, precision);
  },
  
  // Calculate price impact
  calculatePriceImpact: (
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number => {
    if (reserveIn === 0n || reserveOut === 0n) return 100;
    
    const priceBefore = Number(reserveOut) / Number(reserveIn);
    const newReserveIn = reserveIn + amountIn;
    const amountOut = (reserveOut * amountIn) / (reserveIn + amountIn);
    const newReserveOut = reserveOut - amountOut;
    
    if (newReserveOut <= 0n) return 100;
    
    const priceAfter = Number(newReserveOut) / Number(newReserveIn);
    return Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
  },
};

// Chain utilities
export const chainUtils = {
  // Get chain name by ID
  getChainName: (chainId: number): string => {
    const names: Record<number, string> = {
      42161: 'Arbitrum One',
      42170: 'Arbitrum Nova',
      421614: 'Arbitrum Sepolia',
      421337: 'AquaFlow L3',
    };
    return names[chainId] || `Chain ${chainId}`;
  },
  
  // Check if chain is supported
  isSupported: (chainId: number): boolean => {
    return [42161, 42170, 421614, 421337].includes(chainId);
  },
  
  // Get chain color
  getChainColor: (chainId: number): string => {
    const colors: Record<number, string> = {
      42161: '#28A0F0',
      42170: '#FF6B35',
      421614: '#28A0F0',
      421337: '#9333EA',
    };
    return colors[chainId] || '#6B7280';
  },
};

// Error handling utilities
export const errorUtils = {
  // Parse error message from various sources
  parseError: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.reason) return error.reason;
    if (error?.data?.message) return error.data.message;
    return 'An unknown error occurred';
  },
  
  // Check if error is user rejection
  isUserRejection: (error: any): boolean => {
    const message = errorUtils.parseError(error).toLowerCase();
    return message.includes('user rejected') || 
           message.includes('user denied') ||
           message.includes('cancelled');
  },
  
  // Get user-friendly error message
  getUserMessage: (error: any): string => {
    const message = errorUtils.parseError(error);
    
    if (errorUtils.isUserRejection(error)) {
      return 'Transaction was cancelled';
    }
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient balance for this transaction';
    }
    
    if (message.includes('slippage')) {
      return 'Price moved too much, try increasing slippage tolerance';
    }
    
    if (message.includes('deadline')) {
      return 'Transaction expired, please try again';
    }
    
    return message;
  },
};

// Local storage utilities
export const storage = {
  // Get item with type safety
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  // Set item
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  },
  
  // Remove item
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

// Debounce utility
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

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};