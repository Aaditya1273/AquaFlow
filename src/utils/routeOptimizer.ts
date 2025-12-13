// AquaFlow Route Optimizer - Client-side optimal path finding
// Pure frontend logic, reads onchain data, computes best routes

import { ethers } from 'ethers';
import { ParsedIntent, Token } from './intentParser';

export interface Pool {
  id: string;
  address: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: bigint;
  reserveB: bigint;
  fee: number; // basis points
  chainId: number;
  tvl: number;
  volume24h: number;
}

export interface RouteStep {
  poolId: string;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  gasEstimate: number;
}

export interface OptimalRoute {
  steps: RouteStep[];
  totalAmountOut: bigint;
  totalPriceImpact: number;
  totalGasEstimate: number;
  executionTime: number; // estimated seconds
  confidence: number;
  chainPath: number[];
}

export interface RouteOptions {
  maxHops: number;
  maxPriceImpact: number; // percentage
  maxGasPrice: bigint;
  preferredChains: number[];
  prioritizeGas: boolean;
  prioritizeOutput: boolean;
}

export class RouteOptimizer {
  private pools: Pool[] = [];
  private provider: ethers.Provider;
  private chainId: number;
  
  constructor(provider: ethers.Provider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
  }
  
  /**
   * Load pool data from onchain sources
   */
  async loadPoolData(): Promise<void> {
    console.log('🔍 Loading pool data from onchain sources...');
    
    // For hackathon: use mock data that simulates real pools
    // In production: query actual DEX contracts
    this.pools = await this.getMockPoolData();
    
    console.log(`✅ Loaded ${this.pools.length} pools`);
  }
  
  /**
   * Find optimal route for given intent
   */
  async findOptimalRoute(
    intent: ParsedIntent,
    options: Partial<RouteOptions> = {}
  ): Promise<OptimalRoute | null> {
    const routeOptions: RouteOptions = {
      maxHops: 3,
      maxPriceImpact: 5.0, // 5%
      maxGasPrice: ethers.parseUnits('20', 'gwei'),
      preferredChains: intent.chainPreference ? this.parseChainPreference(intent.chainPreference) : [this.chainId],
      prioritizeGas: false,
      prioritizeOutput: true,
      ...options,
    };
    
    console.log('🧮 Computing optimal route...');
    console.log(`   Input: ${intent.amount} ${intent.tokenIn}`);
    console.log(`   Output: ${intent.tokenOut}`);
    console.log(`   Max hops: ${routeOptions.maxHops}`);
    
    // Get available pools for this token pair
    const relevantPools = this.getRelevantPools(intent, routeOptions);
    
    if (relevantPools.length === 0) {
      console.log('❌ No pools found for this token pair');
      return null;
    }
    
    // Find all possible routes
    const allRoutes = await this.findAllRoutes(intent, relevantPools, routeOptions);
    
    if (allRoutes.length === 0) {
      console.log('❌ No valid routes found');
      return null;
    }
    
    // Score and rank routes
    const scoredRoutes = allRoutes.map(route => ({
      route,
      score: this.scoreRoute(route, routeOptions),
    }));
    
    // Sort by score (higher is better)
    scoredRoutes.sort((a, b) => b.score - a.score);
    
    const bestRoute = scoredRoutes[0].route;
    
    console.log('✅ Optimal route found:');
    console.log(`   Steps: ${bestRoute.steps.length}`);
    console.log(`   Output: ${ethers.formatUnits(bestRoute.totalAmountOut, 18)} ${intent.tokenOut}`);
    console.log(`   Price impact: ${bestRoute.totalPriceImpact.toFixed(2)}%`);
    console.log(`   Gas estimate: ${bestRoute.totalGasEstimate.toLocaleString()}`);
    
    return bestRoute;
  }
  
  /**
   * Get pools relevant to the intent
   */
  private getRelevantPools(intent: ParsedIntent, options: RouteOptions): Pool[] {
    const tokenIn = intent.tokenIn.toUpperCase();
    const tokenOut = intent.tokenOut.toUpperCase();
    
    return this.pools.filter(pool => {
      // Must be on preferred chains
      if (!options.preferredChains.includes(pool.chainId)) {
        return false;
      }
      
      // Must involve at least one of our tokens
      const poolTokens = [pool.tokenA.symbol, pool.tokenB.symbol];
      return poolTokens.includes(tokenIn) || poolTokens.includes(tokenOut);
    });
  }
  
  /**
   * Find all possible routes up to maxHops
   */
  private async findAllRoutes(
    intent: ParsedIntent,
    pools: Pool[],
    options: RouteOptions
  ): Promise<OptimalRoute[]> {
    const routes: OptimalRoute[] = [];
    const amountIn = ethers.parseUnits(intent.amount, 18);
    
    // Direct routes (1 hop)
    const directRoutes = await this.findDirectRoutes(intent, pools, amountIn);
    routes.push(...directRoutes);
    
    // Multi-hop routes (2+ hops)
    if (options.maxHops > 1) {
      const multiHopRoutes = await this.findMultiHopRoutes(intent, pools, amountIn, options);
      routes.push(...multiHopRoutes);
    }
    
    // Filter out routes that exceed limits
    return routes.filter(route => {
      return route.totalPriceImpact <= options.maxPriceImpact &&
             route.totalGasEstimate <= 1000000; // 1M gas limit
    });
  }
  
