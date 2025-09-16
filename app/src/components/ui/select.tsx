"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-md p-2 bg-[var(--surface)] shadow-sm outline-none focus:ring-2 focus:ring-[color:rgb(29_78_216_/_0.35)]",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
