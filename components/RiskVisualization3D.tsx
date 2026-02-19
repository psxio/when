"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Sample {
  x: number;
  y: number;
  t: number;
}

interface RiskFactor {
  label: string;
  score: number;
}

interface Props {
  samples: Sample[];
  riskFactors: RiskFactor[];
}

const MAX_POINTS = 600;

/* ------------------------------------------------------------------ */
/*  Data Trace — the user's actual mouse path rendered in 3D           */
/*  X = screen x, Z = screen y (depth), Y = time (vertical)           */
/*  Colored by velocity: blue-gray → green → amber → blood-red        */
/* ------------------------------------------------------------------ */

function DataTrace({ samples }: { samples: Sample[] }) {
  const data = useMemo(() => {
    if (samples.length < 3) return null;

    const stride = Math.max(1, Math.floor(samples.length / MAX_POINTS));
    const pts = samples.filter((_, i) => i % stride === 0);

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const rX = maxX - minX || 1;
    const rY = maxY - minY || 1;
    const tMin = pts[0].t;
    const tMax = pts[pts.length - 1].t;
    const rT = tMax - tMin || 1;

    // Velocity per sample
    const vels: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const dt = pts[i].t - pts[i - 1].t;
      vels.push(dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0);
    }
    const maxV = Math.max(...vels) || 1;

    const slow = new THREE.Color("#1a3a5a");
    const mid = new THREE.Color("#4a7c59");
    const fast = new THREE.Color("#C9A84C");
    const hot = new THREE.Color("#7A2020");

    const positions = new Float32Array(pts.length * 3);
    const colors = new Float32Array(pts.length * 3);
    const trail: [number, number, number][] = [];

    for (let i = 0; i < pts.length; i++) {
      const x = ((pts[i].x - minX) / rX - 0.5) * 4;
      const y = ((pts[i].t - tMin) / rT - 0.5) * 3; // time → vertical
      const z = -((pts[i].y - minY) / rY - 0.5) * 3; // screen Y → depth

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      trail.push([x, y, z]);

      const t = Math.min(vels[i] / maxV, 1);
      let c: THREE.Color;
      if (t < 0.25) c = slow.clone().lerp(mid, t / 0.25);
      else if (t < 0.6) c = mid.clone().lerp(fast, (t - 0.25) / 0.35);
      else c = fast.clone().lerp(hot, (t - 0.6) / 0.4);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return { positions, colors, trail, count: pts.length };
  }, [samples]);

  if (!data || data.count === 0) return null;

  return (
    <group>
      {/* Individual data points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.positions, 3]}
            count={data.count}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[data.colors, 3]}
            count={data.count}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Connection trail */}
      {data.trail.length > 1 && (
        <Line
          points={data.trail}
          color="#C9A84C"
          opacity={0.12}
          transparent
          lineWidth={1}
        />
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Risk Orbs — 5 factors orbiting the data trace                      */
/* ------------------------------------------------------------------ */

function RiskOrbs({ riskFactors }: { riskFactors: RiskFactor[] }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
  });

  return (
    <group ref={groupRef}>
      {riskFactors.map((f, i) => {
        const angle = (i / riskFactors.length) * Math.PI * 2;
        const radius = 3.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (f.score / 100 - 0.5) * 2;
        const size = 0.06 + (f.score / 100) * 0.14;
        const color =
          f.score > 65 ? "#7A2020" : f.score > 40 ? "#C9A84C" : "#4a7c59";

        return (
          <group key={i} position={[x, y, z]}>
            {/* Core orb */}
            <mesh>
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.6}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Glow halo */}
            <mesh>
              <sphereGeometry args={[size * 2.2, 12, 12]} />
              <meshBasicMaterial color={color} transparent opacity={0.05} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Ambient Particles                                                  */
/* ------------------------------------------------------------------ */

function AmbientParticles({ count = 250 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const ember = new THREE.Color("#C9A84C");
    const dim = new THREE.Color("#1a1a1a");

    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random() > 0.8 ? ember : dim;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        vertexColors
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene root                                                         */
/* ------------------------------------------------------------------ */

function Scene({ samples, riskFactors }: Props) {
  const rotateRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    rotateRef.current.rotation.y = state.clock.elapsedTime * 0.06;
  });

  return (
    <>
      <ambientLight intensity={0.04} />
      <pointLight
        position={[0, 0, 0]}
        intensity={0.4}
        color="#C9A84C"
        distance={12}
      />
      <pointLight position={[4, 4, 4]} intensity={0.15} color="#ffffff" />
      <pointLight position={[-4, -2, -4]} intensity={0.08} color="#1a3a5a" />

      <group ref={rotateRef}>
        <DataTrace samples={samples} />
        <RiskOrbs riskFactors={riskFactors} />
      </group>

      <AmbientParticles count={250} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI * 0.75}
        minPolarAngle={Math.PI * 0.25}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function RiskVisualization3D({ samples, riskFactors }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1, 6.5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Scene samples={samples} riskFactors={riskFactors} />
    </Canvas>
  );
}
