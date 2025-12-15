'use client';

import { motion } from 'framer-motion';
import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Activity, DollarSign, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TOKENS, ERC20_ABI, NETWORK_CONFIG, formatTxHash, getTxExplorerUrl } from '@/lib/contracts';
import { formatUnits } from 'viem';
import Image from 'next/image';
import { arbitrum, arbitrumSepolia, arbitrumNova, mainnet, polygon } from 'wagmi/chains';

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Get current network info
  const getCurrentNetwork = () => {
    switch (chainId) {
      case arbitrum.id:
        return { name: 'Arbitrum One', type: 'Mainnet', explorer: 'https://arbiscan.io' };
      case arbitrumSepolia.id:
        return { name: 'Arbitrum Sepolia', type: 'Testnet', explorer: 'https://sepolia.arbiscan.io' };
      case arbitrumNova.id:
        return { name: 'Arbitrum Nova', type: 'Mainnet', explorer: 'https://nova.arbiscan.io' };
      case mainnet.id:
        return { name: 'Ethereum', type: 'Mainnet', explorer: 'https://etherscan.io' };
      case polygon.id:
        return { name: 'Polygon', type: 'Mainnet', explorer: 'https://polygonscan.com' };
      default:
        return { name: 'Unknown Network', type: 'Unknown', explorer: '#' };
    }
  };

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
    query: { enabled: !!address }
  });

  // Get token balances for all supported tokens
  const tokenBalances = Object.entries(TOKENS).filter(([symbol]) => symbol !== 'ETH').map(([symbol, token]) => {
    const { data: balance } = useReadContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      query: { enabled: !!address }
    });
    
    return {
      symbol,
      token,
      balance: balance || BigInt(0),
      formattedBalance: balance ? formatUnits(balance, token.decimals) : '0.00'
    };
  });

  // Calculate total portfolio value (simplified - using mock prices for demo)
  const calculatePortfolioValue = () => {
    let total = 0;
    
    // ETH value (mock price: $3500)
    if (ethBalance?.value) {
      total += parseFloat(formatUnits(ethBalance.value, 18)) * 3500;
    }
    
    // Token values (mock prices)
    const mockPrices: Record<string, number> = {
      'ARB': 0.8,
      'USDC': 1.0,
      'LINK': 15.0
    };
    
    tokenBalances.forEach(({ symbol, balance, token }) => {
      if (balance > 0 && mockPrices[symbol]) {
        const amount = parseFloat(formatUnits(balance, token.decimals));
        total += amount * mockPrices[symbol];
      }
    });
    
    return total;
  };

  // Fetch recent transactions from appropriate API based on network
  const fetchRecentTransactions = async () => {
    if (!address) return;
    
    setIsLoadingTxs(true);
    try {
      const network = getCurrentNetwork();
      let apiUrl = '';
      
      // Use appropriate API based on current network
      switch (chainId) {
        case arbitrum.id:
          apiUrl = `https://api.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
          break;
        case arbitrumSepolia.id:
          apiUrl = `https://api-sepolia.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
          break;
        case arbitrumNova.id:
          apiUrl = `https://api-nova.arbiscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
          break;
        case mainnet.id:
          apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
          break;
        case polygon.id:
          apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
          break;
        default:
          // Fallback to empty array for unknown networks
          setRecentTxs([]);
          setIsLoadingTxs(false);
          return;
      }
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === '1' && data.result) {
          setRecentTxs(data.result.slice(0, 5)); // Show last 5 transactions
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Fallback to empty array if API fails
      setRecentTxs([]);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (address && mounted) {
      fetchRecentTransactions();
    }
  }, [address, mounted, chainId]); // Add chainId to dependencies

  // Helper function to format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
            <p className="text-blue-200/70 mb-6">
              Please connect your wallet to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-blue-200/70">
            Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </motion.div>

        {/* Real Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Balance',
              value: `$${calculatePortfolioValue().toFixed(2)}`,
              change: calculatePortfolioValue() > 0 ? 'Active' : 'Empty',
              icon: Wallet,
              color: calculatePortfolioValue() > 0 ? 'text-green-400' : 'text-gray-400',
            },
            {
              title: 'ETH Balance',
              value: ethBalance ? `${parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4)} ETH` : '0.0000 ETH',
              change: ethBalance && ethBalance.value > 0 ? 'Available' : 'Empty',
              icon: Activity,
              color: ethBalance && ethBalance.value > 0 ? 'text-blue-400' : 'text-gray-400',
            },
            {
              title: 'Network',
              value: getCurrentNetwork().name,
              change: getCurrentNetwork().type,
              icon: Zap,
              color: getCurrentNetwork().type === 'Mainnet' ? 'text-green-400' : 'text-yellow-400',
            },
            {
              title: 'Transactions',
              value: recentTxs.length.toString(),
              change: isLoadingTxs ? 'Loading...' : 'Recent',
              icon: DollarSign,
              color: recentTxs.length > 0 ? 'text-purple-400' : 'text-gray-400',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <span className={`text-sm font-medium ${stat.color}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-200/70">
                    {stat.title}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Portfolio Balance
                <span className="text-sm text-blue-400 font-normal">
                  (Real Balances)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* ETH Balance */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                      <img 
                        src="/assets/Token-front-face/eth-front.png" 
                        alt="ETH" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Failed to load ETH image');
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-white text-xs font-bold">ET</span>';
                        }}
                        onLoad={() => {
                          console.log('Successfully loaded ETH image');
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{TOKENS.ETH.symbol}</div>
                      <div className="text-sm text-blue-200/70">{TOKENS.ETH.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">
                      {ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.0000'}
                    </div>
                    <div className="text-sm text-blue-200/70">
                      ${ethBalance ? (parseFloat(formatUnits(ethBalance.value, 18)) * 3500).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                {/* Token Balances */}
                {tokenBalances.map(({ symbol, token, balance, formattedBalance }, index) => {
                  // Map token symbols to their image files
                  const tokenImages: Record<string, string> = {
                    'ARB': '/assets/Token-front-face/arb-front.png',
                    'USDC': '/assets/Token-front-face/usdc-front.png',
                    'LINK': '/assets/Token-front-face/link-front.png'
                  };

                  const TokenIcon = ({ symbol, imageSrc }: { symbol: string; imageSrc: string }) => {
                    const [imageError, setImageError] = useState(false);
                    
                    return (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                        {!imageError ? (
                          <img 
                            src={imageSrc} 
                            alt={symbol} 
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.log(`Failed to load image for ${symbol}:`, imageSrc);
                              setImageError(true);
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded image for ${symbol}`);
                            }}
                          />
                        ) : (
                          <span className="text-white text-xs font-bold bg-gray-600 w-full h-full flex items-center justify-center rounded-full">{symbol.slice(0, 2)}</span>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TokenIcon symbol={symbol} imageSrc={tokenImages[symbol] || '/assets/tokens/logo.png'} />
                        <div>
                          <div className="font-medium text-white">{symbol}</div>
                          <div className="text-sm text-blue-200/70">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {parseFloat(formattedBalance).toFixed(symbol === 'USDC' ? 2 : 4)}
                        </div>
                        <div className="text-sm text-blue-200/70">
                          {balance > 0 ? (
                            <span className="text-green-400">Available</span>
                          ) : (
                            <span className="text-gray-400">Empty</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {calculatePortfolioValue() === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-blue-200/70 mb-4">No tokens found in your wallet</p>
                    <p className="text-sm text-blue-300/50">
                      Get testnet tokens from official faucets to start trading
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Recent Activity
                <span className="text-sm text-blue-400 font-normal">
                  (Real Transactions)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {isLoadingTxs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-blue-200/70">Loading transactions...</p>
                  </div>
                ) : recentTxs.length > 0 ? (
                  recentTxs.map((tx, index) => {
                    const isOutgoing = tx.from.toLowerCase() === address?.toLowerCase();
                    const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
                    const timeAgo = getTimeAgo(timestamp);
                    
                    return (
                      <div key={tx.hash} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isOutgoing ? 'bg-red-500/20' : 'bg-green-500/20'
                          }`}>
                            <ArrowRight className={`w-4 h-4 ${
                              isOutgoing ? 'text-red-400' : 'text-green-400'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {isOutgoing ? 'Sent' : 'Received'}
                              <a 
                                href={getTxExplorerUrl(tx.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-sm text-blue-200/70">
                              {formatTxHash(tx.hash)} • {formatUnits(BigInt(tx.value), 18).slice(0, 8)} ETH
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-blue-200/70">
                            {timeAgo}
                          </div>
                          <div className={`text-xs ${tx.isError === '0' ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.isError === '0' ? 'Success' : 'Failed'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-blue-200/70 mb-2">No recent transactions</p>
                    <p className="text-sm text-blue-300/50">
                      Your transaction history will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}