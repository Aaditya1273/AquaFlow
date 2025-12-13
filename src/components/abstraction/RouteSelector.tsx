// Elite Chain Abstraction UX - Users never see chains, only benefits
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Shield, DollarSign, CheckCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatNumber, formatTime } from '@/lib/utils';

interface RouteOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  
  // User-friendly metrics (no technical details)
  fee: number;        // USD amount
  speed: number;      // seconds
  finality: string;   // human readable
  confidence: number; // 0-1
  
  // Hidden technical details
  chainId: number;
  gasEstimate: bigint;
  bridgeRequired: boolean;
}

interface RouteSelectorProps {
  amount: string;
  tokenIn: string;
  tokenOut: string;
  onSelect: (route: RouteOption) => void;
  selectedRoute?: RouteOption;
}

export function RouteSelector({ 
  amount, 
  tokenIn, 
  tokenOut, 
  onSelect, 
  selectedRoute 
}: RouteSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // AI-curated route options (technical complexity hidden)
  const routes: RouteOption[] = [
    {
      id: 'optimal',
      name: 'Optimal',
      description: 'Best overall value - recommended by AI',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-blue-500',
      fee: 0.12,
      speed: 15,
      finality: 'Instant',
      confidence: 0.95,
      chainId: 42161,
      gasEstimate: 45000n,
      bridgeRequired: false,
    },
    {
      id: 'cheapest',
      name: 'Cheapest',
      description: 'Lowest fees for your swap',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-400',
      gradient: 'from-green-500 to-emerald-500',
      fee: 0.08,
      speed: 25,
      finality: 'Very Fast',
      confidence: 0.88,
      chainId: 42170,
      gasEstimate: 32000n,
      bridgeRequired: false,
    },
    {
      id: 'fastest',
      name: 'Fastest',
      description: 'Lightning-fast execution',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500 to-orange-500',
      fee: 0.18,
      speed: 8,
      finality: 'Instant',
      confidence: 0.92,
      chainId: 421337,
      gasEstimate: 28000n,
      bridgeRequired: false,
    },
    {
      id: 'secure',
      name: 'Most Secure',
      description: 'Maximum security and finality',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-indigo-500',
      fee: 0.15,
      speed: 45,
      finality: 'Guaranteed',
      confidence: 0.98,
      chainId: 42161,
      gasEstimate: 52000n,
      bridgeRequired: false,
    },
  ];
  
  const handleSelect = (route: RouteOption) => {
    onSelect(route);
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Choose Your Experience
        </h3>
        <p className="text-sm text-gray-400">
          AI found {routes.length} ways to swap {amount} {tokenIn} → {tokenOut}
        </p>
      </div>
      
      {/* Route Options */}
      <div className="grid gap-3">
        {routes.map((route, index) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={selectedRoute?.id === route.id}
            onSelect={() => handleSelect(route)}
            index={index}
          />
        ))}
      </div>
      
      {/* Advanced Details Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} technical details
        </button>
      </div>
      
      {/* Technical Details (Hidden by Default) */}
      <AnimatePresence>
        {showDetails && selectedRoute && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Technical Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Network:</span>
                    <span className="ml-2 text-gray-300">
                      {getChainName(selectedRoute.chainId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gas Estimate:</span>
                    <span className="ml-2 text-gray-300">
                      {formatNumber.gas(selectedRoute.gasEstimate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Bridge Required:</span>
                    <span className="ml-2 text-gray-300">
                      {selectedRoute.bridgeRequired ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="ml-2 text-gray-300">
                      {Math.round(selectedRoute.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual Route Card Component
function RouteCard({ 
  route, 
  isSelected, 
  onSelect, 
  index 
}: { 
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/50' 
            : 'hover:bg-white/5 border-gray-700'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Route Info */}
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${route.gradient}`}>
                <div className="text-white">
                  {route.icon}
                </div>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-white">
                    {route.name}
                  </h4>
                  {route.id === 'optimal' && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {route.description}
                </p>
              </div>
            </div>
            
            {/* Selection Indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-blue-400"
              >
                <CheckCircle className="h-5 w-5" />
              </motion.div>
            )}
          </div>
          
          {/* Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Fee</div>
              <div className="text-sm font-medium text-white">
                ${route.fee.toFixed(2)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Speed</div>
              <div className="text-sm font-medium text-white">
                {formatTime.duration(route.speed)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Finality</div>
              <div className="text-sm font-medium text-white">
                {route.finality}
              </div>
            </div>
          </div>
          
          {/* Confidence Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>AI Confidence</span>
              <span>{Math.round(route.confidence * 100)}%</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${route.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${route.confidence * 100}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to get chain name (hidden from user)
function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    42161: 'Arbitrum One',
    42170: 'Arbitrum Nova',
    421337: 'AquaFlow L3',
  };
  return names[chainId] || `Chain ${chainId}`;
}