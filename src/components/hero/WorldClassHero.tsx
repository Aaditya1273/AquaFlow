'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BlurText from '@/components/effects/BlurText';

const DotGrid = dynamic(() => import('@/components/effects/DotGrid'), { ssr: false });
const Aurora = dynamic(() => import('@/components/effects/Aurora'), { ssr: false });

export default function WorldClassHero() {
    const { isConnected } = useAccount();

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black">
            {/* DotGrid Background */}
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={3}
                    gap={40}
                    baseColor="#1e3a8a"
                    activeColor="#00f5ff"
                    proximity={200}
                />
            </div>

            {/* Aurora Effect */}
            <div className="absolute inset-0 z-10 opacity-40">
                <Aurora
                    colorStops={["#5227FF", "#00f5ff", "#0066ff"]}
                    amplitude={1.2}
                    speed={0.8}
                />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 z-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black/50 to-cyan-900/30" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-30 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-400/30 rounded-full backdrop-blur-md">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-sm text-blue-200 font-medium">76% Gas Savings with Arbitrum Stylus</span>
                    </div>
                </motion.div>

                {/* Main Title with BlurText */}
                <div className="mb-6">
                    <BlurText
                        text="AquaFlow"
                        className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-400 bg-clip-text text-transparent"
                        delay={100}
                        animateBy="letters"
                    />
                </div>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mb-4"
                >
                    <h2 className="text-2xl md:text-4xl text-blue-100/90 font-light tracking-wide">
                        Intent-Based Liquidity Router
                    </h2>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="text-lg md:text-xl text-blue-200/70 mb-12 max-w-3xl leading-relaxed"
                >
                    Experience seamless swaps with natural language across Arbitrum One, Nova, and Orbit L3s
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16"
                >
                    {isConnected ? (
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 245, 255, 0.6)' }}
                                whileTap={{ scale: 0.95 }}
                                className="px-10 py-5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-xl text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-cyan-500/70 transition-all duration-300 relative overflow-hidden group"
                            >
                                <span className="relative z-10">Open Dashboard</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </motion.button>
                        </Link>
                    ) : (
                        <div className="connect-wallet-wrapper">
                            <ConnectButton.Custom>
                                {({ openConnectModal }) => (
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 245, 255, 0.6)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={openConnectModal}
                                        className="px-10 py-5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-xl text-white font-bold text-lg shadow-2xl shadow-blue-500/50 hover:shadow-cyan-500/70 transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">Connect Wallet</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </motion.button>
                                )}
                            </ConnectButton.Custom>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-10 py-5 bg-transparent border-2 border-blue-400/50 rounded-xl text-blue-100 font-semibold text-lg hover:border-cyan-400 hover:bg-blue-500/10 transition-all duration-300 backdrop-blur-sm"
                    >
                        Learn More
                    </motion.button>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-5xl"
                >
                    {[
                        { value: '76%', label: 'Gas Savings' },
                        { value: '$2.4B+', label: 'Liquidity' },
                        { value: '10M+', label: 'Users' },
                        { value: '100%', label: 'Stylus' },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                            className="text-center backdrop-blur-sm bg-blue-500/5 rounded-xl p-6 border border-blue-400/20"
                        >
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm md:text-base text-blue-200/70">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-6 h-10 border-2 border-blue-400/40 rounded-full flex items-start justify-center p-2"
                    >
                        <motion.div
                            animate={{ y: [0, 14, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
