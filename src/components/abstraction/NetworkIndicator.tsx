// Elite Network Indicator - Shows benefits, not technical details
'use client';

import { motion } from 'framer-motion';
import { Zap, DollarSign, Shield, Clock } from 'lucide-react';
import { useChainDetection } from '@/hooks/useChainDetection';

interface NetworkBenefit {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  description: string;
}

export function NetworkIndicator() {
  const { currentChainId, chainInfo } = useChainDetection();
  
  if (!currentChainId || !chainInfo) {
    return null;
  }
  
  // Convert technical chain info to user benefits
  const benefits: NetworkBenefit[] = [
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Fees',
      value: chainInfo.fees,
      color: 'text-green-400',
      description: 'Transaction cost level',
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: 'Speed',
      value: chainInfo.finality,
      color: 'text-blue-400',
      description: 'How fast transactions complete',
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: 'Security',
      value: getSecurityLevel(currentChainId),
      color: 'text-purple-400',
      description: 'Protection level for your funds',
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: 'Efficiency',
      value: getEfficiencyLevel(currentChainId),
      color: 'text-yellow-400',
      description: 'How optimized the network is',
    },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-3"
    >
      {/* Network Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: chainInfo.color }}
          />
          <span className="text-sm font-medium text-white">
            Connected to {getNetworkDisplayName(currentChainId)}
          </span>
        </div>
        
        <div className="text-xs text-gray-400">
          Optimal for swaps
        </div>
      </div>
      
      {/* Benefits Grid */}
      <div className="grid grid-cols-2 gap-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-lg p-2 group hover:bg-white/10 transition-colors cursor-help"
            title={benefit.description}
          >
            <div className="flex items-center space-x-2">
              <div className={benefit.color}>
                {benefit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400">
                  {benefit.label}
                </div>
                <div className="text-sm font-medium text-white truncate">
                  {benefit.value}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* AI Recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-center"
      >
        <div className="text-xs text-gray-500">
          🤖 AI selected this network for optimal performance
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper functions to convert technical details to user-friendly terms
function getNetworkDisplayName(chainId: number): string {
  const names: Record<number, string> = {
    42161: 'Arbitrum Network',
    42170: 'Nova Network', 
    421337: 'AquaFlow Network',
    421614: 'Arbitrum Testnet',
  };
  return names[chainId] || 'Arbitrum Network';
}

function getSecurityLevel(chainId: number): string {
  const levels: Record<number, string> = {
    42161: 'Maximum',
    42170: 'High',
    421337: 'High',
    421614: 'Test Mode',
  };
  return levels[chainId] || 'High';
}

function getEfficiencyLevel(chainId: number): string {
  const levels: Record<number, string> = {
    42161: 'Optimized',
    42170: 'Ultra-Fast',
    421337: 'Lightning',
    421614: 'Standard',
  };
  return levels[chainId] || 'Optimized';
}

// Compact version for header
export function CompactNetworkIndicator() {
  const { currentChainId, chainInfo } = useChainDetection();
  
  if (!currentChainId || !chainInfo) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1.5"
    >
      <div 
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: chainInfo.color }}
      />
      <span className="text-xs font-medium text-white">
        {chainInfo.fees} fees
      </span>
      <span className="text-xs text-gray-400">•</span>
      <span className="text-xs text-gray-300">
        {chainInfo.finality}
      </span>
    </motion.div>
  );
}

// Status badge for different states
export function NetworkStatusBadge({ 
  status 
}: { 
  status: 'optimal' | 'good' | 'switching' | 'error' 
}) {
  const configs = {
    optimal: {
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
      icon: <Zap className="h-3 w-3" />,
      text: 'Optimal Network',
    },
    good: {
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: <Shield className="h-3 w-3" />,
      text: 'Good Network',
    },
    switching: {
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      icon: <Clock className="h-3 w-3" />,
      text: 'Switching...',
    },
    error: {
      color: 'bg-red-500/20 text-red-300 border-red-500/30',
      icon: <DollarSign className="h-3 w-3" />,
      text: 'Network Issue',
    },
  };
  
  const config = configs[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${config.color}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </motion.div>
  );
}