"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  label?: string;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    { className, orientation = "horizontal", decorative = true, label, ...props },
    ref
  ) => {
    if (label) {
      return (
        <div
          className={cn(
            "flex items-center",
            orientation === "horizontal" ? "w-full" : "h-full flex-col",
            className
          )}
        >
          <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn(
              "shrink-0 bg-gray-700",
              orientation === "horizontal"
                ? "h-[1px] flex-1"
                : "w-[1px] flex-1"
            )}
            {...props}
          />
          <span
            className={cn(
              "text-xs text-gray-400 px-2",
              orientation === "vertical" && "py-2"
            )}
          >
            {label}
          </span>
          <SeparatorPrimitive.Root
            decorative={decorative}
            orientation={orientation}
            className={cn(
              "shrink-0 bg-gray-700",
              orientation === "horizontal"
                ? "h-[1px] flex-1"
                : "w-[1px] flex-1"
            )}
          />
        </div>
      );
    }

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-gray-700",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
