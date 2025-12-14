'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { TrendingUp, Wallet, Activity, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Image from 'next/image';

export default function DashboardPage() {
  const { isConnected, address } = useAccount();

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Balance',
              value: '$12,450.32',
              change: '+5.2%',
              icon: Wallet,
              color: 'text-green-400',
            },
            {
              title: 'Total Swaps',
              value: '47',
              change: '+12',
              icon: Activity,
              color: 'text-blue-400',
            },
            {
              title: 'Gas Saved',
              value: '$234.56',
              change: '76%',
              icon: Zap,
              color: 'text-yellow-400',
            },
            {
              title: 'Volume (24h)',
              value: '$3,240.00',
              change: '+18.5%',
              icon: DollarSign,
              color: 'text-purple-400',
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
              <CardTitle className="text-white">Portfolio Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { symbol: 'ETH', name: 'Ethereum', balance: '2.5', value: '$6,250.00', icon: '/assets/tokens/eth.png' },
                  { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', value: '$1,250.00', icon: '/assets/tokens/usdc.png' },
                  { symbol: 'ARB', name: 'Arbitrum', balance: '5,000', value: '$4,950.32', icon: '/assets/tokens/Arb1.png' },
                ].map((token, index) => (
                  <div key={token.symbol} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image src={token.icon} alt={token.symbol} width={32} height={32} />
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-sm text-blue-200/70">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">{token.balance}</div>
                      <div className="text-sm text-blue-200/70">{token.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { type: 'Swap', from: 'ETH', to: 'USDC', amount: '0.5 ETH', time: '2 hours ago' },
                  { type: 'Swap', from: 'USDC', to: 'ARB', amount: '500 USDC', time: '1 day ago' },
                  { type: 'Swap', from: 'ARB', to: 'ETH', amount: '1000 ARB', time: '3 days ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {activity.from} → {activity.to}
                        </div>
                        <div className="text-sm text-blue-200/70">{activity.amount}</div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-200/70">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}