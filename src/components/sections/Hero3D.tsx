"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  Line,
  MeshTransmissionMaterial,
  Sparkles,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// transmission material samples this instead of the (transparent) canvas backdrop
const GLASS_BACKGROUND = new THREE.Color("#eef0fb");

const orbitNodes = [
  { angle: 0.2, radius: 1.75, y: 0.1, size: 0.16, color: "#5b4dff" },
  { angle: 1.35, radius: 2.05, y: -0.2, size: 0.12, color: "#14c8eb" },
  { angle: 2.55, radius: 1.55, y: 0.3, size: 0.14, color: "#59f0c0" },
  { angle: 3.75, radius: 1.95, y: -0.05, size: 0.1, color: "#8fa1ff" },
  { angle: 4.85, radius: 1.65, y: 0.22, size: 0.13, color: "#14c8eb" },
  { angle: 5.65, radius: 2.2, y: -0.28, size: 0.11, color: "#5b4dff" },
];

function MultiChainOrbit() {
  const core = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const orbitA = useRef<THREE.Group>(null);
  const orbitB = useRef<THREE.Group>(null);

  const nodes = useMemo(
    () =>
      orbitNodes.map((node) => ({
        ...node,
        position: new THREE.Vector3(
          Math.cos(node.angle) * node.radius,
          node.y,
          Math.sin(node.angle) * node.radius * 0.55,
        ),
      })),
    [],
  );

  useFrame((state, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * 0.12;
      core.current.rotation.y += delta * 0.18;
    }
    if (orbitA.current) {
      orbitA.current.rotation.y += delta * 0.12;
    }
    if (orbitB.current) {
      orbitB.current.rotation.z -= delta * 0.08;
    }
    if (group.current) {
      const { x, y } = state.pointer;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.3, 0.04);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.2, 0.04);
    }
  });

  return (
    <group ref={group} position={[2.6, 0.35, -0.8]}>
      <Float speed={1.2} rotationIntensity={0.45} floatIntensity={1.0}>
        <group ref={orbitA} rotation={[0.25, 0, -0.08]}>
          <mesh>
            <torusGeometry args={[1.8, 0.008, 8, 160]} />
            <meshBasicMaterial color="#8fa1ff" transparent opacity={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 2.6, 0, 0.35]}>
            <torusGeometry args={[1.45, 0.006, 8, 160]} />
            <meshBasicMaterial color="#14c8eb" transparent opacity={0.28} />
          </mesh>
        </group>

        <group ref={orbitB} rotation={[0.7, 0.2, 0.45]}>
          <mesh>
            <torusGeometry args={[2.08, 0.005, 8, 160]} />
            <meshBasicMaterial color="#59f0c0" transparent opacity={0.22} />
          </mesh>
        </group>

        {nodes.map((node, index) => (
          <group key={`${node.color}-${index}`} position={node.position}>
            <mesh scale={node.size}>
              <sphereGeometry args={[1, 24, 24]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={1.2}
                roughness={0.24}
                metalness={0.35}
              />
            </mesh>
            <Line
              points={[[0, 0, 0], [-node.position.x, -node.position.y, -node.position.z]]}
              color={node.color}
              lineWidth={0.8}
              transparent
              opacity={0.25}
            />
          </group>
        ))}

        <mesh ref={core} scale={0.82}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshTransmissionMaterial
            background={GLASS_BACKGROUND}
            thickness={0.55}
            roughness={0.07}
            transmission={1}
            ior={1.45}
            chromaticAberration={0.32}
            anisotropicBlur={0.22}
            distortion={0.16}
            distortionScale={0.32}
            temporalDistortion={0.08}
            color="#dfe4ff"
          />
        </mesh>

        <mesh scale={0.34}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#5b4dff"
            emissive="#14c8eb"
            emissiveIntensity={1.7}
            roughness={0.25}
            metalness={0.55}
          />
        </mesh>
      </Float>

      <Sparkles count={58} scale={5.2} size={1.7} speed={0.28} opacity={0.35} color="#8fa1ff" />
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
      <ambientLight intensity={0.5} />
      <MultiChainOrbit />
      {/* local lightformer env — no runtime HDR fetch */}
      <Environment resolution={256}>
        <Lightformer intensity={2.6} position={[4, 2, 4]} scale={[4, 6, 1]} color="#5b4dff" />
        <Lightformer intensity={2.2} position={[-5, -1, 3]} scale={[5, 4, 1]} color="#14c8eb" />
        <Lightformer intensity={1.4} position={[0, 5, -4]} scale={[8, 3, 1]} color="#59f0c0" />
        <Lightformer intensity={2.4} position={[0, -3, 3]} scale={[7, 2, 1]} color="#ffffff" />
      </Environment>
    </Canvas>
  );
}
