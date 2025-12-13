// Elite Chain Detection Hook - Auto-switch to supported Arbitrum chains
import { useEffect } from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { toast } from 'react-hot-toast';
import { chainUtils } from '@/lib/utils';
import { CHAIN_INFO } from '@/lib/constants';

export function useChainDetection() {
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitching } = useSwitchNetwork();
  
  const isSupported = chain ? chainUtils.isSupported(chain.id) : false;
  const chainInfo = chain ? CHAIN_INFO[chain.id as keyof typeof CHAIN_INFO] : null;
  
  // Auto-switch to Arbitrum One if on unsupported chain
  useEffect(() => {
    if (chain && !isSupported && switchNetwork) {
      toast.error(
        `${chain.name} is not supported. Switching to Arbitrum One...`,
        { id: 'chain-switch' }
      );
      
      switchNetwork(42161); // Arbitrum One
    }
  }, [chain, isSupported, switchNetwork]);
  
  // Success notification when switching to supported chain
  useEffect(() => {
    if (chain && isSupported && chainInfo) {
      toast.success(
        `Connected to ${chainInfo.name} ${chainInfo.icon}`,
        { 
          id: 'chain-connected',
          duration: 2000,
        }
      );
    }
  }, [chain?.id, isSupported, chainInfo]);
  
  const switchToChain = (chainId: number) => {
    if (switchNetwork && chainId !== chain?.id) {
      const targetChain = CHAIN_INFO[chainId as keyof typeof CHAIN_INFO];
      toast.loading(
        `Switching to ${targetChain?.name}...`,
        { id: 'manual-switch' }
      );
      
      switchNetwork(chainId);
    }
  };
  
  return {
    currentChain: chain,
    isSupported,
    chainInfo,
    isSwitching,
    switchToChain,
    supportedChains: Object.keys(CHAIN_INFO).map(Number),
  };
}