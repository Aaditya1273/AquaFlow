// AquaFlow Constants - Centralized configuration
import { Address } from 'viem';

// Contract Addresses by Chain
export const CONTRACTS = {
  42161: { // Arbitrum One
    STYLUS_ROUTER: '0x1111111111111111111111111111111111111111' as Address,
    SOLIDITY_WRAPPER: '0x2222222222222222222222222222222222222222' as Address,
    USDC: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B0' as Address,
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address,
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548' as Address,
  },
  42170: { // Arbitrum Nova
    STYLUS_ROUTER: '0x3333333333333333333333333333333333333333' as Address,
    SOLIDITY_WRAPPER: '0x4444444444444444444444444444444444444444' as Address,
    USDC: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B1' as Address,
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb8' as Address,
  },
  421337: { // Demo Orbit L3
    STYLUS_ROUTER: '0x5555555555555555555555555555555555555555' as Address,
    SOLIDITY_WRAPPER: '0x6666666666666666666666666666666666666666' as Address,
    USDC: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B2' as Address,
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb7' as Address,
  },
} as const;

// Chain Metadata
export const CHAIN_INFO = {
  42161: {
    name: 'Arbitrum One',
    shortName: 'ARB1',
    color: '#28A0F0',
    icon: '🔵',
    settlement: 'Ethereum',
    finality: '7 days',
    fees: 'Low',
  },
  42170: {
    name: 'Arbitrum Nova',
    shortName: 'NOVA',
    color: '#FF6B35',
    icon: '🟠',
    settlement: 'AnyTrust',
    finality: '~1 hour',
    fees: 'Ultra Low',
  },
  421337: {
    name: 'AquaFlow L3',
    shortName: 'AFL3',
    color: '#9333EA',
    icon: '🟣',
    settlement: 'Arbitrum One',
    finality: '~10 minutes',
    fees: 'Minimal',
  },
} as const;

// Token Metadata
export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    color: '#2775CA',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '💰',
    color: '#26A17B',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: '⟠',
    color: '#627EEA',
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    icon: '🔷',
    color: '#28A0F0',
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  name: 'AquaFlow',
  description: 'Unified Intent-Based Liquidity Router for Arbitrum',
  url: 'https://aquaflow.arbitrum.io',
  version: '0.1.0',
  
  // Feature flags
  features: {
    multiChain: true,
    orbitL3: true,
    gasBenchmark: true,
    realTimeUpdates: true,
  },
  
  // UI Configuration
  ui: {
    defaultSlippage: 0.5, // 0.5%
    maxSlippage: 10, // 10%
    defaultDeadline: 30, // 30 minutes
    refreshInterval: 15000, // 15 seconds
  },
  
  // Demo Configuration
  demo: {
    simulateTransactions: true,
    mockPoolData: true,
    enableTestnet: true,
  },
} as const;

// Intent Parser Configuration
export const INTENT_CONFIG = {
  confidenceThreshold: 0.7,
  maxRouteHops: 3,
  maxPriceImpact: 5.0, // 5%
  
  // Common token aliases
  tokenAliases: {
    'USD': 'USDC',
    'DOLLAR': 'USDC',
    'ETHEREUM': 'ETH',
    'ETHER': 'ETH',
    'WETH': 'ETH',
    'TETHER': 'USDT',
    'ARBITRUM': 'ARB',
  },
  
  // Chain preferences
  chainPreferences: {
    'cheapest': 42170, // Nova
    'fastest': 42161,  // One
    'any': 42161,      // Default to One
  },
} as const;

// Gas Configuration
export const GAS_CONFIG = {
  // Gas limits by operation type
  limits: {
    simpleSwap: 180000n,
    multiHopSwap: 350000n,
    intentExecution: 250000n,
    poolUpdate: 100000n,
  },
  
  // Gas price multipliers by chain
  multipliers: {
    42161: 1.1,  // 10% buffer for Arbitrum One
    42170: 1.05, // 5% buffer for Nova
    421337: 1.0, // No buffer for L3
  },
} as const;

// Error Messages
export const ERRORS = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  UNSUPPORTED_CHAIN: 'Please switch to a supported Arbitrum chain',
  INSUFFICIENT_BALANCE: 'Insufficient token balance',
  SLIPPAGE_TOO_HIGH: 'Price impact too high, reduce amount or increase slippage',
  INTENT_PARSE_FAILED: 'Could not understand your intent, please try rephrasing',
  ROUTE_NOT_FOUND: 'No viable route found for this swap',
  TRANSACTION_FAILED: 'Transaction failed, please try again',
} as const;

// Success Messages
export const SUCCESS = {
  INTENT_PARSED: 'Intent understood successfully',
  ROUTE_FOUND: 'Optimal route computed',
  TRANSACTION_SUBMITTED: 'Transaction submitted to blockchain',
  SWAP_COMPLETED: 'Swap completed successfully',
} as const;