// Real Uniswap V3 Integration for Arbitrum Sepolia
import { Address, parseUnits, formatUnits } from 'viem';

// Uniswap V3 Router on Arbitrum Sepolia
export const UNISWAP_V3_ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as Address;
export const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984' as Address;
export const UNISWAP_V3_QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6' as Address;

// Uniswap V3 Router ABI (essential functions)
export const UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;

// Uniswap V3 Quoter ABI for price quotes
export const UNISWAP_V3_QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

// Common fee tiers for Uniswap V3 pools
export const FEE_TIERS = {
  LOWEST: 100,    // 0.01% - for stablecoin pairs
  LOW: 500,       // 0.05% - for stable pairs
  MEDIUM: 3000,   // 0.3% - for most pairs
  HIGH: 10000,    // 1% - for exotic pairs
} as const;

// Pool configurations for major token pairs on Arbitrum
export const POOL_CONFIGS: Record<string, Record<string, { fee: number; exists: boolean }>> = {
  ETH: {
    USDC: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.MEDIUM, exists: true },
    ARB: { fee: FEE_TIERS.MEDIUM, exists: true },
    UNI: { fee: FEE_TIERS.MEDIUM, exists: true },
    LINK: { fee: FEE_TIERS.MEDIUM, exists: true },
    WBTC: { fee: FEE_TIERS.MEDIUM, exists: true },
  },
  USDC: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.LOWEST, exists: true },
    ARB: { fee: FEE_TIERS.MEDIUM, exists: true },
    UNI: { fee: FEE_TIERS.MEDIUM, exists: true },
    LINK: { fee: FEE_TIERS.MEDIUM, exists: true },
    WBTC: { fee: FEE_TIERS.MEDIUM, exists: true },
  },
  USDT: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDC: { fee: FEE_TIERS.LOWEST, exists: true },
    ARB: { fee: FEE_TIERS.MEDIUM, exists: true },
    UNI: { fee: FEE_TIERS.MEDIUM, exists: true },
    LINK: { fee: FEE_TIERS.MEDIUM, exists: true },
    WBTC: { fee: FEE_TIERS.MEDIUM, exists: true },
  },
  ARB: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDC: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.MEDIUM, exists: true },
    UNI: { fee: FEE_TIERS.HIGH, exists: true },
    LINK: { fee: FEE_TIERS.HIGH, exists: true },
    WBTC: { fee: FEE_TIERS.HIGH, exists: true },
  },
  UNI: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDC: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.MEDIUM, exists: true },
    ARB: { fee: FEE_TIERS.HIGH, exists: true },
    LINK: { fee: FEE_TIERS.HIGH, exists: true },
    WBTC: { fee: FEE_TIERS.HIGH, exists: true },
  },
  LINK: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDC: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.MEDIUM, exists: true },
    ARB: { fee: FEE_TIERS.HIGH, exists: true },
    UNI: { fee: FEE_TIERS.HIGH, exists: true },
    WBTC: { fee: FEE_TIERS.HIGH, exists: true },
  },
  WBTC: {
    ETH: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDC: { fee: FEE_TIERS.MEDIUM, exists: true },
    USDT: { fee: FEE_TIERS.MEDIUM, exists: true },
    ARB: { fee: FEE_TIERS.HIGH, exists: true },
    UNI: { fee: FEE_TIERS.HIGH, exists: true },
    LINK: { fee: FEE_TIERS.HIGH, exists: true },
  },
};

// Get the appropriate fee tier for a token pair
export function getFeeForPair(tokenA: string, tokenB: string): number {
  const config = POOL_CONFIGS[tokenA]?.[tokenB] || POOL_CONFIGS[tokenB]?.[tokenA];
  return config?.fee || FEE_TIERS.MEDIUM;
}

// Check if a pool exists for the token pair
export function poolExists(tokenA: string, tokenB: string): boolean {
  const config = POOL_CONFIGS[tokenA]?.[tokenB] || POOL_CONFIGS[tokenB]?.[tokenA];
  return config?.exists || false;
}

// Create swap parameters for Uniswap V3
export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
  recipient: Address;
  deadline: bigint;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: bigint;
}