  /**
   * Find direct swap routes (1 hop)
   */
  private async findDirectRoutes(
    intent: ParsedIntent,
    pools: Pool[],
    amountIn: bigint
  ): Promise<OptimalRoute[]> {
    const routes: OptimalRoute[] = [];
    const tokenIn = intent.tokenIn.toUpperCase();
    const tokenOut = intent.tokenOut.toUpperCase();
    
    for (const pool of pools) {
      const poolTokens = [pool.tokenA.symbol, pool.tokenB.symbol];
      
      // Check if this pool can do direct swap
      if (poolTokens.includes(tokenIn) && poolTokens.includes(tokenOut)) {
        const route = await this.computeDirectRoute(pool, intent, amountIn);
        if (route) {
          routes.push(route);
        }
      }
    }
    
    return routes;
  }
  
  /**
   * Find multi-hop routes
   */
  private async findMultiHopRoutes(
    intent: ParsedIntent,
    pools: Pool[],
    amountIn: bigint,
    options: RouteOptions
  ): Promise<OptimalRoute[]> {
    // Simplified multi-hop for hackathon
    // Production would use graph algorithms (Dijkstra, A*)
    
    const routes: OptimalRoute[] = [];
    const tokenIn = intent.tokenIn.toUpperCase();
    const tokenOut = intent.tokenOut.toUpperCase();
    
    // Common intermediate tokens for routing
    const intermediateTokens = ['USDC', 'ETH', 'USDT'];
    
    for (const intermediate of intermediateTokens) {
      if (intermediate === tokenIn || intermediate === tokenOut) continue;
      
      // Find route: tokenIn -> intermediate -> tokenOut
      const route1 = await this.findBestPoolForPair(pools, tokenIn, intermediate);
      const route2 = await this.findBestPoolForPair(pools, intermediate, tokenOut);
      
      if (route1 && route2) {
        const multiHopRoute = await this.computeMultiHopRoute(
          [route1, route2],
          intent,
          amountIn
        );
        
        if (multiHopRoute) {
          routes.push(multiHopRoute);
        }
      }
    }
    
    return routes;
  }
  
  /**
   * Compute direct route through single pool
   */
  private async computeDirectRoute(
    pool: Pool,
    intent: ParsedIntent,
    amountIn: bigint
  ): Promise<OptimalRoute | null> {
    const tokenIn = intent.tokenIn.toUpperCase();
    const isTokenAInput = pool.tokenA.symbol === tokenIn;
    
    const reserveIn = isTokenAInput ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenAInput ? pool.reserveB : pool.reserveA;
    const tokenInInfo = isTokenAInput ? pool.tokenA : pool.tokenB;
    const tokenOutInfo = isTokenAInput ? pool.tokenB : pool.tokenA;
    
    // Constant product formula with fees
    const amountOut = this.calculateSwapOutput(amountIn, reserveIn, reserveOut, pool.fee);
    
    if (amountOut <= 0n) return null;
    
    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(amountIn, reserveIn, reserveOut);
    
    const step: RouteStep = {
      poolId: pool.id,
      tokenIn: tokenInInfo,
      tokenOut: tokenOutInfo,
      amountIn,
      amountOut,
      priceImpact,
      gasEstimate: 180000, // Estimated gas for single swap
    };
    
    return {
      steps: [step],
      totalAmountOut: amountOut,
      totalPriceImpact: priceImpact,
      totalGasEstimate: step.gasEstimate,
      executionTime: 15, // seconds
      confidence: 0.95,
      chainPath: [pool.chainId],
    };
  }
  
