'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp, Shield, Sparkles, Globe, ChevronDown } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { isConnected } = useAccount();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Theme-based hover effects
  const themeColors = {
    primary: { from: '#3b82f6', to: '#06b6d4' },
    secondary: { from: '#8b5cf6', to: '#ec4899' },
    accent: { from: '#10b981', to: '#06b6d4' }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* Enhanced Interactive Background with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-purple-900/30"
          style={{ y: 0 }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Animated Gradient Orbs with Parallax */}
        <motion.div 
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{ y: 0 }}
        />
        
        {/* Enhanced Floating Particles with Parallax */}
        {[...Array(30)].map((_, i) => {
          // Use deterministic values based on index to avoid hydration mismatch
          const size = 2 + (i % 4);
          const leftPos = (i * 3.33) % 100;
          const topPos = (i * 2.5) % 100;
          const opacity1 = 0.2 + (i % 3) * 0.1;
          const opacity2 = 0.2 + ((i + 1) % 3) * 0.1;
          const yOffset = 50 + (i % 3) * 10;
          const xOffset = (i % 2 === 0 ? 1 : -1) * (5 + (i % 3) * 2);
          const duration = 4 + (i % 3);
          const delay = (i % 4) * 0.75;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${leftPos}%`,
                top: `${topPos}%`,
                background: `linear-gradient(45deg, rgba(59, 130, 246, ${opacity1}), rgba(6, 182, 212, ${opacity2}))`,
              }}
              animate={{
                y: [0, -yOffset, 0],
                x: [0, xOffset, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Animated Grid Pattern with Parallax */}
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
          style={{ y: 0 }}
          animate={{ 
            backgroundPosition: ["0px 0px", "50px 50px", "0px 0px"]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Floating Geometric Shapes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className="absolute opacity-10"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + Math.random() * 60}%`,
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              background: `linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))`,
              borderRadius: i % 2 === 0 ? '50%' : '20%',
            }}
            animate={{
              y: [0, -30 - Math.random() * 20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto text-center"
        >
          
          {/* Brand Section */}
          <motion.div
            variants={itemVariants}
            className="mb-20"
          >
            <motion.div className="text-center mb-12 group">
              {/* Interactive Logo Background */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                    "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%)",
                    "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                    "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <motion.h1 
                className="text-7xl md:text-9xl lg:text-[12rem] font-bold leading-tight mb-8 cursor-pointer relative z-10"
                whileHover={{ 
                  scale: 1.05,
                  textShadow: "0 0 30px rgba(59, 130, 246, 0.5)"
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: "linear-gradient(45deg, #ffffff, #60a5fa, #06b6d4, #8b5cf6, #06b6d4, #60a5fa, #ffffff)",
                  backgroundSize: "400% 400%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  backgroundPosition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  scale: { type: "spring", stiffness: 300 }
                }}
                onHoverStart={() => {
                  // Add particle burst effect on hover
                }}
              >
                AquaFlow
              </motion.h1>
              
              <motion.div 
                className="flex items-center justify-center gap-4 mb-8 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  whileHover={{ 
                    scale: 1.2,
                    filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))"
                  }}
                >
                  <Sparkles className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </motion.div>
                
                <motion.span 
                  className="text-blue-400 font-bold text-2xl tracking-wide cursor-pointer"
                  whileHover={{
                    background: "linear-gradient(45deg, #60a5fa, #06b6d4, #8b5cf6)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    backgroundPosition: { duration: 2, repeat: Infinity }
                  }}
                >
                  Stylus Powered
                </motion.span>
                
                <motion.div
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  whileHover={{ 
                    scale: 1.2,
                    filter: "drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))"
                  }}
                >
                  <Sparkles className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                </motion.div>
              </motion.div>
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl md:text-5xl lg:text-6xl text-blue-100/90 font-light mb-12 tracking-wide"
            >
              Intent-Based DeFi Router
            </motion.h2>
          </motion.div>

          {/* Token Showcase with Enhanced Animation */}
          <motion.div
            variants={itemVariants}
            className="mb-16"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              {[
                { from: 'eth', to: 'usdc', label: 'ETH → USDC' },
                { from: 'usdt', to: 'Arb1', label: 'USDT → ARB' },
                { from: 'BTC', to: 'eth', label: 'BTC → ETH' }
              ].map((pair, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.2, duration: 0.6 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                  }}
                  className="flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl backdrop-blur-xl border border-white/20 hover:border-blue-400/50 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative">
                    <Image src={`/assets/tokens/${pair.from}.png`} alt={pair.from} width={40} height={40} className="group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </motion.div>
                  <div className="relative">
                    <Image src={`/assets/tokens/${pair.to}.png`} alt={pair.to} width={40} height={40} className="group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </div>
                  <span className="text-white/80 font-medium ml-2 group-hover:text-white transition-colors">
                    {pair.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Value Proposition */}
          <motion.div
            variants={itemVariants}
            className="mb-16"
          >
            <motion.p
              className="text-xl md:text-3xl lg:text-4xl text-blue-200/90 mb-6 max-w-5xl mx-auto leading-relaxed"
              whileHover={{ scale: 1.02 }}
            >
              Just say{' '}
              <motion.span 
                className="text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text font-bold"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: "200% 200%" }}
              >
                "Swap 100 USDC to USDT"
              </motion.span>
            </motion.p>
            <motion.p
              className="text-lg md:text-xl text-blue-300/70 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              No forms, no complexity - just natural language powered by Arbitrum Stylus
            </motion.p>
          </motion.div>

          {/* Enhanced CTA Button */}
          <motion.div
            variants={itemVariants}
            className="mb-20"
          >
            <Link href="/demo">
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-16 py-8 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-3xl text-white font-bold text-2xl shadow-2xl hover:shadow-cyan-500/50 transition-all duration-500 overflow-hidden"
              >
                {/* Button Background Animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ opacity: 0.3 }}
                />
                
                <span className="relative flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-8 h-8" />
                  </motion.div>
                  Try AquaFlow Demo
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-8 h-8" />
                  </motion.div>
                </span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {[
              { 
                value: '76%', 
                label: 'Gas Savings', 
                color: 'from-green-400 to-emerald-500', 
                icon: TrendingUp,
                description: 'Lower transaction costs'
              },
              { 
                value: '$2.4B+', 
                label: 'Total Liquidity', 
                color: 'from-blue-400 to-cyan-500',
                icon: Globe,
                description: 'Across all pools'
              },
              { 
                value: '100%', 
                label: 'Stylus Native', 
                color: 'from-cyan-400 to-purple-500',
                icon: Shield,
                description: 'Rust-powered security'
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 + index * 0.2 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  boxShadow: "0 25px 50px rgba(59, 130, 246, 0.2)"
                }}
                className="group relative text-center backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                {/* Card Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`} />
                
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                >
                  <stat.icon className={`w-12 h-12 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`} />
                </motion.div>
                
                <motion.div 
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-4`}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.value}
                </motion.div>
                
                <div className="text-xl font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                  {stat.label}
                </div>
                
                <div className="text-sm text-blue-200/60 group-hover:text-blue-200/80 transition-colors">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center text-blue-300/60 cursor-pointer group"
              onClick={() => {
                const featuresSection = document.querySelector('#features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <span className="text-sm mb-2 group-hover:text-blue-300 transition-colors">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.2 }}
              >
                <ChevronDown className="w-6 h-6 group-hover:text-cyan-400 transition-colors" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 overflow-hidden">
        {/* Interactive Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-64 h-64 rounded-full opacity-5"
              style={{
                background: `linear-gradient(45deg, ${i % 2 === 0 ? '#3b82f6' : '#06b6d4'}, transparent)`,
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i * 20)}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Enhanced Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              className="inline-block mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <motion.h3 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 cursor-pointer"
                style={{
                  background: "linear-gradient(45deg, #ffffff, #60a5fa, #06b6d4, #8b5cf6)",
                  backgroundSize: "300% 300%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{
                  textShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                  scale: 1.02
                }}
              >
                Why Choose AquaFlow?
              </motion.h3>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl text-blue-200/80 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Experience the future of DeFi with our cutting-edge intent-based routing system
            </motion.p>
          </motion.div>

          {/* Enhanced Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Execute swaps in milliseconds with our optimized Stylus contracts",
                color: "from-yellow-400 to-orange-500",
                bgColor: "from-yellow-500/10 to-orange-500/10",
                metric: "<100ms",
                metricLabel: "Execution Time"
              },
              {
                icon: Shield,
                title: "Ultra Secure",
                description: "Built with Rust and audited smart contracts for maximum security",
                color: "from-green-400 to-emerald-500",
                bgColor: "from-green-500/10 to-emerald-500/10",
                metric: "100%",
                metricLabel: "Audit Score"
              },
              {
                icon: Globe,
                title: "Cross-Chain Ready",
                description: "Seamlessly swap across multiple chains with unified liquidity",
                color: "from-blue-400 to-cyan-500",
                bgColor: "from-blue-500/10 to-cyan-500/10",
                metric: "10+",
                metricLabel: "Chains"
              },
              {
                icon: TrendingUp,
                title: "Best Rates",
                description: "AI-powered routing finds the optimal path for every trade",
                color: "from-purple-400 to-pink-500",
                bgColor: "from-purple-500/10 to-pink-500/10",
                metric: "0.1%",
                metricLabel: "Slippage"
              },
              {
                icon: Sparkles,
                title: "Natural Language",
                description: "Just describe what you want - no complex forms or interfaces",
                color: "from-cyan-400 to-blue-500",
                bgColor: "from-cyan-500/10 to-blue-500/10",
                metric: "AI",
                metricLabel: "Powered"
              },
              {
                icon: ArrowRight,
                title: "Zero Slippage",
                description: "Advanced MEV protection and optimal execution guaranteed",
                color: "from-indigo-400 to-purple-500",
                bgColor: "from-indigo-500/10 to-purple-500/10",
                metric: "MEV",
                metricLabel: "Protected"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: 45 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  rotateY: 5,
                  boxShadow: "0 30px 60px rgba(59, 130, 246, 0.3)"
                }}
                className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 cursor-pointer overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Animated Background Gradient */}
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
                  animate={{
                    opacity: [0, 0.1, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Floating Particles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-1 h-1 bg-gradient-to-r ${feature.color} rounded-full opacity-0 group-hover:opacity-60`}
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${20 + i * 20}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 0.6, 0],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                ))}
                
                {/* Icon with Enhanced Animation */}
                <motion.div
                  className="relative z-10 mb-6"
                  animate={{ 
                    y: [0, -8, 0],
                    rotateY: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: index * 0.5 
                  }}
                  whileHover={{ 
                    scale: 1.2,
                    rotateY: 15,
                    filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))"
                  }}
                >
                  <feature.icon className={`w-16 h-16 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent transition-all duration-300`} />
                </motion.div>
                
                {/* Title with Hover Effect */}
                <motion.h4 
                  className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-blue-200 transition-colors duration-300"
                  whileHover={{
                    scale: 1.05,
                    textShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
                  }}
                >
                  {feature.title}
                </motion.h4>
                
                {/* Description */}
                <p className="text-blue-200/70 group-hover:text-blue-200/90 transition-colors leading-relaxed mb-6 relative z-10">
                  {feature.description}
                </p>
                
                {/* Metric Display */}
                <motion.div 
                  className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="text-right">
                    <motion.div 
                      className={`text-2xl font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {feature.metric}
                    </motion.div>
                    <div className="text-xs text-blue-300/60 group-hover:text-blue-300/80 transition-colors">
                      {feature.metricLabel}
                    </div>
                  </div>
                  
                  <motion.div
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${feature.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                
                {/* Hover Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${feature.color}`}
                  style={{
                    filter: "blur(20px)",
                    transform: "scale(1.1)",
                  }}
                  animate={{
                    opacity: [0, 0.1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative z-10 py-32 px-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h3 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Powered by Innovation
            </h3>
            <p className="text-xl text-blue-200/80 max-w-3xl mx-auto">
              Built on the latest blockchain technology for unmatched performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">Rs</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">Rust-Powered</h4>
                    <p className="text-blue-200/70">Memory-safe, blazingly fast execution</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">St</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">Arbitrum Stylus</h4>
                    <p className="text-blue-200/70">Next-generation smart contract platform</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">AI</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">AI-Optimized</h4>
                    <p className="text-blue-200/70">Intelligent routing and execution</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text mb-4">
                    99.9%
                  </div>
                  <div className="text-xl text-white font-semibold mb-2">Uptime</div>
                  <div className="text-blue-200/70">Rock-solid reliability</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text">
                      &lt;100ms
                    </div>
                    <div className="text-sm text-blue-200/70">Execution Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">
                      $0.01
                    </div>
                    <div className="text-sm text-blue-200/70">Average Gas</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-blue-400/20 bg-gradient-to-br from-black via-blue-900/10 to-purple-900/10 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <motion.h4 
                className="text-3xl font-bold mb-4"
                style={{
                  background: "linear-gradient(45deg, #ffffff, #60a5fa, #06b6d4)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                AquaFlow
              </motion.h4>
              <p className="text-blue-200/80 text-lg mb-6 max-w-md">
                The future of DeFi trading is here. Experience seamless, intent-based swaps powered by Arbitrum Stylus.
              </p>
              <div className="flex items-center gap-4">
                <Image src="/assets/tokens/logo.png" alt="AquaFlow Logo" width={40} height={40} className="opacity-80" />
                <div className="text-blue-200/80">
                  <p className="font-semibold text-lg">Built with Arbitrum Stylus</p>
                  <p className="text-sm text-blue-300/60">APAC Hackathon 2025</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-xl font-bold text-white mb-6">Quick Links</h5>
              <ul className="space-y-3">
                {['Demo', 'Swap', 'Dashboard', 'Portfolio', 'Analytics'].map((link, index) => (
                  <motion.li key={link}>
                    <Link 
                      href={`/${link.toLowerCase()}`}
                      className="text-blue-200/70 hover:text-blue-200 transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                      {link}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div>
              <h5 className="text-xl font-bold text-white mb-6">Technology</h5>
              <ul className="space-y-3">
                {[
                  { name: 'Rust', color: 'text-orange-400' },
                  { name: 'Arbitrum Stylus', color: 'text-blue-400' },
                  { name: 'WebAssembly', color: 'text-purple-400' },
                  { name: 'Intent-Based', color: 'text-cyan-400' },
                  { name: 'MEV Protection', color: 'text-green-400' }
                ].map((tech, index) => (
                  <motion.li 
                    key={tech.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${tech.color} flex items-center gap-2`}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
                    >
                      <div className="w-2 h-2 bg-current rounded-full" />
                    </motion.div>
                    {tech.name}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>



          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12">
            <div className="flex items-center gap-8 text-blue-300/60 text-sm">
              <span>Powered by Rust</span>
              <span>•</span>
              <span>Secured by Arbitrum</span>
              <span>•</span>
              <span>Built for DeFi</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
            
            <motion.div
              animate={{ 
                background: [
                  "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                  "linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(6, 182, 212, 0.1))",
                  "linear-gradient(45deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="px-6 py-3 rounded-full border border-blue-400/30"
            >
              <p className="text-blue-200/80 text-sm font-medium">
                © 2025 AquaFlow. Built with ❤️ for DeFi
              </p>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </main>
  );
}