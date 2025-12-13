'use client';

import { motion } from 'framer-motion';
import { BarChart3, Zap, TrendingDown } from 'lucide-react';

export default function GasBenchmark() {
  const benchmarkData = [
    {
      operation: 'Simple Swap',
      solidity: 180000,
      stylus: 45000,
      savings: 75
    },
    {
      operation: 'Multi-hop Route',
      solidity: 420000,
      stylus: 95000,
      savings: 77
    },
    {
      operation: 'Intent Resolution',
      solidity: 280000,
      stylus: 62000,
      savings: 78
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-semibold text-white">Gas Efficiency Benchmark</h3>
        <span className="text-sm text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded">
          Stylus vs Solidity
        </span>
      </div>

      <div className="grid gap-4">
        {benchmarkData.map((item, index) => (
          <motion.div
            key={item.operation}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-lg p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-medium">{item.operation}</h4>
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">{item.savings}% savings</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Solidity Bar */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400 w-16">Solidity</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-red-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                  />
                </div>
                <span className="text-sm text-white w-20 text-right">
                  {item.solidity.toLocaleString()}
                </span>
              </div>
              
              {/* Stylus Bar */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-blue-400 w-16 flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Stylus
                </span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.stylus / item.solidity) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.7, duration: 0.8 }}
                  />
                </div>
                <span className="text-sm text-white w-20 text-right">
                  {item.stylus.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-lg p-4"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-1">~76% Average Savings</p>
          <p className="text-blue-300 text-sm">
            Stylus enables ultra-efficient execution with Rust performance
          </p>
        </div>
      </motion.div>
    </div>
  );
}