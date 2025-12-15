// AquaFlow Stylus Router Hook - Direct interaction with Stylus contracts
// Handles contract calls, gas estimation, and transaction execution

import { useState, useCallback, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { OptimalRoute } from '@/utils/routeOptimizer';
import { ParsedIntent } from '@/utils/intentParser';

// Contract addresses (would be loaded from config in production)
const STYLUS_ROUTER_ADDRESS = '0x1111111111111111111111111111111111111111';
const SOLIDITY_WRAPPER_ADDRESS = '0x2222222222222222222222222222222222222222';

// Simplified ABI for hackathon demo
const STYLUS_ROUTER_ABI = [
  'function execute_intent((address,address,address,uint256,uint256,uint256)) external returns (uint256)',
  'function get_quote(address,address,uint256) external view returns (uint256)',
  'function add_pool(address,address,address,uint256) external returns (uint256)',
  'event IntentExecuted(address indexed,address indexed,address indexed,uint256,uint256,uint256)',
] as const;

const WRAPPER_ABI = [
  'function executeIntent(address,address,uint256,uint256,uint256) external returns (uint256)',
  'function getQuote(address,address,uint256) external view returns (uint256)',
  'event SwapCompleted(address indexed,address indexed,address indexed,uint256,uint256)',
] as const;

export interface StylelusRouterState {
  isLoading: boolean;
  isExecuting: boolean;
  txHash: string | null;
  receipt: any | null;
  error: string | null;
  gasEstimate: bigint | null;
  quote: bigint | null;
}

export interface StylelusRouterResult {
  state: StylelusRouterState;
  executeIntent: (intent: ParsedIntent, route: OptimalRoute) => Promise<void>;
  getQuote: (tokenIn: string, tokenOut: string, amountIn: string) => Promise<void>;
  estimateGas: (intent: ParsedIntent) => Promise<void>;
  clearState: () => void;
}

export function useStylelusRouter(): StylelusRouterResult {
  const { address, isConnected } = useAccount();
  
  const [state, setState] = useState<StylelusRouterState>({
    isLoading: false,
    isExecuting: false,
    txHash: null,
    receipt: null,
    error: null,
    gasEstimate: null,
    quote: null,
  });
  
  // Contract write hook for executing intents
  const { writeContractAsync: executeIntentWrite } = useWriteContract();
  
  // Contract read hook for quotes
  const { refetch: refetchQuote } = useReadContract({
    address: SOLIDITY_WRAPPER_ADDRESS,
    abi: WRAPPER_ABI,
    functionName: 'getQuote',
    query: { enabled: false },
  });
  
  // Transaction receipt hook
  const { data: receipt, isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: state.txHash as `0x${string}` | undefined,
    query: { enabled: !!state.txHash },
  });
  
  // Update receipt when transaction is mined
  useEffect(() => {
    if (receipt) {
      setState(prev => ({
        ...prev,
        receipt,
        isExecuting: false,
        isLoading: false,
      }));
    }
  }, [receipt]);
  
  /**
   * Execute intent through Stylus router
   */
  const executeIntent = useCallback(async (
    intent: ParsedIntent,
    route: OptimalRoute
  ) => {
    if (!isConnected || !address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      isExecuting: true, 
      error: null,
      txHash: null,
      receipt: null 
    }));
    
    try {
      console.log('🚀 Executing intent through Stylus router...');
      console.log(`   Input: ${intent.amount} ${intent.tokenIn}`);
      console.log(`   Output: ${intent.tokenOut}`);
      console.log(`   Route steps: ${route.steps.length}`);
      
      // Get token addresses (simplified for hackathon)
      const tokenInAddress = getTokenAddress(intent.tokenIn);
      const tokenOutAddress = getTokenAddress(intent.tokenOut);
      
      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error('Token address not found');
      }
      
      // Convert amounts to proper units
      const amountIn = ethers.parseUnits(intent.amount, 18);
      const minAmountOut = route.totalAmountOut * 95n / 100n; // 5% slippage tolerance
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes
      
      console.log('📝 Transaction parameters:');
      console.log(`   Token In: ${tokenInAddress}`);
      console.log(`   Token Out: ${tokenOutAddress}`);
      console.log(`   Amount In: ${ethers.formatUnits(amountIn, 18)}`);
      console.log(`   Min Amount Out: ${ethers.formatUnits(minAmountOut, 18)}`);
      
      // Execute through Solidity wrapper (which calls Stylus router)
      const tx = await executeIntentWrite({
        address: SOLIDITY_WRAPPER_ADDRESS,
        abi: WRAPPER_ABI,
        functionName: 'executeIntent',
        args: [
          tokenInAddress,
          tokenOutAddress,
          amountIn,
          minAmountOut,
          deadline,
        ],
      });
      
      setState(prev => ({ ...prev, txHash: tx.hash }));
      
      console.log('✅ Transaction submitted:', tx.hash);
      
    } catch (error) {
      console.error('❌ Intent execution failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      }));
    }
  }, [isConnected, address, executeIntentWrite]);
  
  /**
   * Get quote for swap
   */
  const getQuote = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('💰 Getting quote from Stylus router...');
      
      const tokenInAddress = getTokenAddress(tokenIn);
      const tokenOutAddress = getTokenAddress(tokenOut);
      
      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error('Token address not found');
      }
      
      const amountInWei = ethers.parseUnits(amountIn, 18);
      
      // For hackathon: simulate quote (in production, call actual contract)
      const simulatedQuote = await simulateQuote(tokenInAddress, tokenOutAddress, amountInWei);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        quote: simulatedQuote,
      }));
      
      console.log('✅ Quote received:', ethers.formatUnits(simulatedQuote, 18));
      
    } catch (error) {
      console.error('❌ Quote failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Quote failed',
      }));
    }
  }, []);
  
  /**
   * Estimate gas for intent execution
   */
  const estimateGas = useCallback(async (intent: ParsedIntent) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('⛽ Estimating gas for intent execution...');
      
      // For hackathon: use pre-calculated estimates based on route complexity
      // In production: call estimateGas on actual contract
      const baseGas = 180000n; // Base swap gas
      const additionalGas = 50000n; // Per additional hop
      
      // Simplified estimation
      const estimatedGas = baseGas + additionalGas;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        gasEstimate: estimatedGas,
      }));
      
      console.log('✅ Gas estimate:', estimatedGas.toString());
      
    } catch (error) {
      console.error('❌ Gas estimation failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Gas estimation failed',
      }));
    }
  }, []);
  
  /**
   * Clear all state
   */
  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      isExecuting: false,
      txHash: null,
      receipt: null,
      error: null,
      gasEstimate: null,
      quote: null,
    });
  }, []);
  
  return {
    state: {
      ...state,
      isLoading: state.isLoading || isWaitingForTx,
    },
    executeIntent,
    getQuote,
    estimateGas,
    clearState,
  };
}