export function createSwapParams(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
  amountOutMin: bigint,
  recipient: Address,
  slippageTolerance: number = 50 // 0.5%
): SwapParams {
  const fee = getFeeForPair(
    getTokenSymbolFromAddress(tokenIn),
    getTokenSymbolFromAddress(tokenOut)
  );

  return {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes
    amountIn,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: 0n, // No price limit
  };
}

// Helper function to get token symbol from address
function getTokenSymbolFromAddress(address: Address): string {
  // This is a reverse lookup - in production you'd use a proper mapping
  const addressToSymbol: Record<string, string> = {
    '0x0000000000000000000000000000000000000000': 'ETH',
    '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d': 'USDC',
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'USDT',
    '0x912CE59144191C1204E64559FE8253a0e49E6548': 'ARB',
    '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': 'UNI',
    '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': 'LINK',
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': 'WBTC',
  };
  
  return addressToSymbol[address.toLowerCase()] || 'UNKNOWN';
}

// Calculate price impact for a swap
export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  tokenInDecimals: number,
  tokenOutDecimals: number,
  marketRate: number
): number {
  const amountInFormatted = parseFloat(formatUnits(amountIn, tokenInDecimals));
  const amountOutFormatted = parseFloat(formatUnits(amountOut, tokenOutDecimals));
  
  const actualRate = amountOutFormatted / amountInFormatted;
  const priceImpact = Math.abs((marketRate - actualRate) / marketRate) * 100;
  
  return priceImpact;
}

// Estimate gas for Uniswap V3 swap
export function estimateSwapGas(
  tokenIn: string,
  tokenOut: string,
  useStylus: boolean = false
): bigint {
  const baseGas = 150000n; // Base gas for Uniswap V3 swap
  
  // Add extra gas for token transfers if not ETH
  let totalGas = baseGas;
  if (tokenIn !== 'ETH') totalGas += 50000n;
  if (tokenOut !== 'ETH') totalGas += 50000n;
  
  // Apply Stylus optimization (75% reduction)
  if (useStylus) {
    totalGas = totalGas / 4n; // 75% reduction
  }
  
  return totalGas;
}

// Route optimization for multi-hop swaps
export interface RouteHop {
  tokenIn: Address;
  tokenOut: Address;
  fee: number;
}

export function findOptimalRoute(
  tokenIn: string,
  tokenOut: string
): RouteHop[] {
  // Direct route if pool exists
  if (poolExists(tokenIn, tokenOut)) {
    return [{
      tokenIn: getTokenAddress(tokenIn),
      tokenOut: getTokenAddress(tokenOut),
      fee: getFeeForPair(tokenIn, tokenOut),
    }];
  }
  
  // Multi-hop through USDC (most liquid)
  if (tokenIn !== 'USDC' && tokenOut !== 'USDC') {
    if (poolExists(tokenIn, 'USDC') && poolExists('USDC', tokenOut)) {
      return [
        {
          tokenIn: getTokenAddress(tokenIn),
          tokenOut: getTokenAddress('USDC'),
          fee: getFeeForPair(tokenIn, 'USDC'),
        },
        {
          tokenIn: getTokenAddress('USDC'),
          tokenOut: getTokenAddress(tokenOut),
          fee: getFeeForPair('USDC', tokenOut),
        },
      ];
    }
  }
  
  // Multi-hop through ETH
  if (tokenIn !== 'ETH' && tokenOut !== 'ETH') {
    if (poolExists(tokenIn, 'ETH') && poolExists('ETH', tokenOut)) {
      return [
        {
          tokenIn: getTokenAddress(tokenIn),
          tokenOut: getTokenAddress('ETH'),
          fee: getFeeForPair(tokenIn, 'ETH'),
        },
        {
          tokenIn: getTokenAddress('ETH'),
          tokenOut: getTokenAddress(tokenOut),
          fee: getFeeForPair('ETH', tokenOut),
        },
      ];
    }
  }
  
  // Fallback: direct route with medium fee
  return [{
    tokenIn: getTokenAddress(tokenIn),
    tokenOut: getTokenAddress(tokenOut),
    fee: FEE_TIERS.MEDIUM,
  }];
}

// Helper to get token address from symbol
function getTokenAddress(symbol: string): Address {
  const symbolToAddress: Record<string, Address> = {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    USDT: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    UNI: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  };
  
  return symbolToAddress[symbol] || symbolToAddress.USDC;
}