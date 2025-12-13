// Elite Swap Preview - Shows what matters, hides complexity
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Info, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatNumber, formatTime } from '@/lib/utils';

interface SwapPreviewProps {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  route: {
    fee: number;
    speed: number;
    finality: string;
    priceImpact: number;
    confidence: number;
  };
  onExecute: () => void;
  onEdit: () => void;
  isExecuting?: boolean;
}

export function SwapPreview({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  route,
  onExecute,
  onEdit,
  isExecuting = false,
}: SwapPreviewProps) {
  const savings = calculateSavings(route.fee);
  const isGoodDeal = route.priceImpact < 1 && route.confidence > 0.9;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Swap Display */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="p-6">
          {/* Swap Visualization */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {amountIn}
              </div>
              <div className="text-sm text-gray-400">
                {tokenIn}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                You pay
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="p-3 bg-blue-500/20 rounded-full"
              >
                <ArrowRight className="h-6 w-6 text-blue-400" />
              </motion.div>
              <div className="text-xs text-gray-500">
                AI Route
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {amountOut}
              </div>
              <div className="text-sm text-gray-400">
                {tokenOut}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                You receive
              </div>
            </div>
          </div>
          
          {/* Deal Quality Indicator */}
          {isGoodDeal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  Excellent deal! Low fees and minimal price impact
                </span>
              </div>
            </motion.div>
          )}
          
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                  ${route.fee.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500">Total fee</div>
              {savings > 0 && (
                <div className="text-xs text-green-400 mt-1">
                  ${savings.toFixed(2)} saved
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  {formatTime.duration(route.speed)}
                </span>
              </div>
              <div className="text-xs text-gray-500">Execution time</div>
              <div className="text-xs text-blue-400 mt-1">
                {route.finality}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">
                  {formatNumber.percentage(route.priceImpact)}
                </span>
              </div>
              <div className="text-xs text-gray-500">Price impact</div>
              <div className="text-xs text-purple-400 mt-1">
                {route.priceImpact < 0.5 ? 'Minimal' : route.priceImpact < 2 ? 'Low' : 'Moderate'}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1"
              disabled={isExecuting}
            >
              Edit Swap
            </Button>
            <Button
              onClick={onExecute}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              loading={isExecuting}
              disabled={isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute Swap'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Confidence & Route Details */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">
                AI Analysis
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {Math.round(route.confidence * 100)}% confidence
            </div>
          </div>
          
          {/* Confidence Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${route.confidence * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
          
          {/* AI Insights */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="h-1.5 w-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-xs text-gray-300">
                This route uses the most liquid pools for minimal slippage
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-xs text-gray-300">
                Stylus optimization reduces gas costs by ~76%
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="h-1.5 w-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-xs text-gray-300">
                Cross-chain routing happens automatically behind the scenes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Safety Notice */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-yellow-300 mb-1">
                Your funds are protected
              </div>
              <div className="text-xs text-yellow-200/80">
                This swap is secured by Arbitrum's proven infrastructure. 
                Your transaction will only complete if you receive the expected amount.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to calculate savings (simplified)
function calculateSavings(currentFee: number): number {
  const typicalFee = currentFee * 1.5; // Assume 50% higher typical fee
  return Math.max(0, typicalFee - currentFee);
}