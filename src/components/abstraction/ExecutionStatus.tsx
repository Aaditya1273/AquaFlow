// Elite Execution Status - Shows progress without technical complexity
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  Zap, 
  Shield, 
  ArrowRight, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatTime, formatNumber } from '@/lib/utils';

interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number;
  userFriendlyName: string;
}

interface ExecutionStatusProps {
  isExecuting: boolean;
  txHash?: string;
  error?: string;
  onComplete?: () => void;
}

export function ExecutionStatus({ 
  isExecuting, 
  txHash, 
  error, 
  onComplete 
}: ExecutionStatusProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // User-friendly execution steps (no technical jargon)
  const steps: ExecutionStep[] = [
    {
      id: 'validate',
      name: 'Validating',
      description: 'Checking your swap details',
      userFriendlyName: 'Reviewing your request',
      icon: <Shield className="h-4 w-4" />,
      status: 'pending',
      duration: 2,
    },
    {
      id: 'optimize',
      name: 'Optimizing',
      description: 'Finding the best execution path',
      userFriendlyName: 'AI is optimizing your route',
      icon: <Sparkles className="h-4 w-4" />,
      status: 'pending',
      duration: 3,
    },
    {
      id: 'execute',
      name: 'Executing',
      description: 'Processing your swap',
      userFriendlyName: 'Executing your swap',
      icon: <Zap className="h-4 w-4" />,
      status: 'pending',
      duration: 8,
    },
    {
      id: 'finalize',
      name: 'Finalizing',
      description: 'Securing your transaction',
      userFriendlyName: 'Finalizing transaction',
      icon: <CheckCircle className="h-4 w-4" />,
      status: 'pending',
      duration: 5,
    },
  ];
  
  const [executionSteps, setExecutionSteps] = useState(steps);
  
  // Simulate execution progress
  useEffect(() => {
    if (isExecuting && !startTime) {
      setStartTime(Date.now());
      simulateExecution();
    }
  }, [isExecuting, startTime]);
  
  const simulateExecution = async () => {
    for (let i = 0; i < steps.length; i++) {
      // Update current step to active
      setExecutionSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'active' : index < i ? 'complete' : 'pending'
      })));
      
      setCurrentStep(i);
      
      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, (steps[i].duration || 3) * 1000));
      
      // Mark step as complete
      setExecutionSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index <= i ? 'complete' : 'pending'
      })));
    }
    
    // All steps complete
    onComplete?.();
  };
  
  const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);
  const elapsedTime = startTime ? (Date.now() - startTime) / 1000 : 0;
  const progress = Math.min((elapsedTime / totalDuration) * 100, 100);
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (!isExecuting && !txHash) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Progress Overview */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              {txHash ? 'Swap Complete!' : 'Processing Your Swap'}
            </h3>
            <p className="text-sm text-gray-400">
              {txHash 
                ? 'Your tokens have been swapped successfully'
                : 'Sit back and relax - we\'re handling everything'
              }
            </p>
          </div>
          
          {/* Progress Bar */}
          {!txHash && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
          
          {/* Time Estimate */}
          {!txHash && startTime && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                Estimated time remaining
              </div>
              <div className="text-sm font-medium text-white">
                {formatTime.duration(Math.max(0, totalDuration - elapsedTime))}
              </div>
            </div>
          )}
          
          {/* Success State */}
          {txHash && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
              <div className="text-sm font-mono text-gray-300 bg-gray-800 rounded px-3 py-2">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Execution Steps */}
      {!txHash && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-4">
              {executionSteps.map((step, index) => (
                <ExecutionStepItem
                  key={step.id}
                  step={step}
                  isActive={index === currentStep}
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* What's Happening Behind the Scenes */}
      {!txHash && (
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              What's happening behind the scenes
            </h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="h-1 w-1 bg-purple-400 rounded-full" />
                <span>AI is routing through the most efficient liquidity pools</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1 w-1 bg-purple-400 rounded-full" />
                <span>Stylus smart contracts are minimizing your gas costs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1 w-1 bg-purple-400 rounded-full" />
                <span>Cross-chain bridges are working seamlessly</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-1 w-1 bg-purple-400 rounded-full" />
                <span>Your transaction is being secured on Arbitrum</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// Individual Step Component
function ExecutionStepItem({ 
  step, 
  isActive, 
  index 
}: { 
  step: ExecutionStep;
  isActive: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center space-x-3"
    >
      {/* Step Icon */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        step.status === 'complete' 
          ? 'bg-green-500 text-white' 
          : step.status === 'active'
          ? 'bg-blue-500 text-white animate-pulse'
          : step.status === 'error'
          ? 'bg-red-500 text-white'
          : 'bg-gray-700 text-gray-400'
      }`}>
        {step.status === 'complete' ? (
          <CheckCircle className="h-4 w-4" />
        ) : step.status === 'error' ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          step.icon
        )}
      </div>
      
      {/* Step Content */}
      <div className="flex-1">
        <div className={`text-sm font-medium ${
          step.status === 'complete' 
            ? 'text-green-300' 
            : step.status === 'active'
            ? 'text-blue-300'
            : step.status === 'error'
            ? 'text-red-300'
            : 'text-gray-400'
        }`}>
          {step.userFriendlyName}
        </div>
        <div className="text-xs text-gray-500">
          {step.description}
        </div>
      </div>
      
      {/* Loading Animation for Active Step */}
      {isActive && step.status === 'active' && (
        <div className="flex space-x-1">
          <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" />
          <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </motion.div>
  );
}

// Error State Component
function ErrorState({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-red-200 mb-4">
            {error}
          </p>
          <div className="text-xs text-gray-400">
            Don't worry - your funds are safe. You can try again.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}