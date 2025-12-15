// AquaFlow Intent Parser - Natural language to structured intent
// Pure client-side logic, no backend required

export interface ParsedIntent {
  action: 'swap' | 'bridge' | 'provide' | 'unknown';
  tokenIn: string;
  tokenOut: string;
  amount: string;
  amountType: 'exact_in' | 'exact_out';
  slippage?: number;
  deadline?: number;
  chainPreference?: string[];
  confidence: number; // 0-1 confidence score
}

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
  chainId: number;
}

// Common token mappings for Arbitrum ecosystem
const TOKEN_REGISTRY: Record<string, Token[]> = {
  'USDC': [
    { symbol: 'USDC', address: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B0', decimals: 6, chainId: 42161 },
    { symbol: 'USDC', address: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B1', decimals: 6, chainId: 42170 },
  ],
  'USDT': [
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, chainId: 42161 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb8', decimals: 6, chainId: 42170 },
  ],
  'ETH': [
    { symbol: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, chainId: 42161 },
    { symbol: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab2', decimals: 18, chainId: 42170 },
  ],
  'ARB': [
    { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, chainId: 42161 },
    { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6549', decimals: 18, chainId: 42170 },
  ],
};

// Intent parsing patterns
const INTENT_PATTERNS = [
  // Swap patterns
  {
    pattern: /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|→)\s+(\w+)/i,
    action: 'swap' as const,
    groups: ['amount', 'tokenIn', 'tokenOut'],
    amountType: 'exact_in' as const,
  },
  {
    pattern: /exchange\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|→)\s+(\w+)/i,
    action: 'swap' as const,
    groups: ['amount', 'tokenIn', 'tokenOut'],
    amountType: 'exact_in' as const,
  },
  {
    pattern: /convert\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|→)\s+(\w+)/i,
    action: 'swap' as const,
    groups: ['amount', 'tokenIn', 'tokenOut'],
    amountType: 'exact_in' as const,
  },
  {
    pattern: /buy\s+(\d+(?:\.\d+)?)\s+(\w+)\s+with\s+(\w+)/i,
    action: 'swap' as const,
    groups: ['amount', 'tokenOut', 'tokenIn'],
    amountType: 'exact_out' as const,
  },
  {
    pattern: /sell\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\w+)/i,
    action: 'swap' as const,
    groups: ['amount', 'tokenIn', 'tokenOut'],
    amountType: 'exact_in' as const,
  },
];

// Chain preference patterns
const CHAIN_PATTERNS = [
  { pattern: /arbitrum\s+one|arb\s+one/i, chain: 'arbitrum-one' },
  { pattern: /arbitrum\s+nova|arb\s+nova/i, chain: 'arbitrum-nova' },
  { pattern: /orbit|l3/i, chain: 'orbit-l3' },
  { pattern: /anywhere|any\s+chain|best\s+price/i, chain: 'any' },
  { pattern: /cheapest|lowest\s+fee/i, chain: 'cheapest' },
  { pattern: /fastest|quick/i, chain: 'fastest' },
];

// Slippage patterns
const SLIPPAGE_PATTERNS = [
  { pattern: /(\d+(?:\.\d+)?)\s*%\s*slippage/i, multiplier: 1 },
  { pattern: /max\s+(\d+(?:\.\d+)?)\s*%/i, multiplier: 1 },
  { pattern: /slippage\s+(\d+(?:\.\d+)?)/i, multiplier: 1 },
];

export class IntentParser {
  /**
   * Parse natural language intent into structured data
   */
  static parseIntent(input: string): ParsedIntent {
    const normalizedInput = input.trim().toLowerCase();
    
    // Try to match against known patterns
    for (const pattern of INTENT_PATTERNS) {
      const match = normalizedInput.match(pattern.pattern);
      if (match) {
        const intent = this.extractIntentFromMatch(match, pattern);
        if (intent.confidence > 0.7) {
          return this.enrichIntent(intent, normalizedInput);
        }
      }
    }
    
    // Fallback: try to extract tokens and amounts with lower confidence
    return this.fallbackParsing(normalizedInput);
  }
  
  /**
   * Extract intent from regex match
   */
  private static extractIntentFromMatch(
    match: RegExpMatchArray,
    pattern: typeof INTENT_PATTERNS[0]
  ): ParsedIntent {
    const groups = pattern.groups;
    const values: Record<string, string> = {};
    
    // Map regex groups to values
    groups.forEach((group, index) => {
      values[group] = match[index + 1];
    });
    
    // Normalize token symbols
    const tokenIn = this.normalizeTokenSymbol(values.tokenIn || '');
    const tokenOut = this.normalizeTokenSymbol(values.tokenOut || '');
    
    // Validate tokens exist in registry
    const tokenInExists = TOKEN_REGISTRY[tokenIn];
    const tokenOutExists = TOKEN_REGISTRY[tokenOut];
    
    const confidence = (tokenInExists && tokenOutExists) ? 0.9 : 0.5;
    
    return {
      action: pattern.action,
      tokenIn,
      tokenOut,
      amount: values.amount || '0',
      amountType: pattern.amountType,
      confidence,
    };
  }
  
