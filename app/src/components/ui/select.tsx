"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

