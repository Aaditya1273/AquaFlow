'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GasBenchmark from '@/components/GasBenchmark';

export default function AnalyticsPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
            <p className="text-blue-200/70 mb-6">
              Please connect your wallet to view analytics.
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Analytics
          </h1>
          <p className="text-blue-200/70">
            Performance metrics and gas optimization data
          </p>
        </motion.div>

        {/* Gas Benchmark Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GasBenchmark />
        </motion.div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Average Gas Savings</span>
                  <span className="text-green-400 font-bold">76.6%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Total Transactions</span>
                  <span className="text-blue-400 font-bold">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Success Rate</span>
                  <span className="text-green-400 font-bold">99.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Network Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Arbitrum One</span>
                  <span className="text-blue-400 font-bold">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Arbitrum Nova</span>
                  <span className="text-purple-400 font-bold">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/70">Other Networks</span>
                  <span className="text-gray-400 font-bold">7%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}