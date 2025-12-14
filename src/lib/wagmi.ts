// Elite Wagmi Configuration - Perfect Arbitrum Integration
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumNova, arbitrumSepolia, mainnet, polygon } from 'wagmi/chains';

// Optimized Wagmi configuration for seamless UX
export const wagmiConfig = getDefaultConfig({
  appName: 'AquaFlow',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [
    arbitrum,           // Primary: Arbitrum One
    arbitrumNova,       // Arbitrum Nova
    arbitrumSepolia,    // Testnet
    mainnet,            // Ethereum (for broader compatibility)
    polygon,            // Polygon (popular L2)
  ],
  ssr: true,
});

// Export chains for RainbowKit
export const chains = [arbitrum, arbitrumNova, arbitrumSepolia, mainnet, polygon];

// Smart network switching with user-friendly UX
export const switchToArbitrum = async () => {
  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa4b1' }], // Arbitrum One
      });
      return true;
    }
  } catch (error: any) {
    // Auto-add Arbitrum if not in wallet
    if (error.code === 4902 && typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xa4b1',
            chainName: 'Arbitrum One',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io/'],
            iconUrls: ['https://arbitrum.io/logo.png'],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Arbitrum network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Arbitrum:', error);
    return false;
  }
  return false;
};