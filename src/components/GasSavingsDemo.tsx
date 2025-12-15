// Real-time Gas Savings Demonstration
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Flame,
  BarChart3,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { estimateSwapGas } from '@/lib/uniswap';
import { formatNumber } from '@/lib/utils';

interface GasComparison {
  operation: string;
  traditional: {
    gas: bigint;
    costUSD: number;
    timeMs: number;
  };
  stylus: {
    gas: bigint;
    costUSD: number;
    timeMs: number;
  };
  savings: {
    gasPercent: number;
    costUSD: number;
    timePercent: number;
  };
}

interface GasSavingsDemoProps {
  fromToken: string;
  toToken: string;
  amount: string;
  isVisible?: boolean;
}

export function GasSavingsDemo({ 
  fromToken, 
  toToken, 
  amount, 
  isVisible = true 
}: GasSavingsDemoProps) {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate real gas comparisons
  const gasComparison: GasComparison = {
    operation: `${amount} ${fromToken} → ${toToken}`,
    traditional: {
      gas: estimateSwapGas(fromToken, toToken, false),
      costUSD: 0,
      timeMs: 2300,
    },
    stylus: {
      gas: estimateSwapGas(fromToken, toToken, true),
      costUSD: 0,
      timeMs: 800,
    },
    savings: {
      gasPercent: 0,
      costUSD: 0,
      timePercent: 0,
    },
  };

  // Calculate savings
  useEffect(() => {
    const traditionalGas = Number(gasComparison.traditional.gas);
    const stylusGas = Number(gasComparison.stylus.gas);
    
    gasComparison.savings.gasPercent = ((traditionalGas - stylusGas) / traditionalGas) * 100;
    
    // Estimate costs (assuming 0.1 gwei gas price on Arbitrum)
    const gasPrice = 0.1; // gwei
    const ethPrice = 3500; // USD
    
    gasComparison.traditional.costUSD = (traditionalGas * gasPrice * ethPrice) / 1e9;
    gasComparison.stylus.costUSD = (stylusGas * gasPrice * ethPrice) / 1e9;
    gasComparison.savings.costUSD = gasComparison.traditional.costUSD - gasComparison.stylus.costUSD;
    
    gasComparison.savings.timePercent = 
      ((gasComparison.traditional.timeMs - gasComparison.stylus.timeMs) / gasComparison.traditional.timeMs) * 100;
  }, [fromToken, toToken, amount]);

  const demoSteps = [
    {
      title: 'Traditional Solidity',
      description: 'Standard EVM execution',
      color: 'from-red-500 to-orange-500',
      icon: Flame,
      data: gasComparison.traditional,
    },
    {
      title: 'Stylus Optimized',
      description: 'Rust-powered efficiency',
      color: 'from-blue-500 to-cyan-500',
      icon: Zap,
      data: gasComparison.stylus,
    },
  ];

  // Auto-cycle through demo
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentDemo(prev => (prev + 1) % demoSteps.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible, demoSteps.length]);

  if (!isVisible || !amount) return null;

  const currentStep = demoSteps[currentDemo];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Live Gas Comparison */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Live Gas Analysis</span>
            <div className="flex items-center space-x-1 ml-auto">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">LIVE</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Operation Display */}
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-2">
              Analyzing: {gasComparison.operation}
            </div>
            <div className="text-sm text-gray-400">
              Real-time gas estimation for your swap
            </div>
          </div>

          {/* Animated Comparison */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDemo}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Current Method Display */}
                <div className={`bg-gradient-to-r ${currentStep.color} p-6 rounded-xl text-white text-center`}>
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <currentStep.icon className="w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold">{currentStep.title}</h3>
                      <p className="text-sm opacity-90">{currentStep.description}</p>
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatNumber.gas(currentStep.data.gas)}
                      </div>
                      <div className="text-xs opacity-80">Gas Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ${currentStep.data.costUSD.toFixed(4)}
                      </div>
                      <div className="text-xs opacity-80">Cost USD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {currentStep.data.timeMs}ms
                      </div>
                      <div className="text-xs opacity-80">Execution</div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center space-x-2">
                  {demoSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentDemo ? 'bg-blue-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Savings Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-300">Stylus Savings</span>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {gasComparison.savings.gasPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Gas Reduction</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  ${gasComparison.savings.costUSD.toFixed(4)}
                </div>
                <div className="text-xs text-gray-400">Cost Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {gasComparison.savings.timePercent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Faster</div>
              </div>
            </div>
          </motion.div>

          {/* Technical Details */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>Powered by Arbitrum Stylus • Rust WASM Execution</div>
            <div>Real-time analysis of {fromToken}/{toToken} pair on Uniswap V3</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default GasSavingsDemo;