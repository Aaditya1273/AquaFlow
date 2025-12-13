// Message Bubble Component - Polished chat messages
'use client';

import { motion } from 'framer-motion';
import { Sparkles, User, Bot, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatTime, formatAddress } from '@/lib/utils';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  data?: any;
  loading?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isError = message.type === 'error';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLatest ? 'mb-4' : 'mb-3'}`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <motion.div 
          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
            isUser 
              ? 'bg-blue-600' 
              : isError
              ? 'bg-red-500'
              : isSystem
              ? 'bg-purple-600'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {isUser ? (
            <User className="h-4 w-4 text-white" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-white" />
          ) : isSystem ? (
            <CheckCircle className="h-4 w-4 text-white" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </motion.div>
        
        {/* Message Content */}
        <motion.div 
          className={`rounded-2xl px-4 py-3 relative ${
            isUser
              ? 'bg-blue-600 text-white'
              : isError
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : isSystem
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Loading indicator */}
          {message.loading && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-current animate-bounce opacity-60" />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce opacity-60" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 rounded-full bg-current animate-bounce opacity-60" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs opacity-70">Thinking...</span>
            </div>
          )}
          
          {/* Message text */}
          <div className="text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Transaction hash display */}
          {message.data?.txHash && (
            <motion.div 
              className="mt-3 pt-3 border-t border-current/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">Transaction:</span>
                <button className="flex items-center space-x-1 text-xs hover:opacity-80 transition-opacity">
                  <span className="font-mono">
                    {formatAddress.truncate(message.data.txHash, 8, 6)}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Timestamp */}
          <div className={`mt-2 text-xs opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime.relative(message.timestamp)}
          </div>
          
          {/* Message tail */}
          <div className={`absolute bottom-0 ${
            isUser ? '-right-1' : '-left-1'
          } w-3 h-3 transform rotate-45 ${
            isUser
              ? 'bg-blue-600'
              : isError
              ? 'bg-red-100 dark:bg-red-900/30 border-r border-b border-red-200 dark:border-red-800'
              : isSystem
              ? 'bg-purple-100 dark:bg-purple-900/30 border-r border-b border-purple-200 dark:border-purple-800'
              : 'bg-gray-100 dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700'
          }`} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="flex items-end space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// System message for special content
export function SystemMessage({ 
  type, 
  data, 
  onAction 
}: { 
  type: 'route-found' | 'transaction-success' | 'error';
  data: any;
  onAction?: () => void;
}) {
  if (type === 'route-found') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-sm mb-4"
      >
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Route Found!
            </h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">You pay:</span>
              <span className="font-medium">{data.amountIn} {data.tokenIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">You get:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ~{data.amountOut} {data.tokenOut}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gas:</span>
              <span className="font-medium">{data.gasEstimate}</span>
            </div>
          </div>
          
          {onAction && (
            <motion.button
              onClick={onAction}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Execute Swap
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }
  
  if (type === 'transaction-success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-sm mb-4"
      >
        <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            Success!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Your swap has been executed
          </p>
          {data.txHash && (
            <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-mono bg-green-100 dark:bg-green-900/50 rounded p-2">
              {formatAddress.truncate(data.txHash, 10, 8)}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
  
  return null;
}