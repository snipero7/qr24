"use client";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500", className)} {...props} />
));
Textarea.displayName = "Textarea";

