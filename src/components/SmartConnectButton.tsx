'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface SmartConnectButtonProps {
  onConnected?: () => void;
  showNetworkWarning?: boolean;
}

export default function SmartConnectButton({ 
  onConnected, 
  showNetworkWarning = true 
}: SmartConnectButtonProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isArbitrumNetwork, setIsArbitrumNetwork] = useState(false);

  // Check if on Arbitrum networks
  useEffect(() => {
    const arbitrumChains = [42161, 42170, 421614]; // Arbitrum One, Nova, Sepolia
    setIsArbitrumNetwork(arbitrumChains.includes(chainId || 0));
  }, [chainId]);

  // Auto-switch to Arbitrum One when connected to wrong network
  useEffect(() => {
    if (isConnected && !isArbitrumNetwork && showNetworkWarning && chainId) {
      const timer = setTimeout(() => {
        toast.error(
          'Wrong network detected. Switching to Arbitrum...',
          {
            duration: 3000,
          }
        );
        
        // Auto-switch to Arbitrum after showing the toast
        setTimeout(() => {
          handleSwitchToArbitrum();
        }, 1500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isArbitrumNetwork, showNetworkWarning, chainId]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && isArbitrumNetwork && onConnected) {
      onConnected();
    }
  }, [isConnected, isArbitrumNetwork, onConnected]);

  const handleSwitchToArbitrum = async () => {
    if (!switchChain) return;
    
    try {
      toast.loading('Switching to Arbitrum One...', { id: 'network-switch' });
      await switchChain({ chainId: 42161 }); // Arbitrum One
      toast.success('Successfully switched to Arbitrum One!', { id: 'network-switch' });
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network. Please try manually.', { id: 'network-switch' });
    }
  };

  return (
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openConnectModal}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Connect Wallet
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openChainModal}
                    className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-orange-500/50 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Wrong Network
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </motion.button>
                );
              }

              // Connected and on supported network
              return (
                <div className="flex items-center gap-3">
                  {/* Network Indicator */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openChainModal}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      {chain.hasIcon && (
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="w-4 h-4"
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium text-white">
                        {chain.name}
                      </span>
                    </div>
                  </motion.button>

                  {/* Account Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAccountModal}
                    className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-green-500/50 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {account.displayName}
                      {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}