"use client";
import * as React from "react";
import { cn } from "../utils/cn";

export interface UILabelProps extends React.ComponentProps<"label"> {}

const UILabel = React.forwardRef<HTMLLabelElement, UILabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    );
  }
);

UILabel.displayName = "UILabel";

export { UILabel };
export const Label = UILabel;

