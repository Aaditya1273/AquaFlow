'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle } from 'lucide-react';

interface IntentInputProps {
  onSubmit: (intent: string) => void;
  isLoading: boolean;
}

const EXAMPLE_INTENTS = [
  "Swap 100 USDC to USDT anywhere on Arbitrum",
  "Convert 50 ETH to USDC with best price",
  "Exchange 1000 USDT for ARB tokens",
  "Swap 25 WBTC to ETH on cheapest route"
];

export default function IntentInput({ onSubmit, isLoading }: IntentInputProps) {
  const [intent, setIntent] = useState('');
  const [showExamples, setShowExamples] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim() && !isLoading) {
      onSubmit(intent.trim());
      setShowExamples(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setIntent(example);
    setShowExamples(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <MessageCircle className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Express Your Intent</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Tell AquaFlow what you want to do..."
            className="w-full h-32 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={!intent.trim() || isLoading}
            className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <p className="text-sm text-blue-300 mb-3">Try these examples:</p>
            {EXAMPLE_INTENTS.map((example, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="block w-full text-left text-sm text-blue-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors border border-white/10 hover:border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                "{example}"
              </motion.button>
            ))}
          </motion.div>
        )}
      </form>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        <span className="text-sm text-blue-300">
          {isLoading ? 'Processing intent...' : 'Ready for your intent'}
        </span>
      </div>
    </div>
  );
}