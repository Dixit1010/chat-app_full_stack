import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";

const AuthSceneContent = () => {
  const meshRef = useRef();
  
  const [reducedMotion, setReducedMotion] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");

  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const listener = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setAccentColor(isDark ? "#818cf8" : "#6366f1");
    };
    updateColor();
    
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (reducedMotion || !meshRef.current) return;
    
    meshRef.current.rotation.x += 0.002;
    meshRef.current.rotation.y += 0.002;
    
    const targetX = pointer.current.x * 0.3;
    const targetY = pointer.current.y * 0.3;
    
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.02;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.02;
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.3}>
      <MeshDistortMaterial
        color={accentColor}
        attach="material"
        distort={reducedMotion ? 0 : 0.5}
        speed={reducedMotion ? 0 : 1.5}
        roughness={1}
        metalness={0}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </Sphere>
  );
};

export default function AuthScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ filter: "blur(50px)" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <AuthSceneContent />
      </Canvas>
    </div>
  );
}
