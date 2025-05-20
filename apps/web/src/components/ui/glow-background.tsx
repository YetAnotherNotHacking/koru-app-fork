"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function GlowBackground() {
  const baseX1 = useMotionValue(0);
  const baseY1 = useMotionValue(0);
  const baseX2 = useMotionValue(0);
  const baseY2 = useMotionValue(0);
  const baseX3 = useMotionValue(0);
  const baseY3 = useMotionValue(0);

  const centerX = useMotionValue(0);
  const centerY = useMotionValue(0);

  const springX1 = useSpring(baseX1, { damping: 25, stiffness: 40, mass: 1.5 });
  const springY1 = useSpring(baseY1, { damping: 25, stiffness: 40, mass: 1.5 });
  const springX2 = useSpring(baseX2, { damping: 25, stiffness: 40, mass: 2.2 });
  const springY2 = useSpring(baseY2, { damping: 25, stiffness: 40, mass: 2.2 });
  const springX3 = useSpring(baseX3, { damping: 25, stiffness: 40, mass: 1.8 });
  const springY3 = useSpring(baseY3, { damping: 25, stiffness: 40, mass: 1.8 });

  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const updatePositions = useCallback(() => {
    const newCenterX = window.innerWidth / 2;
    const newCenterY = window.innerHeight / 2;

    centerX.set(newCenterX);
    centerY.set(newCenterY);

    const time = timeRef.current;

    baseX1.set(newCenterX - 250 + Math.sin(time * 0.3) * 80);
    baseY1.set(newCenterY - 250 + Math.cos(time * 0.2) * 60);

    baseX2.set(newCenterX + 200 + Math.cos(time * 0.25) * 100);
    baseY2.set(newCenterY - 300 + Math.sin(time * 0.35) * 70);

    baseX3.set(newCenterX - 100 + Math.sin(time * 0.4) * 70);
    baseY3.set(newCenterY + 200 + Math.cos(time * 0.3) * 50);
  }, [baseX1, baseY1, baseX2, baseY2, baseX3, baseY3, centerX, centerY]);

  useEffect(() => {
    updatePositions();

    window.addEventListener("resize", updatePositions);

    return () => {
      window.removeEventListener("resize", updatePositions);
    };
  }, [updatePositions]);

  useEffect(() => {
    const animateFloating = (timestamp: number) => {
      const time = timestamp * 0.0005;
      timeRef.current = time;

      const currCenterX = centerX.get();
      const currCenterY = centerY.get();

      const newX1 = currCenterX - 250 + Math.sin(time * 0.3) * 80;
      const newY1 = currCenterY - 250 + Math.cos(time * 0.2) * 60;

      const newX2 = currCenterX + 200 + Math.cos(time * 0.25) * 100;
      const newY2 = currCenterY - 300 + Math.sin(time * 0.35) * 70;

      const newX3 = currCenterX - 100 + Math.sin(time * 0.4) * 70;
      const newY3 = currCenterY + 200 + Math.cos(time * 0.3) * 50;

      baseX1.set(newX1);
      baseY1.set(newY1);
      baseX2.set(newX2);
      baseY2.set(newY2);
      baseX3.set(newX3);
      baseY3.set(newY3);

      animationRef.current = requestAnimationFrame(animateFloating);
    };

    animationRef.current = requestAnimationFrame(animateFloating);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [baseX1, baseY1, baseX2, baseY2, baseX3, baseY3, centerX, centerY]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute blur-[100px] opacity-70 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 w-[500px] h-[500px]"
        style={{
          x: springX1,
          y: springY1,
        }}
      />

      <motion.div
        className="absolute blur-[120px] opacity-50 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 w-[600px] h-[600px]"
        style={{
          x: springX2,
          y: springY2,
        }}
      />

      <motion.div
        className="absolute blur-[150px] opacity-40 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 w-[400px] h-[400px]"
        style={{
          x: springX3,
          y: springY3,
        }}
      />

      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    </div>
  );
}
