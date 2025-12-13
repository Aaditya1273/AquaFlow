// Elite Header Component - Production-grade navigation
'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Menu, X, Zap, BarChart3, Settings } from 'lucide-react';
import { useChainDetection } from '@/hooks/useChainDetection';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chainInfo, isSupported } = useChainDetection();
  
  const navigation = [
    { name: 'Swap', href: '/', icon: Zap },
    { name: 'Visualizer', href: '/visualizer', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  return (
    <header className={cn('sticky top-0 z-50 w-full border-b border-gray-200/20 bg-white/80 backdrop-blur-md dark:border-gray-800/20 dark:bg-gray-950/80', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                AquaFlow
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Stylus Powered
                </span>
                {chainInfo && isSupported && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chainInfo.color }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chainInfo.shortName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </motion.a>
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Chain Status Indicator */}
            {chainInfo && (
              <motion.div
                className="hidden sm:flex items-center space-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="h-2 w-2 rounded-full animate-pulse"
                  style={{ backgroundColor: chainInfo.color }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {chainInfo.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {chainInfo.fees} fees
                </span>
              </motion.div>
            )}
            
            {/* Connect Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ConnectButton 
                chainStatus="icon"
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
              />
            </motion.div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 text-base font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                ))}
              </nav>
              
              {/* Mobile Chain Info */}
              {chainInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: chainInfo.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {chainInfo.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {chainInfo.fees} fees
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}