"use client";
import * as React from "react";

// Stub implementation - replace with full Radix UI implementation when needed
export const DropdownMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  (props, ref) => <button ref={ref} {...props} />
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = ({ children, ...props }: any) => (
  <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50" {...props}>
    {children}
  </div>
);

export const DropdownMenuItem = ({ children, ...props }: any) => (
  <div className="px-3 py-2 hover:bg-accent cursor-pointer" {...props}>
    {children}
  </div>
);

export const DropdownMenuLabel = ({ children, ...props }: any) => (
  <div className="px-3 py-2 font-semibold text-sm" {...props}>
    {children}
  </div>
);

export const DropdownMenuSeparator = () => (
  <div className="h-px bg-border my-1" />
);

