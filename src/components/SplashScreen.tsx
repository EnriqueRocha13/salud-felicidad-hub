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
  const x = 0, y = 0;
  heartShape.moveTo(x, y + 0.5);
  heartShape.bezierCurveTo(x, y + 0.5, x - 0.5, y, x - 0.5, y);
  heartShape.bezierCurveTo(x - 0.5, y - 0.35, x, y - 0.6, x, y - 0.8);
  heartShape.bezierCurveTo(x, y - 0.6, x + 0.5, y - 0.35, x + 0.5, y);
  heartShape.bezierCurveTo(x + 0.5, y, x, y + 0.5, x, y + 0.5);

  const extrudeSettings = {
    depth: 0.3,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 2,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  return (
    <mesh ref={meshRef} scale={2.5} position={[0, 0.2, 0]}>
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
      <div className="w-48 h-48 mb-6">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 5]} intensity={1} />
          <Heart />
        </Canvas>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight animate-fade-in">
        Salud=Felicidad();
      </h1>
    </div>
  );
}
