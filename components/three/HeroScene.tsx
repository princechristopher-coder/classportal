'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ForgeCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.15;
      coreRef.current.rotation.x += delta * 0.05;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.08;
      wireRef.current.rotation.z += delta * 0.03;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#0a0a0b"
          emissive="#c81e3a"
          emissiveIntensity={0.25}
          roughness={0.3}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial color="#d4af37" wireframe transparent opacity={0.35} />
      </mesh>
      <points ref={pointsRef}>
        <icosahedronGeometry args={[2.6, 3]} />
        <pointsMaterial color="#f1d67a" size={0.02} transparent opacity={0.6} />
      </points>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={40} color="#c81e3a" />
        <pointLight position={[-5, -3, 2]} intensity={25} color="#d4af37" />
        <Suspense fallback={null}>
          <ForgeCore />
        </Suspense>
      </Canvas>
    </div>
  );
}
