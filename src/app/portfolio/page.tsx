'use client';

import { motion } from 'framer-motion';
import { useAccount, useReadContract, useBalance, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';
import { TrendingUp, PieChart, BarChart3, Wallet, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TOKENS, ERC20_ABI, NETWORK_CONFIG, getTxExplorerUrl } from '@/lib/contracts';
import { formatUnits } from 'viem';
import Image from 'next/image';
import { arbitrum, arbitrumSepolia, arbitrumNova, mainnet, polygon } from 'wagmi/chains';

export default function PortfolioPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

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

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const mockPrices: Record<string, number> = {
      'ETH': 3500,
      'ARB': 0.8,
      'USDC': 1.0,
      'LINK': 15.0
    };

    let totalValue = 0;
    const assets: any[] = [];

    // ETH
    if (ethBalance?.value) {
      const ethAmount = parseFloat(formatUnits(ethBalance.value, 18));
      const ethValue = ethAmount * mockPrices.ETH;
      totalValue += ethValue;
      
      if (ethAmount > 0) {
        assets.push({
          symbol: 'ETH',
          name: 'Ethereum',
          balance: `${ethAmount.toFixed(4)} ETH`,
          value: ethValue,
          amount: ethAmount,
          icon: TOKENS.ETH.icon,
          color: TOKENS.ETH.color
        });
      }
    }

    // Tokens
    tokenBalances.forEach(({ symbol, token, balance, formattedBalance }) => {
      if (balance > 0 && mockPrices[symbol]) {
        const amount = parseFloat(formattedBalance);
        const value = amount * mockPrices[symbol];
        totalValue += value;
        
        assets.push({
          symbol,
          name: token.name,
          balance: `${amount.toFixed(symbol === 'USDC' ? 2 : 4)} ${symbol}`,
          value,
          amount,
          icon: token.icon,
          color: token.color
        });
      }
    });

    // Calculate percentages
    const assetsWithPercentages = assets.map(asset => ({
      ...asset,
      percentage: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
    }));

    return {
      totalValue,
      assets: assetsWithPercentages,
      hasAssets: assets.length > 0
    };
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
            <p className="text-blue-200/70 mb-6">
              Please connect your wallet to view your portfolio.
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Portfolio
          </h1>
          <p className="text-blue-200/70">
            Track your DeFi investments and performance
          </p>
        </motion.div>

        {/* Real Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Asset Allocation
                <span className="text-sm text-purple-400 font-normal">
                  (Real Balances)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const { totalValue, assets, hasAssets } = calculatePortfolioMetrics();
                
                if (!hasAssets) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wallet className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4">No Assets Found</h3>
                      <p className="text-blue-200/70 mb-6 max-w-md mx-auto">
                        Your portfolio is empty. Get some testnet tokens to start building your portfolio.
                      </p>
                      <div className="space-y-2 text-sm text-blue-300/60">
                        <p>• Get ETH: <a href="https://faucet.quicknode.com/arbitrum/sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">QuickNode Faucet</a></p>
                        <p>• Get USDC: <a href="https://faucet.circle.com/arbitrum-sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Circle Faucet</a></p>
                        <p>• Get LINK: <a href="https://faucets.chain.link/arbitrum-sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Chainlink Faucet</a></p>
                      </div>
                    </div>
                  );
                }

                // Map token symbols to their image files
                const tokenImages: Record<string, string> = {
                  'ETH': '/assets/Token-front-face/eth-front.png',
                  'ARB': '/assets/Token-front-face/arb-front.png',
                  'USDC': '/assets/Token-front-face/usdc-front.png',
                  'LINK': '/assets/Token-front-face/link-front.png'
                };

                const TokenIcon = ({ symbol, imageSrc }: { symbol: string; imageSrc: string }) => {
                  const [imageError, setImageError] = useState(false);
                  
                  return (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
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
                  <div className="space-y-4">
                    {assets.map((asset, index) => {
                      return (
                        <motion.div
                          key={asset.symbol}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <TokenIcon symbol={asset.symbol} imageSrc={tokenImages[asset.symbol] || '/assets/tokens/logo.png'} />
                            <div>
                              <div className="font-semibold text-white">{asset.symbol}</div>
                              <div className="text-sm text-blue-200/70">{asset.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white">${asset.value.toFixed(2)}</div>
                            <div className="text-sm text-blue-200/70">{asset.balance}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-purple-400">{asset.percentage.toFixed(1)}%</div>
                            <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(asset.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Portfolio Summary
                <span className="text-sm text-purple-400 font-normal">
                  (Real Data)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const { totalValue, assets, hasAssets } = calculatePortfolioMetrics();
                
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        ${totalValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-200/70">Total Portfolio Value</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Total Assets</span>
                        <span className="text-white font-semibold">{assets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Network</span>
                        <span className={`font-semibold ${getCurrentNetwork().type === 'Mainnet' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {getCurrentNetwork().name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200/70">Wallet</span>
                        <span className="text-purple-400 font-semibold">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                        </span>
                      </div>
                      {hasAssets && (
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200/70">View on Explorer</span>
                            <a 
                              href={`${getCurrentNetwork().explorer}/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}