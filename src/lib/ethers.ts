// Ethers adapter for viem clients
import { ethers } from 'ethers';
import { PublicClient } from 'viem';

export function publicClientToProvider(publicClient: PublicClient): ethers.Provider {
  // Create a simple ethers provider using the RPC URL
  const rpcUrl = publicClient.transport.url || 'https://arb1.arbitrum.io/rpc';
  return new ethers.JsonRpcProvider(rpcUrl);
}