// Elite Flow Diagram - Visual representation of intent → routing → settlement
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Route, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Layers,
  Network,
  Shield,
  Target
} from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'intent' | 'routing' | 'execution' | 'settlement';
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete';
  position: { x: number; y: number };
  data?: any;
}

interface FlowConnection {
  from: string;
  to: string;
  status: 'pending' | 'active' | 'complete';
  data?: any;
}

interface FlowDiagramProps {
  isActive: boolean;
  intent: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  };
  onStepComplete?: (step: string, data: any) => void;
}

export function FlowDiagram({ isActive, intent, onStepComplete }: FlowDiagramProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataFlow, setDataFlow] = useState<Array<{ id: string; from: string; to: string; data: any }>>([]);
  
  // Initialize flow diagram
  useEffect(() => {
    if (isActive) {
      const flowNodes: FlowNode[] = [
        {
          id: 'intent-parse',
          type: 'intent',
          name: 'Intent Parsing',
          description: 'AI understanding user request',
          icon: <Brain className="h-6 w-6" />,
          status: 'pending',
          position: { x: 10, y: 50 },
          data: { confidence: 0, tokens: [] }
        },
        {
          id: 'route-discovery',
          type: 'routing',
          name: 'Route Discovery',
          description: 'Scanning liquidity pools',
          icon: <Network className="h-6 w-6" />,
          status: 'pending',
          position: { x: 35, y: 20 },
          data: { poolsFound: 0, chains: [] }
        },
        {
          id: 'route-optimization',
          type: 'routing',
          name: 'Route Optimization',
          description: 'Computing optimal path',
          icon: <Target className="h-6 w-6" />,
          status: 'pending',
          position: { x: 35, y: 80 },
          data: { gasEstimate: 0, priceImpact: 0 }
        },
        {
          id: 'stylus-execution',
          type: 'execution',
          name: 'Stylus Execution',
          description: 'Rust smart contract processing',
          icon: <Zap className="h-6 w-6" />,
          status: 'pending',
          position: { x: 65, y: 35 },
          data: { gasUsed: 0, efficiency: 0 }
        },
        {
          id: 'cross-chain',
          type: 'execution',
          name: 'Cross-Chain Bridge',
          description: 'Multi-chain coordination',
          icon: <Layers className="h-6 w-6" />,
          status: 'pending',
          position: { x: 65, y: 65 },
          data: { fromChain: '', toChain: '' }
        },
        {
          id: 'settlement',
          type: 'settlement',
          name: 'Settlement',
          description: 'Transaction finalization',
          icon: <Shield className="h-6 w-6" />,
          status: 'pending',
          position: { x: 90, y: 50 },
          data: { blockNumber: 0, finality: '' }
        }
      ];
      
      const flowConnections: FlowConnection[] = [
        { from: 'intent-parse', to: 'route-discovery', status: 'pending' },
        { from: 'intent-parse', to: 'route-optimization', status: 'pending' },
        { from: 'route-discovery', to: 'stylus-execution', status: 'pending' },
        { from: 'route-optimization', to: 'stylus-execution', status: 'pending' },
        { from: 'stylus-execution', to: 'cross-chain', status: 'pending' },
        { from: 'cross-chain', to: 'settlement', status: 'pending' }
      ];
      
      setNodes(flowNodes);
      setConnections(flowConnections);
      executeFlow(flowNodes, flowConnections);
    }
  }, [isActive]);
  
  // Execute flow with realistic timing
  const executeFlow = async (flowNodes: FlowNode[], flowConnections: FlowConnection[]) => {
    const executionOrder = [
      'intent-parse',
      'route-discovery',
      'route-optimization', 
      'stylus-execution',
      'cross-chain',
      'settlement'
    ];
    
    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      
      // Activate current node
      setNodes(prev => prev.map(node => ({
        ...node,
        status: node.id === nodeId ? 'active' : 
                executionOrder.indexOf(node.id) < i ? 'complete' : 'pending'
      })));
      
      // Activate incoming connections
      setConnections(prev => prev.map(conn => ({
        ...conn,
        status: conn.to === nodeId ? 'active' : 
                executionOrder.indexOf(conn.to) < i ? 'complete' : 'pending'
      })));
      
      // Generate data flow
      if (i > 0) {
        const prevNodeId = executionOrder[i - 1];
        generateDataFlow(prevNodeId, nodeId);
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
      
      // Complete current node with data
      const nodeData = generateNodeData(nodeId, intent);
      setNodes(prev => prev.map(node => ({
        ...node,
        status: node.id === nodeId ? 'complete' : node.status,
        data: node.id === nodeId ? nodeData : node.data
      })));
      
      onStepComplete?.(nodeId, nodeData);
      setCurrentStep(i + 1);
    }
  };
  
  // Generate data flow animation
  const generateDataFlow = (from: string, to: string) => {
    const flowId = `flow-${Date.now()}`;
    const flowData = {
      id: flowId,
      from,
      to,
      data: generateFlowData(from, to)
    };
    
    setDataFlow(prev => [...prev, flowData]);
    
    // Remove after animation
    setTimeout(() => {
      setDataFlow(prev => prev.filter(f => f.id !== flowId));
    }, 2000);
  };
  
  if (!isActive) {
    return null;
  }
  
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Flow Connections */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {connections.map((connection) => {
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);
          
          if (!fromNode || !toNode) return null;
          
          const x1 = `${fromNode.position.x}%`;
          const y1 = `${fromNode.position.y}%`;
          const x2 = `${toNode.position.x}%`;
          const y2 = `${toNode.position.y}%`;
          
          return (
            <motion.line
              key={`${connection.from}-${connection.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={connection.status === 'complete' ? 'url(#connectionGradient)' : 
                     connection.status === 'active' ? '#3B82F6' : '#374151'}
              strokeWidth={connection.status === 'active' ? '3' : '2'}
              strokeDasharray={connection.status === 'pending' ? '5,5' : '0'}
              filter={connection.status === 'active' ? 'url(#glow)' : 'none'}
              initial={{ pathLength: 0, opacity: 0.3 }}
              animate={{ 
                pathLength: connection.status !== 'pending' ? 1 : 0,
                opacity: connection.status === 'active' ? 1 : 0.6
              }}
              transition={{ duration: 1 }}
            />
          );
        })}
      </svg>
      
      {/* Flow Nodes */}
      {nodes.map((node) => (
        <FlowNodeComponent
          key={node.id}
          node={node}
          isActive={node.status === 'active'}
          isComplete={node.status === 'complete'}
        />
      ))}
      
      {/* Data Flow Animations */}
      <AnimatePresence>
        {dataFlow.map((flow) => (
          <DataFlowAnimation
            key={flow.id}
            flow={flow}
            nodes={nodes}
          />
        ))}
      </AnimatePresence>
      
      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm text-white mb-2">
            <span>Flow Progress</span>
            <span>{Math.round((currentStep / nodes.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / nodes.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Flow Node Component
function FlowNodeComponent({ 
  node, 
  isActive, 
  isComplete 
}: { 
  node: FlowNode;
  isActive: boolean;
  isComplete: boolean;
}) {
  const typeColors = {
    intent: 'from-blue-500 to-cyan-500',
    routing: 'from-purple-500 to-pink-500',
    execution: 'from-green-500 to-emerald-500',
    settlement: 'from-yellow-500 to-orange-500'
  };
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ 
        left: `${node.position.x}%`, 
        top: `${node.position.y}%` 
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className={`relative p-4 rounded-xl bg-gradient-to-br ${typeColors[node.type]} ${
          isActive ? 'ring-4 ring-white/50 animate-pulse' : ''
        } ${isComplete ? 'ring-2 ring-green-400' : ''}`}
        whileHover={{ scale: 1.05 }}
        animate={isActive ? { 
          boxShadow: ['0 0 20px rgba(59, 130, 246, 0.5)', '0 0 40px rgba(59, 130, 246, 0.8)', '0 0 20px rgba(59, 130, 246, 0.5)']
        } : {}}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      >
        {/* Node Icon */}
        <div className="text-white mb-2 flex justify-center">
          {isComplete ? <CheckCircle className="h-6 w-6" /> : node.icon}
        </div>
        
        {/* Node Info */}
        <div className="text-center text-white">
          <div className="text-sm font-semibold mb-1">
            {node.name}
          </div>
          <div className="text-xs opacity-80">
            {node.description}
          </div>
        </div>
        
        {/* Node Data */}
        {node.data && Object.keys(node.data).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 pt-2 border-t border-white/20"
          >
            <div className="text-xs text-white/80 space-y-1">
              {Object.entries(node.data).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}:</span>
                  <span className="font-mono">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Status Indicator */}
        <div className="absolute -top-2 -right-2">
          {isComplete && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
          {isActive && (
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Data Flow Animation Component
function DataFlowAnimation({ 
  flow, 
  nodes 
}: { 
  flow: { id: string; from: string; to: string; data: any };
  nodes: FlowNode[];
}) {
  const fromNode = nodes.find(n => n.id === flow.from);
  const toNode = nodes.find(n => n.id === flow.to);
  
  if (!fromNode || !toNode) return null;
  
  return (
    <motion.div
      className="absolute w-3 h-3 bg-blue-400 rounded-full shadow-lg"
      initial={{ 
        left: `${fromNode.position.x}%`,
        top: `${fromNode.position.y}%`,
        scale: 0
      }}
      animate={{ 
        left: `${toNode.position.x}%`,
        top: `${toNode.position.y}%`,
        scale: [0, 1, 0]
      }}
      transition={{ 
        duration: 2,
        ease: "easeInOut"
      }}
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  );
}

// Generate realistic node data
function generateNodeData(nodeId: string, intent: any) {
  switch (nodeId) {
    case 'intent-parse':
      return {
        confidence: 95,
        tokens: [intent.tokenIn, intent.tokenOut],
        amount: intent.amountIn
      };
    case 'route-discovery':
      return {
        poolsFound: 47,
        chains: ['Arbitrum One', 'Nova', 'L3'],
        liquidity: '$2.4M'
      };
    case 'route-optimization':
      return {
        gasEstimate: 45231,
        priceImpact: 0.12,
        savings: '76%'
      };
    case 'stylus-execution':
      return {
        gasUsed: 45231,
        efficiency: 76,
        runtime: '2.3s'
      };
    case 'cross-chain':
      return {
        fromChain: 'Arbitrum One',
        toChain: 'Nova',
        bridgeTime: '15s'
      };
    case 'settlement':
      return {
        blockNumber: 12345678,
        finality: 'Instant',
        status: 'Complete'
      };
    default:
      return {};
  }
}

// Generate flow data
function generateFlowData(from: string, to: string) {
  return {
    type: 'data-packet',
    size: Math.floor(Math.random() * 1000) + 100,
    timestamp: Date.now()
  };
}