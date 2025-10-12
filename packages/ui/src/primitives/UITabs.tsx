"use client";
import * as React from "react";
import { cn } from "../utils/cn";

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: "", onValueChange: () => {} });

export interface UITabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

const UITabs = ({ value, onValueChange, defaultValue, children, className }: UITabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value ?? internalValue;
  const handleChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const UITabsList = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1",
        className
      )}
      {...props}
    />
  )
);
UITabsList.displayName = "UITabsList";

const UITabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
    const isActive = value === selectedValue;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive && "bg-background text-foreground shadow",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      />
    );
  }
);
UITabsTrigger.displayName = "UITabsTrigger";

const UITabsContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { value: string }>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(TabsContext);
    if (value !== selectedValue) return null;

    return (
      <div
        ref={ref}
        className={cn("mt-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
UITabsContent.displayName = "UITabsContent";

export { UITabs, UITabsList, UITabsTrigger, UITabsContent };
export const Tabs = UITabs;
export const TabsList = UITabsList;
export const TabsTrigger = UITabsTrigger;
export const TabsContent = UITabsContent;

