'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface IntentInputProps {
  onSubmit: (intent: string) => void;
  isLoading: boolean;
}

const EXAMPLE_INTENTS = [
  "Swap 100 USDC to USDT anywhere on Arbitrum",
  "Convert 50 ETH to USDC with best price",
  "Exchange 1000 USDT for ARB tokens",
];

export default function IntentInput({ onSubmit, isLoading }: IntentInputProps) {
  const [intent, setIntent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim() && !isLoading) {
      onSubmit(intent.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setIntent(example);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/20 rounded-2xl p-8 shadow-2xl overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated Border Glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: isFocused
              ? ['0 0 20px rgba(0, 245, 255, 0.3)', '0 0 40px rgba(0, 245, 255, 0.5)', '0 0 20px rgba(0, 245, 255, 0.3)']
              : '0 0 0px rgba(0, 245, 255, 0)',
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <form onSubmit={handleSubmit} className="relative z-10">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-light text-white mb-2 tracking-wide">
              Express Your Intent
            </h3>
            <p className="text-blue-200/60 text-sm font-light">
              Describe what you want to swap in natural language
            </p>
          </div>

          {/* Input Field */}
          <div className="relative mb-6">
            <textarea
              ref={inputRef}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your swap intent here..."
              className="w-full h-32 bg-black/30 border border-blue-400/20 rounded-xl px-6 py-4 text-white placeholder-blue-300/30 resize-none focus:outline-none focus:border-blue-400/50 transition-all duration-300 font-light text-lg backdrop-blur-sm"
              disabled={isLoading}
            />

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!intent.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Execute'
              )}
            </motion.button>
          </div>

          {/* Example Intents */}
          <AnimatePresence>
            {!intent && !isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className="text-sm text-blue-300/60 font-light">Try these examples:</p>
                {EXAMPLE_INTENTS.map((example, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="block w-full text-left text-sm text-blue-200/70 hover:text-blue-100 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg px-4 py-3 transition-all duration-300 border border-blue-400/10 hover:border-blue-400/30"
                  >
                    {example}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Indicator */}
          <div className="mt-6 flex items-center space-x-3">
            <motion.div
              animate={{
                scale: isLoading ? [1, 1.2, 1] : 1,
                opacity: isLoading ? [0.5, 1, 0.5] : 1,
              }}
              transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
              className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-green-400'}`}
            />
            <span className="text-sm text-blue-300/60 font-light">
              {isLoading ? 'Processing your intent...' : 'Ready to execute'}
            </span>
          </div>
        </form>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      </motion.div>
    </div>
  );
}