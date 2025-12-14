'use client';

import { useEffect, useRef } from "react";
import "./Aurora.css";

interface AuroraProps {
    colorStops?: string[];
    amplitude?: number;
    blend?: number;
    speed?: number;
    className?: string;
}

export default function Aurora({
    colorStops = ["#5227FF", "#00f5ff", "#0066ff"],
    amplitude = 1.0,
    blend = 0.5,
    speed = 1.0,
    className = "",
}: AuroraProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const resize = () => {
            if (!canvas.parentElement) return;
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            time += 0.01 * speed;

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            colorStops.forEach((color, index) => {
                gradient.addColorStop(index / (colorStops.length - 1), color);
            });

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw flowing aurora effect
            for (let i = 0; i < canvas.width; i += 2) {
                const wave = Math.sin(i * 0.01 + time) * amplitude * 50;
                const alpha = 0.3 + Math.sin(i * 0.02 + time * 0.5) * 0.2;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = gradient;
                ctx.fillRect(i, canvas.height / 2 + wave - 100, 2, 200);
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [colorStops, amplitude, blend, speed]);

    return (
        <div className={`aurora-container ${className}`}>
            <canvas ref={canvasRef} />
        </div>
    );
}
