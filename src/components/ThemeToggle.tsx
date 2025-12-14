'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="relative w-14 h-7 bg-blue-500/20 border border-blue-400/30 rounded-full p-1 transition-colors hover:bg-blue-500/30"
            aria-label="Toggle theme"
        >
            <motion.div
                animate={{
                    x: theme === 'dark' ? 0 : 24,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                <span className="text-xs">🌙</span>
                <span className="text-xs">☀️</span>
            </div>
        </motion.button>
    );
}
