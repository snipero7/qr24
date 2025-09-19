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
    const base = "inline-flex items-center justify-center rounded-xl font-medium disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors";
    const variants: Record<Variant, string> = {
      default: "bg-[color:rgb(37_99_235)] text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:rgb(59_130_246_/_0.45)]",
      outline: "border border-[color:rgb(59_130_246_/_0.35)] bg-transparent text-[color:rgb(100_116_139)] hover:bg-[color:rgb(59_130_246_/_0.08)] hover:border-[color:rgb(59_130_246_/_0.45)]",
      secondary: "border border-[color:rgb(148_163_184_/_0.35)] bg-transparent text-[color:rgb(100_116_139)] hover:bg-[color:rgb(148_163_184_/_0.16)]",
      ghost: "border border-transparent bg-transparent text-[color:rgb(100_116_139)] hover:bg-[color:rgb(148_163_184_/_0.12)]",
      destructive: "bg-red-600 text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500/50",
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
