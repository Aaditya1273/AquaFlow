'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, ArrowRight, TrendingUp, MessageCircle } from 'lucide-react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import GasBenchmark from '@/components/GasBenchmark';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
            Just Tell Me What You Want
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          No forms, no dropdowns, no chain selection. Just natural language.
          <br />
          <span className="text-blue-400 font-semibold">AquaFlow AI understands and executes.</span>
        </p>
      </motion.div>

      {/* Main Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto mb-12"
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <MessageCircle className="h-6 w-6 text-blue-400" />
              <span>Chat with AquaFlow AI</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChatInterface />
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Natural Language</h3>
            <p className="text-gray-300 text-sm">
              "Swap 100 USDC to USDT" - that's it!
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">One-Click Execution</h3>
            <p className="text-gray-300 text-sm">
              AI finds the route, you just click execute
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <ArrowRight className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Chain Abstraction</h3>
            <p className="text-gray-300 text-sm">
              No chain selection - AI picks the best
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Beginner Friendly</h3>
            <p className="text-gray-300 text-sm">
              Perfect for DeFi newcomers
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gas Benchmark */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <GasBenchmark />
      </motion.div>

      {/* Example Conversations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto mt-12"
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-center text-white">
              See How Easy It Is
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-400">💬 What You Say</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-600 text-white rounded-lg p-3 ml-8">
                    "Swap 100 USDC to USDT anywhere on Arbitrum"
                  </div>
                  <div className="bg-blue-600 text-white rounded-lg p-3 ml-8">
                    "Convert 0.5 ETH to USDC with best price"
                  </div>
                  <div className="bg-blue-600 text-white rounded-lg p-3 ml-8">
                    "Buy 1000 ARB with cheapest fees"
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-green-400">🤖 What AI Does</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-700 text-gray-100 rounded-lg p-3 mr-8">
                    ✅ Finds optimal route across all chains
                  </div>
                  <div className="bg-gray-700 text-gray-100 rounded-lg p-3 mr-8">
                    ⚡ Calculates gas savings with Stylus
                  </div>
                  <div className="bg-gray-700 text-gray-100 rounded-lg p-3 mr-8">
                    🚀 Executes with one-click confirmation
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}