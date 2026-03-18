"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  initialOpacity?: number;
  scale?: number;
  threshold?: number; // kept for API compat but handled by useInView internally
  delay?: number;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 60,
  direction = "vertical",
  reverse = false,
  duration = 0.7,
  initialOpacity = 0,
  scale = 1,
  threshold: _threshold = 0.1,
  delay = 0,
  className = "",
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "100px 0px" });

  const axis = direction === "horizontal" ? "x" : "y";
  const offset = reverse ? -distance : distance;

  const initial = {
    opacity: initialOpacity,
    scale,
    [axis]: offset,
  };

  const animate = isInView
    ? { opacity: 1, scale: 1, x: 0, y: 0 }
    : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;
