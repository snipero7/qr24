"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500", className)} {...props} />
));
Input.displayName = "Input";

