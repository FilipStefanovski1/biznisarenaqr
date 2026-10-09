"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatCount } from "@/lib/results";

/** Counts smoothly from the previous value to the new one (instant with reduced motion). */
export function AnimatedNumber({
  value,
  format = formatCount,
  duration = 0.6,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // The value currently on screen, so an interrupted animation continues from there.
  const shownRef = useRef(value);
  const reduce = useReducedMotion();
  // Formatters are often inline lambdas; keep the latest without restarting the tween.
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = shownRef.current;
    if (reduce || from === value) {
      shownRef.current = value;
      node.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        shownRef.current = latest;
        node.textContent = formatRef.current(latest);
      },
      onComplete: () => {
        shownRef.current = value;
      },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return (
    <span ref={ref} className={className} data-value={value}>
      {format(value)}
    </span>
  );
}
