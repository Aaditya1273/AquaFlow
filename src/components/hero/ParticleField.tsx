'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    opacity: number;
}

export default function ParticleField() {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        // Initialize particles
        const particleCount = 20;
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            scale: 0.3 + Math.random() * 0.7,
            opacity: 0.2 + Math.random() * 0.4,
        }));

        // Animation loop
        let animationId: number;
        const animate = () => {
            particlesRef.current.forEach((particle) => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Wrap around edges
                if (particle.x < -5) particle.x = 105;
                if (particle.x > 105) particle.x = -5;
                if (particle.y < -5) particle.y = 105;
                if (particle.y > 105) particle.y = -5;
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {particlesRef.current.map((particle, index) => (
                <div
                    key={index}
                    className="absolute w-16 h-16 transition-transform duration-1000 ease-out"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        transform: `translate(-50%, -50%) scale(${particle.scale})`,
                        opacity: particle.opacity,
                    }}
                >
                    <Image
                        src="/assets/particles/particle-glow.png"
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full"
                        style={{ filter: 'blur(2px)' }}
                    />
                </div>
            ))}
        </div>
    );
}
