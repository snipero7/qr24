"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<Variant, string> = {
      default: "bg-blue-600 text-white hover:bg-blue-700 border border-transparent",
      outline: "border bg-white hover:bg-gray-50",
      secondary: "bg-gray-100 hover:bg-gray-200",
      ghost: "hover:bg-gray-100",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizes: Record<Size, string> = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";

