'use client';

import { motion } from 'framer-motion';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wifi, WifiOff, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NetworkStatus() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const handleSwitchToArbitrum = async () => {
    if (!switchChain) return;
    
    try {
      toast.loading('Switching to Arbitrum One...', { id: 'network-switch' });
      await switchChain({ chainId: 42161 });
      toast.success('Welcome to Arbitrum One!', { id: 'network-switch' });
    } catch (error) {
      toast.error('Please switch manually in your wallet', { id: 'network-switch' });
    }
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openConnectModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/40 rounded-full backdrop-blur-xl text-blue-200 hover:text-white hover:bg-blue-500/30 transition-all duration-300"
            >
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Connect</span>
            </motion.button>
          )}
        </ConnectButton.Custom>
      </motion.div>
    );
  }

  const isArbitrum = chainId === 42161 || chainId === 42170 || chainId === 421614;
  const networkName = chainId === 42161 ? 'Arbitrum One' : 
                     chainId === 42170 ? 'Arbitrum Nova' : 
                     chainId === 421614 ? 'Arbitrum Sepolia' : 
                     'Unsupported Network';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl border transition-all duration-300 ${
        isArbitrum 
          ? 'bg-green-500/20 border-green-400/40 text-green-200' 
          : 'bg-orange-500/20 border-orange-400/40 text-orange-200'
      }`}>
        {isArbitrum ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        
        <div className="flex flex-col">
          <span className="text-xs font-medium">
            {networkName}
          </span>
          <span className="text-xs opacity-70">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>

        {!isArbitrum && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwitchToArbitrum}
            className="p-1 bg-blue-500/30 hover:bg-blue-500/50 rounded-full transition-colors"
            title="Switch to Arbitrum One"
          >
            <Zap className="w-3 h-3 text-blue-300" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}