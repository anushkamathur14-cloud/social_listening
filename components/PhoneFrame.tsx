"use client";

import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  label?: string;
}

/** iPhone-style bezel for Instagram / mobile ad previews */
export function PhoneFrame({ children, label = "Mobile preview" }: PhoneFrameProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">
        {label}
      </p>
      <div className="relative w-[220px] shrink-0">
        {/* Outer bezel */}
        <div className="rounded-[2rem] border-[3px] border-zinc-800 bg-zinc-900 p-1.5 shadow-xl">
          {/* Dynamic island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-zinc-900 rounded-full z-10" />
          {/* Screen */}
          <div className="rounded-[1.5rem] overflow-hidden bg-white aspect-[9/19.5] relative">
            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 h-8 bg-white/90 z-[5] flex items-end justify-center pb-0.5">
              <div className="w-12 h-1 rounded-full bg-zinc-300" />
            </div>
            <div className="h-full overflow-y-auto pt-8">{children}</div>
          </div>
          {/* Home indicator */}
          <div className="flex justify-center py-1">
            <div className="w-20 h-1 rounded-full bg-zinc-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
