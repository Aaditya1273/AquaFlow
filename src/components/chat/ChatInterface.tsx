// Elite Chat-Style Swap Interface - Maximum Wow Factor
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useIntentSolver } from '@/hooks/useIntentSolver';
import { useStylelusRouter } from '@/hooks/useStylelusRouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatNumber, formatTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  data?: any;
}

const EXAMPLE_INTENTS = [
  "Swap 100 USDC to USDT anywhere on Arbitrum",
  "Convert 50 ETH to USDC with best price",
  "Exchange 1000 USDT for ARB tokens",
  "Buy 25 ARB with USDC on cheapest route",
  "Sell 0.5 ETH for stablecoins",
];

const QUICK_ACTIONS = [
  { label: "💱 Quick Swap", value: "Swap 100 USDC to USDT" },
  { label: "⚡ Best Price", value: "Convert 1 ETH to USDC with best price" },
  { label: "🎯 Low Fees", value: "Exchange 500 USDT to ARB on cheapest route" },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "👋 Hi! I'm AquaFlow AI. Tell me what you want to swap and I'll find the best route across all Arbitrum chains.",
      timestamp: Date.now() - 1000,
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { state: solverState, solveIntent, executeRoute } = useIntentSolver();
  const { state: routerState } = useStylelusRouter();
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };
  
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };
  
  const handleSubmit = async (intentText: string) => {
    if (!intentText.trim()) return;
    
    // Add user message
    addMessage({
      type: 'user',
      content: intentText,
    });
    
    setInput('');
    setIsTyping(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Add processing message
      const processingId = addMessage({
        type: 'assistant',
        content: "🧠 Understanding your intent...",
      });
      
      // Solve the intent
      await solveIntent(intentText);
      
      if (solverState.error) {
        updateMessage(processingId, {
          content: `❌ ${solverState.error}`,
        });
        return;
      }
      
      if (solverState.parsedIntent && solverState.optimalRoute) {
        const { parsedIntent, optimalRoute } = solverState;
        
        // Update with success message
        updateMessage(processingId, {
          content: `✅ Perfect! I found the optimal route for your swap.`,
        });
        
        // Add route details
        addMessage({
          type: 'system',
          content: 'route-details',
          data: {
            intent: parsedIntent,
            route: optimalRoute,
          },
        });
        
        // Add execution prompt
        addMessage({
          type: 'assistant',
          content: "Ready to execute? I'll handle everything for you with one click! 🚀",
        });
        
      }
    } catch (error) {
      addMessage({
        type: 'assistant',
        content: `❌ Sorry, I couldn't process that. ${error}`,
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleExecute = async () => {
    try {
      addMessage({
        type: 'assistant',
        content: "🚀 Executing your swap...",
      });
      
      const txHash = await executeRoute();
      
      if (txHash) {
        addMessage({
          type: 'system',
          content: 'transaction-success',
          data: { txHash },
        });
        
        addMessage({
          type: 'assistant',
          content: "🎉 Swap completed successfully! Your tokens are on the way.",
        });
        
        toast.success('Swap executed successfully!');
      }
    } catch (error) {
      addMessage({
        type: 'assistant',
        content: `❌ Execution failed: ${error}`,
      });
      
      toast.error('Swap execution failed');
    }
  };
  
  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };
  
  return (
    <div className="flex h-[600px] flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onExecute={handleExecute}
              isExecuting={routerState.isExecuting}
            />
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex space-x-1">
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Actions */}
      {messages.length <= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-2"
        >
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action, index) => (
              <motion.button
                key={action.label}
                onClick={() => handleQuickAction(action.value)}
                className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex space-x-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you want to swap..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              disabled={isTyping || solverState.isLoading}
            />
            
            {/* Example on empty input */}
            {!input && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-y-0 right-12 flex items-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    const randomExample = EXAMPLE_INTENTS[Math.floor(Math.random() * EXAMPLE_INTENTS.length)];
                    setInput(randomExample);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Try example
                </button>
              </motion.div>
            )}
          </div>
          
          <Button
            type="submit"
            size="lg"
            disabled={!input.trim() || isTyping || solverState.isLoading}
            className="px-6"
          >
            {solverState.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          Powered by Stylus • Ultra-low gas fees • Cross-chain routing
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  onExecute, 
  isExecuting 
}: { 
  message: Message;
  onExecute: () => void;
  isExecuting: boolean;
}) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    return <SystemMessage message={message} onExecute={onExecute} isExecuting={isExecuting} />;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isUser 
            ? 'bg-blue-600' 
            : 'bg-gradient-to-br from-purple-500 to-blue-600'
        }`}>
          {isUser ? (
            <div className="h-4 w-4 rounded-full bg-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
        </div>
        
        {/* Message */}
        <div className={`rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
        }`}>
          <p className="text-sm">{message.content}</p>
          <div className="mt-1 text-xs opacity-70">
            {formatTime.relative(message.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// System Message Component (Route Details, Transaction Success, etc.)
function SystemMessage({ 
  message, 
  onExecute, 
  isExecuting 
}: { 
  message: Message;
  onExecute: () => void;
  isExecuting: boolean;
}) {
  if (message.content === 'route-details' && message.data) {
    const { intent, route } = message.data;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md"
      >
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Optimal Route Found
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Swap Details */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">You pay</span>
                <span className="font-medium">
                  {intent.amount} {intent.tokenIn}
                </span>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                <div className="mx-3 rounded-full bg-blue-100 dark:bg-blue-900 p-1">
                  <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">You receive</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  ~{formatNumber.token(route.totalAmountOut)} {intent.tokenOut}
                </span>
              </div>
              
              {/* Route Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Price Impact</div>
                  <div className="font-medium text-sm">
                    {formatNumber.percentage(route.totalPriceImpact)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Gas Fee</div>
                  <div className="font-medium text-sm">
                    {formatNumber.gas(route.totalGasEstimate)}
                  </div>
                </div>
              </div>
              
              {/* Execute Button */}
              <Button
                onClick={onExecute}
                disabled={isExecuting}
                loading={isExecuting}
                className="w-full mt-4"
                size="lg"
              >
                {isExecuting ? 'Executing...' : 'Execute Swap'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  if (message.content === 'transaction-success' && message.data) {
    const { txHash } = message.data;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md"
      >
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
          <div className="p-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Transaction Successful!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Your swap has been executed successfully
            </p>
            <div className="text-xs text-green-600 dark:text-green-400 font-mono bg-green-100 dark:bg-green-900/50 rounded p-2">
              {txHash}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  return null;
}