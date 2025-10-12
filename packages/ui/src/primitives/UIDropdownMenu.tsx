"use client";
import * as React from "react";

// Stub implementation - replace with full Radix UI implementation when needed
export const DropdownMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface DropdownMenuTriggerProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { ref, ...props });
    }
    return <button ref={ref} {...props}>{children}</button>;
  }
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

