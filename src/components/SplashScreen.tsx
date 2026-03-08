import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Heart() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -2);
  heartShape.bezierCurveTo(0, -2.4, -0.5, -2.8, -1, -2.8);
  heartShape.bezierCurveTo(-2, -2.8, -2, -1.6, -2, -1.6);
  heartShape.bezierCurveTo(-2, -0.6, -1, 0.4, 0, 1.2);
  heartShape.bezierCurveTo(1, 0.4, 2, -0.6, 2, -1.6);
  heartShape.bezierCurveTo(2, -1.6, 2, -2.8, 1, -2.8);
  heartShape.bezierCurveTo(0.5, -2.8, 0, -2.4, 0, -2);

  const extrudeSettings = {
    depth: 0.6,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 2,
    bevelSize: 0.15,
    bevelThickness: 0.15,
  };

  return (
    <mesh ref={meshRef} scale={0.7} position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshStandardMaterial color="#2ECC71" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 2200);
    const end = setTimeout(() => onFinish(), 2800);
    return () => { clearTimeout(timer); clearTimeout(end); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <div className="w-72 h-72 md:w-96 md:h-96 mb-6">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 5]} intensity={1} />
          <Heart />
        </Canvas>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold text-primary tracking-tight animate-fade-in">
        Salud=Felicidad();
      </h1>
    </div>
  );
}
