'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Image from 'next/image';

export default function PortfolioPage() {
  const { isConnected } = useAccount();

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

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { symbol: 'ETH', name: 'Ethereum', balance: '2.5 ETH', value: '$6,250.00', percentage: 50.2, icon: '/assets/tokens/eth.png' },
                  { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00 USDC', value: '$1,250.00', percentage: 10.0, icon: '/assets/tokens/usdc.png' },
                  { symbol: 'ARB', name: 'Arbitrum', balance: '5,000 ARB', value: '$4,950.32', percentage: 39.8, icon: '/assets/tokens/Arb1.png' },
                ].map((token, index) => (
                  <motion.div
                    key={token.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Image src={token.icon} alt={token.symbol} width={40} height={40} />
                      <div>
                        <div className="font-semibold text-white">{token.symbol}</div>
                        <div className="text-sm text-blue-200/70">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{token.value}</div>
                      <div className="text-sm text-blue-200/70">{token.balance}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">{token.percentage}%</div>
                      <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${token.percentage}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    +$1,234.56
                  </div>
                  <div className="text-sm text-blue-200/70">Total P&L</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-blue-200/70">24h Change</span>
                    <span className="text-green-400 font-semibold">+5.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200/70">7d Change</span>
                    <span className="text-green-400 font-semibold">+12.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200/70">Gas Saved</span>
                    <span className="text-yellow-400 font-semibold">$234.56</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}