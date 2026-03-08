import { useState, useEffect } from "react";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 1800);
    const end = setTimeout(() => onFinish(), 2300);
    return () => { clearTimeout(timer); clearTimeout(end); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="relative w-40 h-40 md:w-56 md:h-56 mb-8 animate-spin-slow">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <path
            d="M50 88 C25 65, 2 45, 2 28 C2 14, 14 4, 27 4 C36 4, 44 10, 50 20 C56 10, 64 4, 73 4 C86 4, 98 14, 98 28 C98 45, 75 65, 50 88Z"
            fill="hsl(145, 63%, 49%)"
          />
        </svg>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold text-primary tracking-tight animate-fade-in">
        Salud=Felicidad();
      </h1>
    </div>
  );
}
