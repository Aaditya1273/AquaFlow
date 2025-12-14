// Elite Chain Detection Hook - Auto-switch to supported Arbitrum chains
import { useEffect } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { toast } from 'react-hot-toast';

// Simplified chain info for the hook
const CHAIN_INFO = {
  42161: { name: 'Arbitrum One', icon: '🔵', color: '#28A0F0', fees: 'Low' },
  42170: { name: 'Arbitrum Nova', icon: '🟠', color: '#FF6B35', fees: 'Ultra Low' },
  421614: { name: 'Arbitrum Sepolia', icon: '🟡', color: '#FFC107', fees: 'Testnet' },
} as const;

export function useChainDetection() {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  const isSupported = chainId ? Object.keys(CHAIN_INFO).includes(chainId.toString()) : false;
  const chainInfo = chainId ? CHAIN_INFO[chainId as keyof typeof CHAIN_INFO] : null;
  
  // Auto-switch to Arbitrum One if on unsupported chain
  useEffect(() => {
    if (chainId && !isSupported && switchChain) {
      toast.error(
        `Chain ${chainId} is not supported. Switching to Arbitrum One...`,
        { id: 'chain-switch' }
      );
      
      switchChain({ chainId: 42161 }); // Arbitrum One
    }
  }, [chainId, isSupported, switchChain]);
  
  // Success notification when switching to supported chain
  useEffect(() => {
    if (chainId && isSupported && chainInfo) {
      toast.success(
        `Connected to ${chainInfo.name} ${chainInfo.icon}`,
        { 
          id: 'chain-connected',
          duration: 2000,
        }
      );
    }
  }, [chainId, isSupported, chainInfo]);
  
  const switchToChain = (targetChainId: number) => {
    if (switchChain && targetChainId !== chainId) {
      const targetChain = CHAIN_INFO[targetChainId as keyof typeof CHAIN_INFO];
      toast.loading(
        `Switching to ${targetChain?.name}...`,
        { id: 'manual-switch' }
      );
      
      switchChain({ chainId: targetChainId });
    }
  };
  
  return {
    currentChainId: chainId,
    isSupported,
    chainInfo,
    isSwitching,
    switchToChain,
    supportedChains: Object.keys(CHAIN_INFO).map(Number),
  };
}