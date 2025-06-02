"use client";
import {
  motion,
  useMotionValue,
  animate,
  AnimationPlaybackControlsWithThen,
  MotionValue,
} from "framer-motion";
import { useEffect, useState, useRef, RefObject } from "react";

export default function GlowBackground() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Cache motion values - these persist across renders
  const blob1X = useRef(useMotionValue(0));
  const blob1Y = useRef(useMotionValue(0));
  const blob2X = useRef(useMotionValue(0));
  const blob2Y = useRef(useMotionValue(0));
  const blob3X = useRef(useMotionValue(0));
  const blob3Y = useRef(useMotionValue(0));

  const animationsRef = useRef<AnimationPlaybackControlsWithThen[]>([]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Start animations only once when dimensions are set
  useEffect(() => {
    if (dimensions.width === 0) return;

    // Clear existing animations
    animationsRef.current.forEach((anim) => anim?.stop?.());
    animationsRef.current = [];

    const startFloatingAnimation = (
      xValue: RefObject<MotionValue<number>>,
      yValue: RefObject<MotionValue<number>>,
      radius: number,
      duration: number
    ) => {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const maxOffsetX = dimensions.width / 4;
      const maxOffsetY = dimensions.height / 4;
      const offsetX = Math.random() * maxOffsetX - maxOffsetX / 2;
      const offsetY = Math.random() * maxOffsetY - maxOffsetY / 2;

      const xAnimation = animate(
        xValue.current,
        [
          centerX + offsetX,
          centerX + radius + offsetX,
          centerX + offsetX,
          centerX - radius + offsetX,
          centerX + offsetX,
        ],
        {
          duration,
          ease: "easeOut",
          repeat: Infinity,
          repeatType: "loop",
        }
      );

      const yAnimation = animate(
        yValue.current,
        [
          centerY + offsetY,
          centerY + radius + offsetY,
          centerY + offsetY,
          centerY - radius + offsetY,
          centerY + offsetY,
        ],
        {
          duration,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        }
      );

      return [xAnimation, yAnimation];
    };

    // Start all animations
    animationsRef.current = [
      ...startFloatingAnimation(blob1X, blob1Y, 150, 15),
      ...startFloatingAnimation(blob2X, blob2Y, 200, 20),
      ...startFloatingAnimation(blob3X, blob3Y, 100, 25),
    ];

    return () => {
      animationsRef.current.forEach((anim) => anim?.stop?.());
    };
  }, [dimensions.width, dimensions.height]);

  if (dimensions.width === 0) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute blur-[100px] opacity-70 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 w-[500px] h-[500px] -translate-1/2"
        style={{
          x: blob1X.current,
          y: blob1Y.current,
        }}
      />
      <motion.div
        className="absolute blur-[120px] opacity-50 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 w-[600px] h-[600px] -translate-1/2"
        style={{
          x: blob2X.current,
          y: blob2Y.current,
        }}
      />
      <motion.div
        className="absolute blur-[150px] opacity-40 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 w-[400px] h-[400px] -translate-1/2"
        style={{
          x: blob3X.current,
          y: blob3Y.current,
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    </div>
  );
}
