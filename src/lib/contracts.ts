// AquaFlow Contract Addresses - Arbitrum Sepolia
export const CONTRACTS = {
  STYLUS_ROUTER: "0xB1c86a33E6411a3b0b6F3E6C5B8B8B8B8B8B8B8B",
  SOLIDITY_WRAPPER: "0xA0b86a33E6411a3b0b6F3E6C5B8B8B8B8B8B8B8B",
  MOCK_USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  MOCK_USDT: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
} as const;

export const NETWORK_CONFIG = {
  chainId: 421614,
  name: "Arbitrum Sepolia",
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  blockExplorer: "https://sepolia.arbiscan.io",
} as const;