  /**
   * Enrich intent with additional context from input
   */
  private static enrichIntent(intent: ParsedIntent, input: string): ParsedIntent {
    // Extract chain preference
    const chainPreference = this.extractChainPreference(input);
    if (chainPreference.length > 0) {
      intent.chainPreference = chainPreference;
    }
    
    // Extract slippage tolerance
    const slippage = this.extractSlippage(input);
    if (slippage > 0) {
      intent.slippage = slippage;
    }
    
    // Extract deadline hints
    const deadline = this.extractDeadline(input);
    if (deadline > 0) {
      intent.deadline = deadline;
    }
    
    return intent;
  }
  
  /**
   * Fallback parsing for unmatched patterns
   */
  private static fallbackParsing(input: string): ParsedIntent {
    // Try to find numbers and token symbols
    const numbers = input.match(/\d+(?:\.\d+)?/g) || [];
    const tokens = this.extractTokenSymbols(input);
    
    if (numbers.length > 0 && tokens.length >= 2) {
      return {
        action: 'swap',
        tokenIn: tokens[0],
        tokenOut: tokens[1],
        amount: numbers[0]!,
        amountType: 'exact_in',
        confidence: 0.3, // Low confidence fallback
      };
    }
    
    return {
      action: 'unknown',
      tokenIn: '',
      tokenOut: '',
      amount: '0',
      amountType: 'exact_in',
      confidence: 0,
    };
  }
  
  /**
   * Extract chain preferences from input
   */
  private static extractChainPreference(input: string): string[] {
    const preferences: string[] = [];
    
    for (const pattern of CHAIN_PATTERNS) {
      if (pattern.pattern.test(input)) {
        preferences.push(pattern.chain);
      }
    }
    
    return preferences.length > 0 ? preferences : ['any'];
  }
  
  /**
   * Extract slippage tolerance
   */
  private static extractSlippage(input: string): number {
    for (const pattern of SLIPPAGE_PATTERNS) {
      const match = input.match(pattern.pattern);
      if (match) {
        return parseFloat(match[1]) * pattern.multiplier;
      }
    }
    
    // Default slippage based on intent context
    if (input.includes('stable') || input.includes('usdc') || input.includes('usdt')) {
      return 0.1; // 0.1% for stablecoin swaps
    }
    
    return 0.5; // 0.5% default
  }
  
  /**
   * Extract deadline from input
   */
  private static extractDeadline(input: string): number {
    const now = Math.floor(Date.now() / 1000);
    
    if (input.includes('urgent') || input.includes('asap')) {
      return now + 300; // 5 minutes
    }
    
    if (input.includes('quick') || input.includes('fast')) {
      return now + 600; // 10 minutes
    }
    
    return now + 1800; // 30 minutes default
  }
  
  /**
   * Normalize token symbol
   */
  private static normalizeTokenSymbol(symbol: string): string {
    const normalized = symbol.toUpperCase().trim();
    
    // Handle common aliases
    const aliases: Record<string, string> = {
      'ETHEREUM': 'ETH',
      'ETHER': 'ETH',
      'WETH': 'ETH',
      'BITCOIN': 'BTC',
      'WBTC': 'BTC',
      'ARBITRUM': 'ARB',
      'TETHER': 'USDT',
      'USD': 'USDC',
      'DOLLAR': 'USDC',
    };
    
    return aliases[normalized] || normalized;
  }
  
  /**
   * Extract token symbols from text
   */
  private static extractTokenSymbols(input: string): string[] {
    const tokens: string[] = [];
    const words = input.split(/\s+/);
    
    for (const word of words) {
      const normalized = this.normalizeTokenSymbol(word);
      if (TOKEN_REGISTRY[normalized]) {
        tokens.push(normalized);
      }
    }
    
    return tokens;
  }
  
  /**
   * Get token info for a symbol on specific chain
   */
  static getTokenInfo(symbol: string, chainId?: number): Token | null {
    const tokens = TOKEN_REGISTRY[symbol.toUpperCase()];
    if (!tokens) return null;
    
    if (chainId) {
      return tokens.find(t => t.chainId === chainId) || tokens[0];
    }
    
    return tokens[0]; // Return first available
  }
  
  /**
   * Validate parsed intent
   */
  static validateIntent(intent: ParsedIntent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (intent.confidence < 0.3) {
      errors.push('Unable to understand intent clearly');
    }
    
    if (!intent.tokenIn || !TOKEN_REGISTRY[intent.tokenIn]) {
      errors.push(`Unknown input token: ${intent.tokenIn}`);
    }
    
    if (!intent.tokenOut || !TOKEN_REGISTRY[intent.tokenOut]) {
      errors.push(`Unknown output token: ${intent.tokenOut}`);
    }
    
    if (intent.tokenIn === intent.tokenOut) {
      errors.push('Input and output tokens cannot be the same');
    }
    
    if (parseFloat(intent.amount) <= 0) {
      errors.push('Amount must be greater than zero');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export types and constants
export { TOKEN_REGISTRY, INTENT_PATTERNS, CHAIN_PATTERNS };