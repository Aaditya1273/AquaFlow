'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ArrowUpDown, Settings, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function SwapPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
            <p className="text-blue-200/70 mb-6">
              Please connect your wallet to access the swap interface.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            AquaFlow Swap
          </h1>
          <p className="text-blue-200/70">
            Intent-based swapping with natural language
          </p>
        </motion.div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>Swap Tokens</span>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <label className="text-sm text-blue-200/70">From</label>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-bold text-white placeholder-white/50 outline-none flex-1"
                  />
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Image src="/assets/tokens/eth.png" alt="ETH" width={24} height={24} />
                    <span className="font-medium text-white">ETH</span>
                  </div>
                </div>
                <div className="text-sm text-blue-200/50 mt-2">
                  Balance: 2.5 ETH
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-blue-500/20 border border-blue-400/40 rounded-full hover:bg-blue-500/30 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5 text-blue-400" />
              </motion.button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <label className="text-sm text-blue-200/70">To</label>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="bg-transparent text-2xl font-bold text-white placeholder-white/50 outline-none flex-1"
                    readOnly
                  />
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Image src="/assets/tokens/usdc.png" alt="USDC" width={24} height={24} />
                    <span className="font-medium text-white">USDC</span>
                  </div>
                </div>
                <div className="text-sm text-blue-200/50 mt-2">
                  Balance: 1,250.00 USDC
                </div>
              </div>
            </div>

            {/* Swap Details */}
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/20">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-200/70">Rate</span>
                <span className="text-white">1 ETH = 2,500 USDC</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-blue-200/70">Gas Savings</span>
                <span className="text-green-400 font-semibold">76% (Stylus)</span>
              </div>
            </div>

            {/* Swap Button */}
            <Button className="w-full py-6 text-lg font-bold">
              <Zap className="w-5 h-5 mr-2" />
              Swap Tokens
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}