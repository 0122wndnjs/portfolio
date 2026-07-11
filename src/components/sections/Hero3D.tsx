"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Html, Lightformer, Line, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SystemNode = {
  label: string;
  role: string;
  position: [number, number, number];
  color: string;
};

const systemNodes: SystemNode[] = [
  { label: "REACT", role: "INTERFACE", position: [-1.3, 1.2, 0.15], color: "#5b4dff" },
  { label: "TYPESCRIPT", role: "LANGUAGE", position: [1.3, 1.25, -0.15], color: "#8fa1ff" },
  { label: "NODE.JS", role: "RUNTIME", position: [-1.5, -0.85, -0.2], color: "#59f0c0" },
  { label: "WEB3", role: "PROTOCOL", position: [1.5, -0.75, 0.1], color: "#14c8eb" },
  { label: "SOLIDITY", role: "CONTRACT", position: [0.05, -1.65, -0.45], color: "#5b4dff" },
];

function DataPacket({ end, color, delay }: { end: THREE.Vector3; color: string; delay: number }) {
  const packet = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!packet.current) return;
    const progress = (clock.elapsedTime * 0.22 + delay) % 1;
    packet.current.position.copy(end).multiplyScalar(progress);
    const pulse = 0.75 + Math.sin(progress * Math.PI) * 0.45;
    packet.current.scale.setScalar(0.045 * pulse);
  });

  return (
    <mesh ref={packet} scale={0.045}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function TechNode({ node, index }: { node: SystemNode; index: number }) {
  const position = useMemo(() => new THREE.Vector3(...node.position), [node.position]);

  return (
    <group position={position}>
      <Line
        points={[[0, 0, 0], [-position.x, -position.y, -position.z]]}
        color={node.color}
        lineWidth={0.8}
        transparent
        opacity={0.34}
      />
      <mesh>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={1.25}
          roughness={0.25}
          metalness={0.45}
        />
      </mesh>
      <mesh scale={1.65}>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.09} />
      </mesh>
      <Html center distanceFactor={7} position={[0, 0.38, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-md border border-[#5b4dff]/15 bg-white/70 px-2.5 py-1.5 font-mono shadow-[0_8px_30px_rgba(91,77,255,0.10)] backdrop-blur-md">
          <div className="text-[9px] font-bold tracking-[0.14em] text-[#0e0d1f]">{node.label}</div>
          <div className="mt-0.5 text-[6px] tracking-[0.18em] text-[#0e0d1f]/45">{node.role}</div>
        </div>
      </Html>
      <DataPacket end={position.clone().multiplyScalar(-1)} color={node.color} delay={index * 0.17} />
    </group>
  );
}

function SystemCore() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * 0.09;
      core.current.rotation.y += delta * 0.14;
    }
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.14, 0.035);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.1, 0.035);
    }
  });

  return (
    <group
      ref={group}
      position={[2.35, 0.2, -0.65]}
      rotation={[-0.04, -0.08, 0.02]}
      scale={0.84}
    >
      <Float speed={1.05} rotationIntensity={0.12} floatIntensity={0.45}>
        {systemNodes.map((node, index) => (
          <TechNode key={node.label} node={node} index={index} />
        ))}

        <mesh ref={core}>
          <icosahedronGeometry args={[0.68, 1]} />
          <meshPhysicalMaterial
            color="#dfe4ff"
            emissive="#5b4dff"
            emissiveIntensity={0.22}
            transmission={0.72}
            thickness={0.8}
            roughness={0.12}
            metalness={0.12}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh scale={0.3}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#5b4dff"
            emissive="#14c8eb"
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.45, 0, 0.25]}>
          <torusGeometry args={[0.98, 0.008, 8, 120]} />
          <meshBasicMaterial color="#14c8eb" transparent opacity={0.42} />
        </mesh>

        <Html center distanceFactor={7} position={[0, 0.02, 0.72]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap text-center font-mono">
            <div className="text-[8px] font-bold tracking-[0.22em] text-[#0e0d1f]">SYSTEM CORE</div>
            <div className="mt-1 text-[6px] tracking-[0.16em] text-[#5b4dff]">BUILD · CONNECT · SHIP</div>
          </div>
        </Html>
      </Float>

      <Sparkles count={42} scale={5} size={1.4} speed={0.22} opacity={0.28} color="#8fa1ff" />
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
    >
      <ambientLight intensity={0.65} />
      <SystemCore />
      <Environment resolution={256}>
        <Lightformer intensity={2.6} position={[4, 2, 4]} scale={[4, 6, 1]} color="#5b4dff" />
        <Lightformer intensity={2.2} position={[-5, -1, 3]} scale={[5, 4, 1]} color="#14c8eb" />
        <Lightformer intensity={1.4} position={[0, 5, -4]} scale={[8, 3, 1]} color="#59f0c0" />
        <Lightformer intensity={2.4} position={[0, -3, 3]} scale={[7, 2, 1]} color="#ffffff" />
      </Environment>
    </Canvas>
  );
}
