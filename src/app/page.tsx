'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import IntentInput from '@/components/IntentInput';
import SwapVisualizer from '@/components/SwapVisualizer';
import GasBenchmark from '@/components/GasBenchmark';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  const [currentIntent, setCurrentIntent] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);

  const handleIntentSubmit = async (intent: string) => {
    setCurrentIntent(intent);
    setIsSwapping(true);
    
    // Simulate swap execution
    setTimeout(() => {
      setSwapResult({
        amountIn: '100',
        amountOut: '99.7',
        tokenIn: 'USDC',
        tokenOut: 'USDT',
        gasUsed: '45,231',
        route: ['Arbitrum One'],
        txHash: '0x1234...5678'
      });
      setIsSwapping(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Waves className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">AquaFlow</h1>
          <span className="text-sm text-blue-300 bg-blue-800/50 px-2 py-1 rounded">
            Stylus Powered
          </span>
        </motion.div>
        
        <ConnectButton />
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            One Intent. One Click.
            <br />
            <span className="text-blue-400">All of Arbitrum.</span>
          </h2>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Intent-based liquidity routing across Arbitrum One, Nova, and Orbit L3s.
            Powered by Stylus for ultra-efficient execution.
          </p>
        </motion.div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Intent Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <IntentInput 
              onSubmit={handleIntentSubmit}
              isLoading={isSwapping}
            />
          </motion.div>

          {/* Swap Visualizer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SwapVisualizer 
              intent={currentIntent}
              isSwapping={isSwapping}
              result={swapResult}
            />
          </motion.div>
        </div>

        {/* Gas Benchmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GasBenchmark />
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Stylus Powered</h3>
            <p className="text-blue-200">
              Ultra-efficient Rust execution with 10-100x gas savings vs Solidity
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <ArrowRight className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Intent-Based</h3>
            <p className="text-blue-200">
              Just say what you want - no chain selection, no complex routing
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Orbit Ready</h3>
            <p className="text-blue-200">
              Scales across Arbitrum One, Nova, and custom Orbit L3 chains
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}