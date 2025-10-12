"use client";
import * as React from "react";

// Stub implementation - replace with full Radix UI implementation when needed
export const Select = ({ children, ...props }: any) => <>{children}</>;
export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ children, ...props }, ref) => (
    <button
      ref={ref}
      className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
      {...props}
    >
      {children}
    </button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({ placeholder, ...props }: any) => (
  <span {...props}>{placeholder}</span>
);

export const SelectContent = ({ children, ...props }: any) => (
  <div className="absolute mt-1 w-full rounded-md shadow-lg bg-card border border-border z-50" {...props}>
    {children}
  </div>
);

export const SelectItem = ({ children, value, ...props }: any) => (
  <div className="px-3 py-2 hover:bg-accent cursor-pointer" data-value={value} {...props}>
    {children}
  </div>
);

