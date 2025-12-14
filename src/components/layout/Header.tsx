// Enhanced Professional Header Component
'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, Zap, BarChart3, TrendingUp, Activity, Lock, ChevronDown, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { usePathname } from 'next/navigation';

// Enhanced Navigation Item Component with Better UX
function NavigationItem({ item, index, isConnected, isActive }: { 
  item: any; 
  index: number; 
  isConnected: boolean;
  isActive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (item.protected && !isConnected) {
      e.preventDefault();
      toast.error('Connect your wallet to access this feature', {
        duration: 4000,
        icon: '🔒',
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444',
          backdropFilter: 'blur(16px)',
        },
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link
        href={item.protected && !isConnected ? '#' : item.href}
        onClick={handleClick}
        className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 group ${
          item.protected && !isConnected
            ? 'text-blue-200/40 cursor-not-allowed'
            : isActive
            ? 'text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30'
            : 'text-blue-200/80 hover:text-white hover:bg-white/5'
        }`}
      >
        {/* Background Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
        />
        
        {/* Icon with Animation */}
        <motion.div
          animate={isHovered ? { rotate: 5, scale: 1.1 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <item.icon className="h-5 w-5 relative z-10" />
        </motion.div>
        
        <span className="relative z-10 text-sm">{item.name}</span>
        
        {/* Lock Icon for Protected Routes */}
        {item.protected && !isConnected && (
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="h-4 w-4 text-orange-400 relative z-10" />
          </motion.div>
        )}



        {/* Enhanced Tooltip */}
        <AnimatePresence>
          {isHovered && item.protected && !isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-xl text-white text-xs px-3 py-2 rounded-lg border border-orange-400/30 whitespace-nowrap z-50"
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3" />
                Connect wallet required
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/95" />
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { isConnected } = useAccount();
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Home', href: '/', icon: Sparkles, public: true },
    { name: 'Swap', href: '/swap', icon: Zap, protected: true },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, protected: true },
    { name: 'Portfolio', href: '/portfolio', icon: TrendingUp, protected: true },
    { name: 'Analytics', href: '/analytics', icon: Activity, protected: true },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <motion.header 
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? 'bg-black/95 backdrop-blur-2xl border-b border-blue-400/30 shadow-2xl shadow-blue-500/10' 
          : 'bg-black/60 backdrop-blur-xl border-b border-blue-400/20'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <div className="max-w-8xl mx-auto px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'h-16' : 'h-20'
        }`}>
          {/* Enhanced Logo Section with Advanced Animations */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/" className="flex items-center space-x-4 group">
              {/* Advanced Logo with Multiple Effects */}
              <motion.div 
                className="relative"
                whileHover={{ 
                  rotate: [0, -5, 5, -3, 3, 0],
                  scale: 1.1
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeInOut"
                }}
              >
                {/* Multi-layered Glow Effects */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-300"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                
                {/* Pulsing Ring Effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-cyan-400/0 rounded-full group-hover:border-cyan-400/50 transition-all duration-300"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Theme-based Logo with Hover Effects */}
                <motion.div
                  className="relative z-10"
                  whileHover={{
                    filter: [
                      "brightness(1) saturate(1) hue-rotate(0deg)",
                      "brightness(1.2) saturate(1.3) hue-rotate(15deg)",
                      "brightness(1.1) saturate(1.2) hue-rotate(30deg)",
                      "brightness(1) saturate(1) hue-rotate(0deg)"
                    ]
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  <Image 
                    src="/assets/tokens/logo.png" 
                    alt="AquaFlow Logo" 
                    width={scrolled ? 36 : 42} 
                    height={scrolled ? 36 : 42}
                    className="drop-shadow-2xl transition-all duration-500 group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                  />
                </motion.div>

                {/* Floating Particles Effect */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${30 + i * 20}%`,
                    }}
                    animate={{
                      y: [-10, -20, -10],
                      x: [0, 5, 0],
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
              
              {/* Enhanced Brand Text */}
              <div className="flex flex-col">
                <motion.h1 
                  className={`font-bold transition-all duration-300 ${
                    scrolled ? 'text-xl' : 'text-2xl'
                  } group-hover:scale-105`}
                  style={{
                    background: "linear-gradient(45deg, #60a5fa, #06b6d4, #8b5cf6, #ec4899, #06b6d4, #60a5fa)",
                    backgroundSize: "300% 300%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  whileHover={{
                    backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"],
                    transition: { duration: 1 }
                  }}
                >
                  AquaFlow
                </motion.h1>
                
                {/* Enhanced Stylus Badge */}
                <motion.div 
                  className="flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Multiple Rotating Sparkles */}
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: [360, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400 opacity-50" />
                    </motion.div>
                  </div>
                  
                  {/* Animated Text with Hover Effects */}
                  <motion.span 
                    className={`font-semibold transition-all duration-300 ${
                      scrolled ? 'text-xs' : 'text-sm'
                    }`}
                    style={{
                      background: "linear-gradient(45deg, #60a5fa, #06b6d4)",
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
                    whileHover={{
                      scale: 1.05,
                      backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"],
                      transition: { duration: 0.8 }
                    }}
                  >
                    Stylus Powered
                  </motion.span>

                  {/* Hover Indicator */}
                  <motion.div
                    className="w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-8 transition-all duration-300 rounded-full"
                  />
                </motion.div>
              </div>

              {/* Hover Ripple Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none"
                initial={false}
                whileHover={{
                  background: [
                    "radial-gradient(circle at center, rgba(6,182,212,0) 0%, rgba(6,182,212,0) 100%)",
                    "radial-gradient(circle at center, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0) 70%)",
                    "radial-gradient(circle at center, rgba(6,182,212,0) 0%, rgba(6,182,212,0) 100%)"
                  ]
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </Link>
          </motion.div>
          
          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item, index) => (
              <NavigationItem
                key={item.name}
                item={item}
                index={index}
                isConnected={isConnected}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
          
          {/* Enhanced Actions Section */}
          <div className="flex items-center space-x-4">
            {/* Connection Status Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="hidden md:flex items-center"
            >
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                <motion.div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </motion.div>

            {/* Enhanced Smart Connect Button */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <motion.button
                              whileHover={{ 
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)"
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={openConnectModal}
                              className="relative px-6 py-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-xl text-white font-semibold text-sm shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 overflow-hidden group"
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              />
                              <span className="relative flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
                              </span>
                            </motion.button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <motion.button
                              whileHover={{ 
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.4)"
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={openChainModal}
                              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold text-sm shadow-xl hover:shadow-orange-500/50 transition-all duration-300"
                            >
                              <span className="flex items-center gap-2">
                                <X className="w-4 h-4" />
                                Wrong Network
                              </span>
                            </motion.button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={openChainModal}
                              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
                            >
                              <div className="flex items-center gap-2">
                                {chain.hasIcon && (
                                  <motion.div 
                                    className="w-5 h-5 rounded-full overflow-hidden"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        className="w-5 h-5"
                                      />
                                    )}
                                  </motion.div>
                                )}
                                <span className="text-sm font-medium text-white group-hover:text-blue-200 transition-colors">
                                  {chain.name}
                                </span>
                                <ChevronDown className="w-3 h-3 text-blue-300 group-hover:text-white transition-colors" />
                              </div>
                            </motion.button>

                            <motion.button
                              whileHover={{ 
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)"
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={openAccountModal}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold text-sm shadow-xl hover:shadow-green-500/50 transition-all duration-300 group"
                            >
                              <div className="flex items-center gap-2">
                                <motion.div 
                                  className="w-2.5 h-2.5 bg-white rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <span className="hidden sm:inline">
                                  {account.displayName}
                                </span>
                                <span className="sm:hidden">
                                  {account.displayName?.slice(0, 6)}
                                </span>
                                <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                              </div>
                            </motion.button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </motion.div>
            
            {/* Enhanced Mobile Menu Button */}
            <motion.button
              className="lg:hidden p-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div 
              className="border-t border-blue-400/30 bg-gradient-to-br from-black/95 via-blue-900/10 to-purple-900/10 backdrop-blur-2xl"
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(24px)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 py-6">
                {/* Connection Status in Mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isConnected 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-orange-500/10 border border-orange-500/20'
                  }`}>
                    <motion.div
                      className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-orange-400'}`}>
                      {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
                    </span>
                  </div>
                </motion.div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                  {navigation.map((item, index) => {
                    const isActive = pathname === item.href;
                    const handleMobileClick = (e: React.MouseEvent) => {
                      if (item.protected && !isConnected) {
                        e.preventDefault();
                        toast.error('Connect your wallet to access this feature', {
                          duration: 4000,
                          icon: '🔒',
                          style: {
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#EF4444',
                            backdropFilter: 'blur(16px)',
                          },
                        });
                        return;
                      }
                      setMobileMenuOpen(false);
                    };

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          href={item.protected && !isConnected ? '#' : item.href}
                          onClick={handleMobileClick}
                          className={`flex items-center justify-between p-4 rounded-xl font-medium transition-all duration-300 group ${
                            item.protected && !isConnected
                              ? 'text-blue-200/40 cursor-not-allowed bg-slate-800/20'
                              : isActive
                              ? 'text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30'
                              : 'text-blue-200/80 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <item.icon className="h-6 w-6" />
                            </motion.div>
                            <span className="text-lg">{item.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {item.protected && !isConnected && (
                              <motion.div
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Lock className="h-5 w-5 text-orange-400" />
                              </motion.div>
                            )}

                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile Footer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 pt-6 border-t border-blue-400/20"
                >
                  <div className="flex items-center justify-center gap-2 text-blue-300/60 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Powered by Arbitrum Stylus</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}