/**
 * Get token address by symbol (simplified for hackathon)
 */
function getTokenAddress(symbol: string): string | null {
  const addresses: Record<string, string> = {
    'USDC': '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B0',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'ETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'ARB': '0x912CE59144191C1204E64559FE8253a0e49E6548',
  };
  
  return addresses[symbol.toUpperCase()] || null;
}

/**
 * Simulate quote for hackathon demo
 */
async function simulateQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<bigint> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simplified quote calculation (0.3% fee)
  const fee = amountIn * 30n / 10000n;
  return amountIn - fee;
}

/**
 * Hook for monitoring Stylus router events
 */
export function useStylelusRouterEvents() {
  const [events, setEvents] = useState<Array<{
    type: 'IntentExecuted' | 'RouteComputed' | 'PoolAdded';
    data: any;
    timestamp: number;
    txHash: string;
  }>>([]);
  
  // In production: use wagmi's useContractEvent to listen for real events
  useEffect(() => {
    // Mock events for demo
    const mockEvents = [
      {
        type: 'IntentExecuted' as const,
        data: {
          user: '0x1234...5678',
          tokenIn: 'USDC',
          tokenOut: 'USDT',
          amountIn: '100',
          amountOut: '99.7',
          gasUsed: '45231',
        },
        timestamp: Date.now() - 300000,
        txHash: '0xabcd...1234',
      },
    ];
    
    setEvents(mockEvents);
  }, []);
  
  return events;
}

/**
 * Hook for Stylus router statistics
 */
export function useStylelusRouterStats() {
  const [stats, setStats] = useState({
    totalIntentsExecuted: 0,
    totalVolumeUSD: 0,
    averageGasUsed: 0,
    gasSavingsVsSolidity: 0,
  });
  
  useEffect(() => {
    // Mock stats for demo
    setStats({
      totalIntentsExecuted: 1247,
      totalVolumeUSD: 2847392,
      averageGasUsed: 45231,
      gasSavingsVsSolidity: 0.76, // 76% savings
    });
  }, []);
  
  return stats;
}