  /**
   * Calculate swap output using constant product formula
   */
  private calculateSwapOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeBps: number
  ): bigint {
    if (reserveIn === 0n || reserveOut === 0n) return 0n;
    
    // Apply fee (fee is in basis points)
    const feeMultiplier = BigInt(10000 - feeBps);
    const amountInWithFee = (amountIn * feeMultiplier) / 10000n;
    
    // Constant product: (x + dx) * (y - dy) = x * y
    // Solving for dy: dy = (y * dx) / (x + dx)
    const numerator = reserveOut * amountInWithFee;
    const denominator = reserveIn + amountInWithFee;
    
    return numerator / denominator;
  }
  
  /**
   * Calculate price impact percentage
   */
  private calculatePriceImpact(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): number {
    if (reserveIn === 0n || reserveOut === 0n) return 100;
    
    // Price before swap
    const priceBefore = Number(reserveOut) / Number(reserveIn);
    
    // Price after swap
    const newReserveIn = reserveIn + amountIn;
    const amountOut = this.calculateSwapOutput(amountIn, reserveIn, reserveOut, 30); // 0.3% fee
    const newReserveOut = reserveOut - amountOut;
    
    if (newReserveOut <= 0n) return 100;
    
    const priceAfter = Number(newReserveOut) / Number(newReserveIn);
    
    // Calculate impact
    const impact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
    return Math.min(impact, 100);
  }
  
  /**
   * Score route based on preferences
   */
  private scoreRoute(route: OptimalRoute, options: RouteOptions): number {
    let score = 0;
    
    // Output amount (higher is better)
    const outputScore = Number(route.totalAmountOut) / 1e18;
    score += outputScore * (options.prioritizeOutput ? 0.4 : 0.2);
    
    // Price impact (lower is better)
    const impactScore = Math.max(0, 10 - route.totalPriceImpact);
    score += impactScore * 0.3;
    
    // Gas cost (lower is better)
    const gasScore = Math.max(0, 10 - route.totalGasEstimate / 100000);
    score += gasScore * (options.prioritizeGas ? 0.4 : 0.2);
    
    // Execution time (lower is better)
    const timeScore = Math.max(0, 10 - route.executionTime / 10);
    score += timeScore * 0.1;
    
    return score;
  }
  
  /**
   * Find best pool for token pair
   */
  private async findBestPoolForPair(pools: Pool[], tokenA: string, tokenB: string): Promise<Pool | null> {
    const candidates = pools.filter(pool => {
      const poolTokens = [pool.tokenA.symbol, pool.tokenB.symbol];
      return poolTokens.includes(tokenA) && poolTokens.includes(tokenB);
    });
    
    if (candidates.length === 0) return null;
    
    // Return pool with highest TVL
    return candidates.reduce((best, current) => 
      current.tvl > best.tvl ? current : best
    );
  }
  
  /**
   * Compute multi-hop route
   */
  private async computeMultiHopRoute(
    pools: Pool[],
    intent: ParsedIntent,
    amountIn: bigint
  ): Promise<OptimalRoute | null> {
    // Simplified multi-hop calculation
    // Production would handle complex routing logic
    
    const steps: RouteStep[] = [];
    let currentAmount = amountIn;
    let totalGas = 0;
    let totalPriceImpact = 0;
    
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      const route = await this.computeDirectRoute(
        pool,
        { ...intent, amount: ethers.formatUnits(currentAmount, 18) },
        currentAmount
      );
      
      if (!route) return null;
      
      steps.push(route.steps[0]);
      currentAmount = route.totalAmountOut;
      totalGas += route.totalGasEstimate;
      totalPriceImpact += route.totalPriceImpact;
    }
    
    return {
      steps,
      totalAmountOut: currentAmount,
      totalPriceImpact,
      totalGasEstimate: totalGas,
      executionTime: steps.length * 15, // 15s per step
      confidence: 0.8, // Lower confidence for multi-hop
      chainPath: pools.map(p => p.chainId),
    };
  }
  
  /**
   * Parse chain preference strings to chain IDs
   */
  private parseChainPreference(preferences: string[]): number[] {
    const chainMap: Record<string, number> = {
      'arbitrum-one': 42161,
      'arbitrum-nova': 42170,
      'orbit-l3': 421337,
      'any': 42161, // Default to Arbitrum One
      'cheapest': 42170, // Nova typically cheaper
      'fastest': 42161, // One typically faster finality
    };
    
    return preferences.map(pref => chainMap[pref] || 42161);
  }
  
  /**
   * Mock pool data for hackathon demo
   */
  private async getMockPoolData(): Promise<Pool[]> {
    // Simulated pool data that looks realistic
    return [
      {
        id: 'pool-1',
        address: '0x1234567890123456789012345678901234567890',
        tokenA: { symbol: 'USDC', address: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B0', decimals: 6, chainId: 42161 },
        tokenB: { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, chainId: 42161 },
        reserveA: ethers.parseUnits('1000000', 6),
        reserveB: ethers.parseUnits('1000000', 6),
        fee: 30, // 0.3%
        chainId: 42161,
        tvl: 2000000,
        volume24h: 500000,
      },
      {
        id: 'pool-2',
        address: '0x2345678901234567890123456789012345678901',
        tokenA: { symbol: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, chainId: 42161 },
        tokenB: { symbol: 'USDC', address: '0xA0b86a33E6441b8435b662f0E2d0B8A0E4B5B8B0', decimals: 6, chainId: 42161 },
        reserveA: ethers.parseUnits('500', 18),
        reserveB: ethers.parseUnits('1000000', 6),
        fee: 30,
        chainId: 42161,
        tvl: 2000000,
        volume24h: 1000000,
      },
      {
        id: 'pool-3',
        address: '0x3456789012345678901234567890123456789012',
        tokenA: { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, chainId: 42161 },
        tokenB: { symbol: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, chainId: 42161 },
        reserveA: ethers.parseUnits('1000000', 18),
        reserveB: ethers.parseUnits('500', 18),
        fee: 30,
        chainId: 42161,
        tvl: 1000000,
        volume24h: 200000,
      },
    ];
  }
}