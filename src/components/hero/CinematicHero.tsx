'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import ParticleField from './ParticleField';

const LiquidCanvas = dynamic(() => import('./HeroScene'), { ssr: false });

export default function CinematicHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 1.1]);

    return (
        <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
            {/* Background Gradient */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{ opacity, scale }}
            >
                <Image
                    src="/assets/textures/space-gradient.png"
                    alt=""
                    fill
                    className="object-cover"
                    priority
                />
            </motion.div>

            {/* Professional Liquid Hero Image */}
            <motion.div
                className="absolute inset-0 z-10 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            >
                <div className="relative w-full h-full max-w-6xl max-h-[800px]">
                    <Image
                        src="/assets/textures/liquid-hero.png"
                        alt=""
                        fill
                        className="object-contain"
                        style={{ mixBlendMode: 'screen', opacity: 0.8 }}
                        priority
                    />
                </div>
            </motion.div>

            {/* Noise Overlay */}
            <div
                className="absolute inset-0 z-15 opacity-5 mix-blend-overlay"
                style={{
                    backgroundImage: 'url(/assets/textures/noise-overlay.png)',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Light Rays */}
            <motion.div
                className="absolute top-0 left-0 w-1/2 h-full z-20 opacity-20"
                animate={{
                    opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <Image
                    src="/assets/lights/light-ray-01.png"
                    alt=""
                    fill
                    className="object-contain"
                    style={{ mixBlendMode: 'screen' }}
                />
            </motion.div>

            <motion.div
                className="absolute top-0 right-0 w-1/2 h-full z-20 opacity-15"
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                }}
            >
                <Image
                    src="/assets/lights/light-ray-01.png"
                    alt=""
                    fill
                    className="object-contain scale-x-[-1]"
                    style={{ mixBlendMode: 'screen' }}
                />
            </motion.div>

            {/* Particle Field */}
            <div className="absolute inset-0 z-30">
                <ParticleField />
            </div>

            {/* Canvas Particle System */}
            <div className="absolute inset-0 z-35">
                <LiquidCanvas />
            </div>

            {/* Content */}
            <div className="relative z-50 flex flex-col items-center justify-center h-full px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="text-center"
                >
                    <motion.h1
                        className="text-7xl md:text-9xl font-bold mb-6 tracking-tight"
                        style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #00f5ff 50%, #0066ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: '0 0 80px rgba(0, 245, 255, 0.5)',
                        }}
                    >
                        AquaFlow
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="text-2xl md:text-3xl text-blue-100 font-light tracking-wide mb-12"
                    >
                        Intent-Based Liquidity Router
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 1.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 245, 255, 0.6)' }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl overflow-hidden transition-all duration-300 shadow-lg shadow-blue-500/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative text-white font-semibold text-lg">Launch App</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-10 py-5 bg-transparent border-2 border-blue-400/40 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-400/80"
                        >
                            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative text-blue-100 font-semibold text-lg group-hover:text-white transition-colors">Learn More</span>
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-6 h-10 border-2 border-blue-400/30 rounded-full flex items-start justify-center p-2"
                    >
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-45" />
        </div>
    );
}
