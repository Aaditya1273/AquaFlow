// Stylus Event Monitor - Real-time blockchain event visualization
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Database, 
  Network, 
  Clock,
  TrendingUp,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatNumber, formatTime } from '@/lib/utils';

interface StylelusEvent {
  id: string;
  type: 'IntentExecuted' | 'RouteComputed' | 'PoolAdded' | 'GasOptimized';
  blockNumber: number;
  txHash: string;
  timestamp: number;
  data: any;
  gasUsed: number;
  gasPrice: bigint;
}

interface EventMonitorProps {
  isActive: boolean;
  onEvent?: (event: StylelusEvent) => void;
}

export function StylelusEventMonitor({ isActive, onEvent }: EventMonitorProps) {
  const [events, setEvents] = useState<StylelusEvent[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    avgGasUsed: 0,
    gasSavings: 76,
    throughput: 0,
    memoryEfficiency: 94
  });
  
  // Simulate real-time Stylus events
  useEffect(() => {
    if (!isActive) return;
    
    const eventTypes = [
      'IntentExecuted',
      'RouteComputed', 
      'PoolAdded',
      'GasOptimized'
    ] as const;
    
    const generateEvent = (): StylelusEvent => {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const baseGas = 180000;
      const stylusGas = Math.floor(baseGas * (1 - stats.gasSavings / 100));
      
      return {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        blockNumber: 12345678 + Math.floor(Math.random() * 1000),
        txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: Date.now(),
        gasUsed: stylusGas + Math.floor(Math.random() * 10000),
        gasPrice: BigInt(Math.floor(Math.random() * 20 + 5) * 1e9), // 5-25 gwei
        data: generateEventData(type)
      };
    };
    
    const interval = setInterval(() => {
      const newEvent = generateEvent();
      
      setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
        avgGasUsed: Math.floor((prev.avgGasUsed * 0.9) + (newEvent.gasUsed * 0.1)),
        throughput: prev.throughput + 1
      }));
      
      onEvent?.(newEvent);
    }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds
    
    return () => clearInterval(interval);
  }, [isActive, stats.gasSavings]);
  
  // Reset throughput counter periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, throughput: 0 }));
    }, 10000); // Reset every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isActive) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Performance Dashboard */}
      <Card className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="h-5 w-5 text-green-400" />
            <h4 className="font-semibold text-white">Stylus Performance Monitor</h4>
            <div className="flex items-center space-x-1 ml-auto">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              icon={<Activity className="h-4 w-4" />}
              label="Events/10s"
              value={stats.throughput.toString()}
              color="text-blue-400"
              trend="up"
            />
            
            <MetricCard
              icon={<Zap className="h-4 w-4" />}
              label="Avg Gas"
              value={formatNumber.gas(BigInt(stats.avgGasUsed))}
              color="text-green-400"
              trend="down"
            />
            
            <MetricCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Gas Savings"
              value={`${stats.gasSavings}%`}
              color="text-purple-400"
              trend="up"
            />
            
            <MetricCard
              icon={<MemoryStick className="h-4 w-4" />}
              label="Memory Eff."
              value={`${stats.memoryEfficiency}%`}
              color="text-yellow-400"
              trend="stable"
            />
            
            <MetricCard
              icon={<Database className="h-4 w-4" />}
              label="Total Events"
              value={stats.totalEvents.toString()}
              color="text-cyan-400"
              trend="up"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Live Events Stream */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-white">Live Stylus Events</h4>
            </div>
            <div className="text-xs text-gray-400">
              Listening to Arbitrum blocks...
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  label, 
  value, 
  color, 
  trend 
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400'
  };
  
  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800/50 rounded-lg p-3 text-center"
    >
      <div className={`${color} mb-2 flex justify-center`}>
        {icon}
      </div>
      <div className="text-lg font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-xs text-gray-400 flex items-center justify-center space-x-1">
        <span>{label}</span>
        <span className={trendColors[trend]}>
          {trendIcons[trend]}
        </span>
      </div>
    </motion.div>
  );
}

// Event Card Component
function EventCard({ 
  event, 
  index 
}: { 
  event: StylelusEvent;
  index: number;
}) {
  const eventConfig = {
    IntentExecuted: {
      color: 'border-blue-500 bg-blue-500/10',
      icon: <Zap className="h-4 w-4 text-blue-400" />,
      title: 'Intent Executed'
    },
    RouteComputed: {
      color: 'border-purple-500 bg-purple-500/10',
      icon: <Network className="h-4 w-4 text-purple-400" />,
      title: 'Route Computed'
    },
    PoolAdded: {
      color: 'border-green-500 bg-green-500/10',
      icon: <Database className="h-4 w-4 text-green-400" />,
      title: 'Pool Added'
    },
    GasOptimized: {
      color: 'border-yellow-500 bg-yellow-500/10',
      icon: <TrendingUp className="h-4 w-4 text-yellow-400" />,
      title: 'Gas Optimized'
    }
  };
  
  const config = eventConfig[event.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`border-l-4 rounded-lg p-3 ${config.color}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {config.icon}
          <div>
            <div className="text-sm font-medium text-white">
              {config.title}
            </div>
            <div className="text-xs text-gray-400">
              Block #{event.blockNumber.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-400">
            {formatTime.relative(event.timestamp)}
          </div>
          <div className="text-xs text-green-400">
            {formatNumber.gas(BigInt(event.gasUsed))} gas
          </div>
        </div>
      </div>
      
      {/* Event Data */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(event.data).slice(0, 4).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="text-gray-300 font-mono">
              {typeof value === 'number' ? formatNumber.token(value) : String(value).slice(0, 10)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Transaction Hash */}
      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">TX:</span>
          <span className="text-xs font-mono text-gray-400">
            {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Generate realistic event data
function generateEventData(type: StylelusEvent['type']) {
  switch (type) {
    case 'IntentExecuted':
      return {
        user: '0x' + Math.random().toString(16).substring(2, 42),
        tokenIn: ['USDC', 'USDT', 'ETH', 'ARB'][Math.floor(Math.random() * 4)],
        tokenOut: ['USDC', 'USDT', 'ETH', 'ARB'][Math.floor(Math.random() * 4)],
        amountIn: Math.floor(Math.random() * 10000) + 100,
        amountOut: Math.floor(Math.random() * 9900) + 99,
        priceImpact: (Math.random() * 2).toFixed(3)
      };
      
    case 'RouteComputed':
      return {
        poolsScanned: Math.floor(Math.random() * 50) + 10,
        routeLength: Math.floor(Math.random() * 3) + 1,
        estimatedGas: Math.floor(Math.random() * 100000) + 30000,
        confidence: (0.8 + Math.random() * 0.2).toFixed(3)
      };
      
    case 'PoolAdded':
      return {
        poolAddress: '0x' + Math.random().toString(16).substring(2, 42),
        tokenA: ['USDC', 'USDT', 'ETH'][Math.floor(Math.random() * 3)],
        tokenB: ['USDC', 'USDT', 'ETH'][Math.floor(Math.random() * 3)],
        fee: [25, 30, 100][Math.floor(Math.random() * 3)],
        tvl: Math.floor(Math.random() * 10000000) + 100000
      };
      
    case 'GasOptimized':
      return {
        originalGas: Math.floor(Math.random() * 200000) + 100000,
        optimizedGas: Math.floor(Math.random() * 80000) + 30000,
        savings: Math.floor(Math.random() * 30) + 60,
        technique: ['Stylus', 'Batch', 'Cache'][Math.floor(Math.random() * 3)]
      };
      
    default:
      return {};
  }
}