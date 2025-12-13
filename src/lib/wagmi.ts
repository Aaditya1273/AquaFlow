// Elite Wagmi Configuration - Production-grade Web3 setup
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { arbitrum, arbitrumGoerli, arbitrumSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';

// Custom Orbit L3 chain for demo
const orbitL3 = {
  id: 421337,
  name: 'AquaFlow Demo L3',
  network: 'aquaflow-l3',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8547'] },
    public: { http: ['http://localhost:8547'] },
  },
  blockExplorers: {
    default: { name: 'Demo Explorer', url: 'http://localhost:4000' },
  },
  testnet: true,
} as const;

// Provider hierarchy for reliability
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [arbitrum, arbitrumSepolia, arbitrumGoerli, orbitL3],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY || 'demo' }),
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_KEY || 'demo' }),
    publicProvider(),
  ]
);

// Wallet configuration
const { connectors } = getDefaultWallets({
  appName: 'AquaFlow',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains,
});

// Wagmi client configuration
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };