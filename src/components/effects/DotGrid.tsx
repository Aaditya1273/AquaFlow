'use client';

import { useEffect, useRef } from 'react';
import './DotGrid.css';

interface DotGridProps {
    dotSize?: number;
    gap?: number;
    baseColor?: string;
    activeColor?: string;
    proximity?: number;
    className?: string;
}

export default function DotGrid({
    dotSize = 4,
    gap = 30,
    baseColor = '#1e40af',
    activeColor = '#00f5ff',
    proximity = 150,
    className = '',
}: DotGridProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const dots: { x: number; y: number }[] = [];

        const resize = () => {
            if (!canvas.parentElement) return;
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;

            // Rebuild dots grid
            dots.length = 0;
            const cols = Math.floor(canvas.width / (dotSize + gap));
            const rows = Math.floor(canvas.height / (dotSize + gap));

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    dots.push({
                        x: x * (dotSize + gap) + gap,
                        y: y * (dotSize + gap) + gap,
                    });
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            dots.forEach((dot) => {
                const dx = mouseRef.current.x - dot.x;
                const dy = mouseRef.current.y - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                let color = baseColor;
                let size = dotSize;

                if (distance < proximity) {
                    const factor = 1 - distance / proximity;
                    // Interpolate color
                    const base = parseInt(baseColor.slice(1), 16);
                    const active = parseInt(activeColor.slice(1), 16);
                    const r = Math.floor(((base >> 16) & 0xff) + (((active >> 16) & 0xff) - ((base >> 16) & 0xff)) * factor);
                    const g = Math.floor(((base >> 8) & 0xff) + (((active >> 8) & 0xff) - ((base >> 8) & 0xff)) * factor);
                    const b = Math.floor((base & 0xff) + ((active & 0xff) - (base & 0xff)) * factor);
                    color = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    size = dotSize + factor * 4;
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            });

            animationId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [dotSize, gap, baseColor, activeColor, proximity]);

    return (
        <div className={`dot-grid ${className}`}>
            <div className="dot-grid__wrap">
                <canvas ref={canvasRef} className="dot-grid__canvas" />
            </div>
        </div>
    );
}
