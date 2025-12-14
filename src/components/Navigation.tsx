'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/swap', label: 'Swap' },
    { href: '/pools', label: 'Pools' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/admin', label: 'Admin' },
];

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-blue-400/10 backdrop-blur-xl bg-black/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            AquaFlow
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors ${pathname === item.href
                                        ? 'text-cyan-400'
                                        : 'text-blue-200/70 hover:text-white'
                                    }`}
                            >
                                {item.label}
                                {pathname === item.href && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side - Theme Toggle & Wallet */}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <ConnectButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
