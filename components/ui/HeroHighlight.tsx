"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full group",
        containerClassName
      )}
    >
      <div className="absolute inset-0 bg-dot-thick-neutral-300 dark:bg-dot-thick-neutral-800 pointer-events-none" />
      <motion.div
        className="pointer-events-none bg-dot-thick-indigo-500 dark:bg-dot-thick-indigo-500 absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          WebkitMaskImage: `radial-gradient(
            200px circle at var(--x, 50%) var(--y, 50%),
            black 0%,
            transparent 100%
          )`,
          maskImage: `radial-gradient(
            200px circle at var(--x, 50%) var(--y, 50%),
            black 0%,
            transparent 100%
          )`,
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};
