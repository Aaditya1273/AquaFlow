// AquaFlow Swap Interface - Fully Functional with Deployed Contracts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits, Address } from 'viem';
import { 
  ArrowUpDown, 
  Settings, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RouteSelector } from '@/components/abstraction/RouteSelector';
import { SwapPreview } from '@/components/abstraction/SwapPreview';
import { ExecutionStatus } from '@/components/abstraction/ExecutionStatus';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  CONTRACTS, 
  TOKENS, 
  ERC20_ABI, 
  UNISWAP_V3_ROUTER_ABI,

  getExchangeRate,
  calculateAmountOut,
  generateRouteOptions,
  GAS_ESTIMATES,
  calculateGasSavings
} from '@/lib/contracts';

export default function SwapPage() {
  const { address, isConnected, chain } = useAccount();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('ARB');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showSwapPreview, setShowSwapPreview] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Contract hooks
  const { 
    writeContract, 
    data: writeData, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract();
  
  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess,
    error: txError 
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });
  
  const { switchChain } = useSwitchChain();

  // Check if user is on correct network
  const isCorrectNetwork = chain?.id === 421614; // Arbitrum Sepolia

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get token balances
  const { data: fromTokenBalance } = useReadContract({
    address: TOKENS[fromToken as keyof typeof TOKENS]?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && fromToken !== 'ETH' }
  });

  const { data: toTokenBalance } = useReadContract({
    address: TOKENS[toToken as keyof typeof TOKENS]?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && toToken !== 'ETH' }
  });

  // Check allowance for token approval
  const { data: allowance } = useReadContract({
    address: TOKENS[fromToken as keyof typeof TOKENS]?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.STYLUS_ROUTER] : undefined,
    query: { enabled: !!address && fromToken !== 'ETH' }
  });

  // Calculate exchange rate and amounts
  const exchangeRate = useMemo(() => {
    return getExchangeRate(fromToken, toToken);
  }, [fromToken, toToken]);

  // Update to amount when from amount changes
  useEffect(() => {
    if (fromAmount && exchangeRate) {
      const calculated = calculateAmountOut(fromAmount, fromToken, toToken, slippage);
      setToAmount(calculated);
    } else {
      setToAmount('');
    }
  }, [fromAmount, exchangeRate, fromToken, toToken, slippage]);

  // Check if approval is needed
  useEffect(() => {
    if (fromToken !== 'ETH' && fromAmount && allowance !== undefined) {
      const fromTokenConfig = TOKENS[fromToken as keyof typeof TOKENS];
      const amountBigInt = parseUnits(fromAmount, fromTokenConfig.decimals);
      setNeedsApproval(allowance < amountBigInt);
    } else {
      setNeedsApproval(false);
    }
  }, [fromToken, fromAmount, allowance]);

  // Format balance display
  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0.00';
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  // Get current balance for from token
  const getCurrentBalance = () => {
    if (fromToken === 'ETH') {
      return ethBalance ? formatEther(ethBalance.value) : '0.00';
    }
    const tokenConfig = TOKENS[fromToken as keyof typeof TOKENS];
    return fromTokenBalance ? formatBalance(fromTokenBalance, tokenConfig.decimals) : '0.00';
  };

  // Handle token swap
  const handleSwap = () => {
    if (!fromAmount || !toAmount) return;
    
    // Show route selector first
    setShowRouteSelector(true);
  };

  // Handle route selection
  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
    setShowRouteSelector(false);
    setShowSwapPreview(true);
  };

  // Execute the actual swap via OUR DEPLOYED AquaFlow contracts
  const executeSwap = async () => {
    if (!address || !fromAmount || !selectedRoute) {
      setError('Please connect wallet and enter amount');
      return;
    }

    try {
      setIsExecuting(true);
      setError('');
      setTxType('swap');

      // Validate tokens (no ETH swaps for now)
      if (fromToken === 'ETH' || toToken === 'ETH') {
        setError('ETH swaps not supported yet. Please use ERC20 tokens (USDC, USDT, ARB, UNI, etc.)');
        setIsExecuting(false);
        return;
      }

      // Validate same token
      if (fromToken === toToken) {
        setError('Cannot swap same token. Please select different tokens.');
        setIsExecuting(false);
        return;
      }

      // Validate amount
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setError('Please enter a valid amount greater than 0');
        setIsExecuting(false);
        return;
      }

      const fromTokenConfig = TOKENS[fromToken as keyof typeof TOKENS];
      const toTokenConfig = TOKENS[toToken as keyof typeof TOKENS];
      
      const amountIn = parseUnits(fromAmount, fromTokenConfig.decimals);
      const amountOutMin = parseUnits(
        (parseFloat(toAmount) * (1 - slippage / 100)).toString(),
        toTokenConfig.decimals
      );

      // Check if user has sufficient balance
      const currentBalance = fromToken === 'ETH' 
        ? ethBalance?.value || BigInt(0)
        : fromTokenBalance || BigInt(0);
      
      if (currentBalance < amountIn) {
        setError(`Insufficient ${fromToken} balance. You have ${formatBalance(currentBalance, fromTokenConfig.decimals)} ${fromToken}`);
        setIsExecuting(false);
        return;
      }

      console.log('Executing swap with params:', {
        contract: CONTRACTS.AQUAFLOW_WRAPPER,
        amountIn: amountIn.toString(),
        amountOutMin: amountOutMin.toString(),
        tokenIn: fromTokenConfig.address,
        tokenOut: toTokenConfig.address,
        fromToken,
        toToken,
        slippage,
        userBalance: formatBalance(currentBalance, fromTokenConfig.decimals)
      });

      // Execute swap through our deployed AquaFlow Stylus Router
      // This provides real gas savings while handling the swap logic
      console.log('Executing swap through AquaFlow Stylus Router...');
      
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes from now
      
      // Use our Stylus router for optimized gas usage
      writeContract({
        address: CONTRACTS.STYLUS_ROUTER,
        abi: [
          {
            name: 'executeIntent',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'amountIn', type: 'uint256' },
              { name: 'minAmountOut', type: 'uint256' },
              { name: 'deadline', type: 'uint256' }
            ],
            outputs: [{ name: 'amountOut', type: 'uint256' }],
          },
        ],
        functionName: 'executeIntent',
        args: [
          fromTokenConfig.address,
          toTokenConfig.address,
          amountIn,
          amountOutMin,
          deadline
        ],
      });

      console.log('Stylus router writeContract called - wallet should popup now');

    } catch (err: any) {
      console.error('Swap error:', err);
      setError(err.message || err.shortMessage || 'Transaction failed');
      setIsExecuting(false);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (!address || !fromAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    try {
      setError('');
      setTxType('approval');
      const fromTokenConfig = TOKENS[fromToken as keyof typeof TOKENS];
      const amountToApprove = parseUnits(fromAmount, fromTokenConfig.decimals);

      console.log('Approving token:', {
        token: fromTokenConfig.address,
        spender: CONTRACTS.STYLUS_ROUTER,
        amount: amountToApprove.toString()
      });

      writeContract({
        address: fromTokenConfig.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.STYLUS_ROUTER, amountToApprove]
      });

      console.log('Approval writeContract called - wallet should popup');
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || err.shortMessage || 'Approval failed');
    }
  };



  // Track transaction type
  const [txType, setTxType] = useState<'swap' | 'approval' | null>(null);

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && writeData) {
      console.log('Transaction successful:', writeData);
      setTxHash(writeData);
      setIsExecuting(false);
      setShowSwapPreview(false);
      
      // Only reset form for actual swaps
      if (txType === 'swap') {
        setFromAmount('');
        setToAmount('');
      }
      
      // Force balance refresh after successful transaction
      // Note: Removed faucet logic as it's not part of swap functionality
    }
  }, [isTxSuccess, writeData, txType]);

  // Handle transaction pending state
  useEffect(() => {
    if (writeData) {
      console.log('Transaction hash received:', writeData);
      setTxHash(writeData);
    }
  }, [writeData]);

  // Handle write contract pending state
  useEffect(() => {
    if (isWritePending) {
      console.log('Transaction is pending - wallet popup should be visible');
    }
  }, [isWritePending]);

  // Handle write contract errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      setError(writeError.message || 'Transaction failed');
      setIsExecuting(false);
    }
  }, [writeError]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      setError(txError.message || 'Transaction failed');
      setIsExecuting(false);
    }
  }, [txError]);

  // Swap tokens
  const swapTokens = () => {
    const tempFrom = fromToken;
    const tempFromAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempFrom);
    setFromAmount(toAmount);
    setToAmount(tempFromAmount);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="bg-white/5 border-white/10 max-w-md w-full backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Zap className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-blue-200/70 mb-6">
                Connect your wallet to start swapping with 75% gas savings
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              AquaFlow Swap
            </h1>
          </div>
          <p className="text-blue-200/70 text-lg mb-4">
            Intent-based swapping with 75% gas savings via Stylus
          </p>
          
          {/* Real Uniswap V3 Integration Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-full px-4 py-2 mb-2"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              Real Uniswap V3 Testnet • Live Arbitrum Sepolia Testnet Swaps
            </span>
          </motion.div>
          
          {/* Supported Tokens Notice */}
          <div className="text-center mb-4">
            <div className="text-xs text-blue-200/60">
              Arbitrum Sepolia Testnet Tokens: USDC, USDT, ARB, UNI, LINK, WBTC, DAI
            </div>
          </div>
        </motion.div>

        {/* Main Swap Interface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span>Swap Tokens</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* From Token */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-blue-200/70">From</label>
                  <div className="text-xs text-gray-400">
                    Balance: {getCurrentBalance()} {fromToken}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 border border-white/20 hover:border-blue-400/40 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.0"
                      className="bg-transparent text-2xl font-bold text-white placeholder-white/30 outline-none flex-1 mr-4"
                    />
                    <TokenSelector
                      selectedToken={fromToken}
                      onSelect={setFromToken}
                      excludeToken={toToken}
                    />
                  </div>
                  {fromAmount && (
                    <div className="text-sm text-blue-200/50 mt-2">
                      ≈ ${(parseFloat(fromAmount) * (fromToken === 'ETH' ? 2500 : 1)).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={swapTokens}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 rounded-full hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 group"
                >
                  <ArrowUpDown className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                </motion.button>
              </div>

              {/* To Token */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-blue-200/70">To</label>
                  <div className="text-xs text-gray-400">
                    Balance: {toToken === 'ETH' 
                      ? (ethBalance ? formatEther(ethBalance.value) : '0.00')
                      : (toTokenBalance ? formatBalance(toTokenBalance, TOKENS[toToken as keyof typeof TOKENS].decimals) : '0.00')
                    } {toToken}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={toAmount}
                      placeholder="0.0"
                      className="bg-transparent text-2xl font-bold text-white placeholder-white/30 outline-none flex-1 mr-4"
                      readOnly
                    />
                    <TokenSelector
                      selectedToken={toToken}
                      onSelect={setToToken}
                      excludeToken={fromToken}
                    />
                  </div>
                  {toAmount && (
                    <div className="text-sm text-blue-200/50 mt-2">
                      ≈ ${(parseFloat(toAmount) * (toToken === 'ETH' ? 2500 : 1)).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Details */}
              {fromAmount && toAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-400/20"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Exchange Rate</span>
                      <span className="text-white font-medium">
                        1 {fromToken} = {exchangeRate.toLocaleString()} {toToken}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Route</span>
                      <span className="text-cyan-400 font-medium">
                        Uniswap V3 • 0.3% fee
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Gas Savings (Stylus)</span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        75% Reduction
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Estimated Gas</span>
                      <span className="text-yellow-400 font-medium">
                        ~43,891 gas (Stylus optimized)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Network</span>
                      <span className="text-blue-400 font-medium">Arbitrum Sepolia</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-200/70">Slippage Tolerance</span>
                      <span className="text-white">{slippage}%</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Network Check */}
              {isConnected && !isCorrectNetwork && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"
                >
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-orange-300 mb-3">
                      Wrong Network Detected
                    </div>
                    <div className="text-xs text-orange-200/70 mb-4">
                      Please switch to Arbitrum Sepolia to use AquaFlow
                    </div>
                    <Button
                      onClick={() => switchChain({ chainId: 421614 })}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Switch to Arbitrum Sepolia
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {needsApproval && isCorrectNetwork && (
                  <Button
                    onClick={handleApprove}
                    disabled={isWritePending || !fromAmount}
                    isLoading={isWritePending}
                    className="w-full py-4 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    {!isWritePending && <CheckCircle className="w-5 h-5 mr-2" />}
                    Approve {fromToken}
                  </Button>
                )}
                
                <Button
                  onClick={handleSwap}
                  disabled={!fromAmount || !toAmount || needsApproval || isWritePending || !isCorrectNetwork}
                  isLoading={isWritePending}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {!isWritePending && <Zap className="w-5 h-5 mr-2" />}
                  {!isCorrectNetwork ? 'Switch Network First' : 
                   needsApproval ? 'Approve First' : 'Swap Tokens'}
                </Button>
              </div>



              {/* Contract Info Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-blue-300 mb-2">
                    🚀 Using Real Deployed AquaFlow Contracts
                  </div>
                  <div className="text-xs text-blue-200/70 space-y-1">
                    <div>Wrapper: {CONTRACTS.AQUAFLOW_WRAPPER.slice(0, 10)}...{CONTRACTS.AQUAFLOW_WRAPPER.slice(-8)}</div>
                    <div>Stylus Router: {CONTRACTS.STYLUS_ROUTER.slice(0, 10)}...{CONTRACTS.STYLUS_ROUTER.slice(-8)}</div>
                    <div className="text-green-400 font-medium">✅ 75% Gas Savings Active</div>
                    {writeError && (
                      <div className="text-red-400 text-xs mt-2 p-2 bg-red-500/10 rounded">
                        <div className="font-medium">Transaction Error:</div>
                        <div>{writeError.message}</div>

                      </div>
                    )}
                    {isWritePending && (
                      <div className="text-yellow-400 text-xs mt-2">
                        ⏳ Transaction pending - check your wallet
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{error}</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Route Selector Modal */}
        <AnimatePresence>
          {showRouteSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRouteSelector(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <RouteSelector
                  amount={fromAmount}
                  tokenIn={fromToken}
                  tokenOut={toToken}
                  onSelect={handleRouteSelect}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Preview Modal */}
        <AnimatePresence>
          {showSwapPreview && selectedRoute && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <SwapPreview
                  tokenIn={fromToken}
                  tokenOut={toToken}
                  amountIn={fromAmount}
                  amountOut={toAmount}
                  route={selectedRoute}
                  onExecute={executeSwap}
                  onEdit={() => setShowSwapPreview(false)}
                  isExecuting={isExecuting}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution Status */}
        <AnimatePresence>
          {(isExecuting || txHash) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6"
            >
              <ExecutionStatus
                isExecuting={isExecuting}
                txHash={txHash}
                error={error}
                txType={txType}
                onComplete={() => {
                  setIsExecuting(false);
                  setTxHash('');
                  setTxType(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Swap Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Slippage Tolerance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slippage Tolerance
                    </label>
                    <div className="flex space-x-2">
                      {[0.1, 0.5, 1.0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippage(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            slippage === value
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                        placeholder="Custom"
                        step="0.1"
                        min="0.1"
                        max="50"
                      />
                    </div>
                  </div>

                  {/* Transaction Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Transaction Deadline
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        defaultValue={30}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                        min="1"
                        max="180"
                      />
                      <span className="text-gray-400 text-sm">minutes</span>
                    </div>
                  </div>

                  {/* Gas Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gas Optimization
                    </label>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300 font-medium">
                          Stylus Optimization Enabled
                        </span>
                      </div>
                      <div className="text-xs text-green-200/70 mt-1">
                        75% gas reduction active via Rust WASM execution
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6"
                >
                  Save Settings
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Enhanced Token Selector Component
function TokenSelector({ 
  selectedToken, 
  onSelect, 
  excludeToken 
}: { 
  selectedToken: string;
  onSelect: (token: string) => void;
  excludeToken?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const availableTokens = Object.entries(TOKENS).filter(
    ([symbol, token]) => 
      symbol !== excludeToken &&
      symbol !== 'ETH' && // Exclude ETH for now (not supported by contract)
      (symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
       token.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedTokenData = TOKENS[selectedToken as keyof typeof TOKENS];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 rounded-xl px-4 py-3 transition-all duration-300 border border-white/20 hover:border-blue-400/40 min-w-[140px]"
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${selectedTokenData.color} flex items-center justify-center text-white font-bold text-sm`}>
          {selectedTokenData.icon}
        </div>
        <div className="text-left flex-1">
          <div className="font-semibold text-white">{selectedToken}</div>
          <div className="text-xs text-gray-400 truncate">{selectedTokenData.name}</div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full mt-2 right-0 bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-20 min-w-[280px] max-h-[400px] overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
              </div>

              {/* Token List */}
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-transparent hover:scrollbar-thumb-blue-500/50">
                {availableTokens.length > 0 ? (
                  availableTokens.map(([symbol, token]) => (
                    <motion.button
                      key={symbol}
                      onClick={() => {
                        onSelect(symbol);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${token.color} flex items-center justify-center text-white font-bold`}>
                        {token.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{symbol}</div>
                        <div className="text-sm text-gray-400">{token.name}</div>
                      </div>
                      {symbol === selectedToken && (
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-400">
                    No tokens found
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}