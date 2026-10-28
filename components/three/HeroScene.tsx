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
          color="#9fb4ff"
          emissive="#5ce1e6"
          emissiveIntensity={0.12}
          roughness={0.12}
          metalness={0.3}
          transparent
          opacity={0.16}
          wireframe={false}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial color="#5ce1e6" wireframe transparent opacity={0.35} />
      </mesh>
      <points ref={pointsRef}>
        <icosahedronGeometry args={[2.6, 3]} />
        <pointsMaterial color="#bff7f9" size={0.02} transparent opacity={0.6} />
      </points>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 lg:left-1/2">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={22} color="#8f7bff" />
        <pointLight position={[-5, -3, 2]} intensity={14} color="#5ce1e6" />
        <Suspense fallback={null}>
          <ForgeCore />
        </Suspense>
      </Canvas>
    </div>
  );
}
