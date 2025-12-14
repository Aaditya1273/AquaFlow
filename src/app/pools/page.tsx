'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

const LIQUIDITY_POOLS = [
    {
        id: 1,
        pair: 'ETH/USDC',
        chain: 'Arbitrum One',
        tvl: '$12.5M',
        volume24h: '$2.1M',
        apr: '45.2%',
        myLiquidity: '$5,420',
    },
    {
        id: 2,
        pair: 'USDC/USDT',
        chain: 'Arbitrum Nova',
        tvl: '$8.3M',
        volume24h: '$1.8M',
        apr: '38.7%',
        myLiquidity: '$0',
    },
    {
        id: 3,
        pair: 'ARB/ETH',
        chain: 'Orbit L3',
        tvl: '$4.2M',
        volume24h: '$890K',
        apr: '52.1%',
        myLiquidity: '$2,100',
    },
    {
        id: 4,
        pair: 'ETH/USDT',
        chain: 'Arbitrum One',
        tvl: '$9.7M',
        volume24h: '$1.5M',
        apr: '41.3%',
        myLiquidity: '$0',
    },
];

export default function PoolsPage() {
    const { isConnected } = useAccount();
    const [selectedPool, setSelectedPool] = useState<number | null>(null);

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-6">Connect Wallet to View Pools</h1>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-blue-400/10 backdrop-blur-xl bg-black/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Liquidity Pools
                    </h1>
                    <ConnectButton />
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total TVL', value: '$34.7M' },
                        { label: '24h Volume', value: '$6.3M' },
                        { label: 'My Liquidity', value: '$7,520' },
                        { label: 'Avg APR', value: '44.3%' },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-6"
                        >
                            <div className="text-sm text-blue-200/60 mb-2">{stat.label}</div>
                            <div className="text-3xl font-bold text-white">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Pools List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">All Pools</h2>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">
                            + Add Liquidity
                        </button>
                    </div>

                    <div className="space-y-4">
                        {LIQUIDITY_POOLS.map((pool, index) => (
                            <motion.div
                                key={pool.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedPool(pool.id)}
                                className={`bg-black/30 border rounded-xl p-6 cursor-pointer transition-all ${selectedPool === pool.id
                                        ? 'border-blue-400/50 bg-blue-500/10'
                                        : 'border-blue-400/20 hover:border-blue-400/40'
                                    }`}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                                    <div>
                                        <div className="text-xl font-bold text-white">{pool.pair}</div>
                                        <div className="text-sm text-blue-300">{pool.chain}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-200/60">TVL</div>
                                        <div className="text-lg font-semibold text-white">{pool.tvl}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-200/60">24h Volume</div>
                                        <div className="text-lg font-semibold text-white">{pool.volume24h}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-200/60">APR</div>
                                        <div className="text-lg font-semibold text-green-400">{pool.apr}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-blue-200/60">My Liquidity</div>
                                        <div className="text-lg font-semibold text-cyan-400">{pool.myLiquidity}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 hover:bg-blue-500/30 transition-all text-sm">
                                            Add
                                        </button>
                                        {pool.myLiquidity !== '$0' && (
                                            <button className="px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 hover:bg-red-500/30 transition-all text-sm">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Pool Details (if selected) */}
                {selectedPool && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6">Pool Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-blue-200/60 mb-2">Total Fees (24h)</div>
                                <div className="text-2xl font-bold text-white">$12,450</div>
                            </div>
                            <div>
                                <div className="text-sm text-blue-200/60 mb-2">Your Share</div>
                                <div className="text-2xl font-bold text-white">2.15%</div>
                            </div>
                            <div>
                                <div className="text-sm text-blue-200/60 mb-2">Earned Fees</div>
                                <div className="text-2xl font-bold text-green-400">$267.68</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
