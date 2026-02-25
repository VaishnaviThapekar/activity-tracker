import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles() {
    const ref = useRef();
    
    // Create random particles
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            ref.current.rotation.x = state.clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={particleCount} 
                    itemSize={3} 
                    array={positions} 
                />
            </bufferGeometry>
            <pointsMaterial 
                size={0.03} 
                color="#4f46e5" 
                sizeAttenuation 
                transparent 
                opacity={0.8} 
            />
        </points>
    );
}

export default function ParticlesBackground() {
    return (
        <div className="absolute inset-0 z-0">
             <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <Particles />
             </Canvas>
        </div>
    );
}
