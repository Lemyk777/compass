"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

export function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("w-full", className)}
    >
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </motion.section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border border-line/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
