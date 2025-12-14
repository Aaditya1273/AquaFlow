'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export default function AdminPage() {
    const { isConnected, address } = useAccount();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock admin check - in production, verify on-chain role
    const isAdmin = isConnected;

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-6">Connect Wallet to Access Admin</h1>
                    <ConnectButton />
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-400 mb-4">Access Denied</h1>
                    <p className="text-blue-200/60">You don't have admin permissions</p>
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
                        Admin Portal
                    </h1>
                    <ConnectButton />
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    {['overview', 'pools', 'users', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                    : 'bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* System Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Protocol TVL', value: '$45.2M', change: '+12.5%' },
                                { label: 'Active Pools', value: '24', change: '+3' },
                                { label: 'Total Users', value: '12,340', change: '+234' },
                                { label: 'Protocol Revenue', value: '$125K', change: '+18.2%' },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-6"
                                >
                                    <div className="text-sm text-blue-200/60 mb-2">{stat.label}</div>
                                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                    <div className="text-sm text-green-400">{stat.change}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
                            <div className="space-y-4">
                                {[
                                    { action: 'Pool Created', details: 'ETH/USDC on Arbitrum One', time: '2m ago' },
                                    { action: 'Liquidity Added', details: '$50K to ARB/ETH pool', time: '15m ago' },
                                    { action: 'User Registered', details: 'New user from APAC region', time: '1h ago' },
                                    { action: 'Fee Update', details: 'Protocol fee adjusted to 0.3%', time: '3h ago' },
                                ].map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-black/30 border border-blue-400/10 rounded-xl"
                                    >
                                        <div>
                                            <div className="text-white font-semibold">{activity.action}</div>
                                            <div className="text-sm text-blue-200/60">{activity.details}</div>
                                        </div>
                                        <div className="text-sm text-blue-300">{activity.time}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Pools Management Tab */}
                {activeTab === 'pools' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Pool Management</h2>
                            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-semibold">
                                + Create Pool
                            </button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { pair: 'ETH/USDC', status: 'Active', tvl: '$12.5M', fees: '$2.1K' },
                                { pair: 'USDC/USDT', status: 'Active', tvl: '$8.3M', fees: '$1.5K' },
                                { pair: 'ARB/ETH', status: 'Paused', tvl: '$4.2M', fees: '$890' },
                            ].map((pool, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-6 bg-black/30 border border-blue-400/10 rounded-xl"
                                >
                                    <div className="flex-1">
                                        <div className="text-xl font-bold text-white">{pool.pair}</div>
                                        <div className="text-sm text-blue-300">TVL: {pool.tvl} • Fees: {pool.fees}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm ${pool.status === 'Active'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                }`}
                                        >
                                            {pool.status}
                                        </span>
                                        <button className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 hover:bg-blue-500/30 transition-all">
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-blue-400/20">
                                        <th className="text-left text-sm text-blue-200/60 pb-3">Address</th>
                                        <th className="text-left text-sm text-blue-200/60 pb-3">Total Volume</th>
                                        <th className="text-left text-sm text-blue-200/60 pb-3">Swaps</th>
                                        <th className="text-left text-sm text-blue-200/60 pb-3">Region</th>
                                        <th className="text-left text-sm text-blue-200/60 pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { address: '0x1234...5678', volume: '$125K', swaps: 45, region: 'APAC', status: 'Active' },
                                        { address: '0x8765...4321', volume: '$89K', swaps: 32, region: 'APAC', status: 'Active' },
                                        { address: '0xabcd...efgh', volume: '$67K', swaps: 28, region: 'EU', status: 'Active' },
                                    ].map((user, index) => (
                                        <tr key={index} className="border-b border-blue-400/10">
                                            <td className="py-4 text-white font-mono">{user.address}</td>
                                            <td className="py-4 text-blue-300">{user.volume}</td>
                                            <td className="py-4 text-white">{user.swaps}</td>
                                            <td className="py-4 text-blue-200/60">{user.region}</td>
                                            <td className="py-4">
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                                                    {user.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-400/20 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Protocol Settings</h2>
                        <div className="space-y-6">
                            {[
                                { label: 'Protocol Fee', value: '0.3%', description: 'Fee charged on all swaps' },
                                { label: 'Min Liquidity', value: '$1,000', description: 'Minimum liquidity for new pools' },
                                { label: 'Emergency Pause', value: 'Disabled', description: 'Emergency shutdown capability' },
                            ].map((setting, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-6 bg-black/30 border border-blue-400/10 rounded-xl"
                                >
                                    <div>
                                        <div className="text-lg font-semibold text-white">{setting.label}</div>
                                        <div className="text-sm text-blue-200/60">{setting.description}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-cyan-400 font-semibold">{setting.value}</span>
                                        <button className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 hover:bg-blue-500/30 transition-all">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
