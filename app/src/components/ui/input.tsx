"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-md p-2 bg-[var(--surface)] shadow-sm outline-none focus:ring-2 focus:ring-[color:rgb(29_78_216_/_0.35)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
