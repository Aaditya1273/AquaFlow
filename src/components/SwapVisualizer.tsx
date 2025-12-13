'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Clock, Zap, ExternalLink } from 'lucide-react';

interface SwapVisualizerProps {
  intent: string;
  isSwapping: boolean;
  result: any;
}

export default function SwapVisualizer({ intent, isSwapping, result }: SwapVisualizerProps) {
  const steps = [
    { id: 1, label: 'Intent Parsed', icon: CheckCircle, status: intent ? 'complete' : 'pending' },
    { id: 2, label: 'Route Computed', icon: Zap, status: isSwapping ? 'active' : intent ? 'complete' : 'pending' },
    { id: 3, label: 'Stylus Execution', icon: Clock, status: isSwapping ? 'active' : result ? 'complete' : 'pending' },
    { id: 4, label: 'Settlement', icon: CheckCircle, status: result ? 'complete' : 'pending' }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-6">Execution Flow</h3>

      {/* Progress Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.status === 'complete' ? 'bg-green-500' :
              step.status === 'active' ? 'bg-blue-500 animate-pulse' :
              'bg-gray-600'
            }`}>
              <step.icon className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm ${
              step.status === 'complete' ? 'text-green-300' :
              step.status === 'active' ? 'text-blue-300' :
              'text-gray-400'
            }`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Intent Display */}
      {intent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4 mb-4"
        >
          <p className="text-sm text-blue-300 mb-1">Current Intent:</p>
          <p className="text-white font-medium">"{intent}"</p>
        </motion.div>
      )}

      {/* Swap Animation */}
      <AnimatePresence>
        {isSwapping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 mb-4"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">USDC</span>
                </div>
                <p className="text-blue-300 text-sm">100</p>
              </div>
              
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ArrowRight className="w-8 h-8 text-white" />
              </motion.div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">USDT</span>
                </div>
                <p className="text-green-300 text-sm">~99.7</p>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-blue-300 text-sm"
              >
                Stylus router optimizing execution...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-medium">Swap Completed</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Input</p>
                <p className="text-white">{result.amountIn} {result.tokenIn}</p>
              </div>
              <div>
                <p className="text-gray-400">Output</p>
                <p className="text-white">{result.amountOut} {result.tokenOut}</p>
              </div>
              <div>
                <p className="text-gray-400">Gas Used</p>
                <p className="text-white">{result.gasUsed}</p>
              </div>
              <div>
                <p className="text-gray-400">Route</p>
                <p className="text-white">{result.route.join(' → ')}</p>
              </div>
            </div>
            
            <button className="mt-3 flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm">
              <ExternalLink className="w-4 h-4" />
              <span>View on Explorer</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}