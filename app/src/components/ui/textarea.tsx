"use client";
import { cn, toLatinDigits } from "@/lib/utils";
import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  latinizeDigits?: boolean;
}

function ensureLatinDigits(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number") {
    return toLatinDigits(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" || typeof item === "number" ? toLatinDigits(item) : item));
  }
  return value;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, latinizeDigits = true, onChange, onInput, value, defaultValue, ...props }, ref) => {
    const normalizeEvent = React.useCallback(
      (element: HTMLTextAreaElement) => {
        if (!latinizeDigits) return element.value;
        const current = element.value;
        const normalized = toLatinDigits(current);
        if (normalized !== current) {
          const { selectionStart, selectionEnd } = element;
          element.value = normalized;
          if (selectionStart !== null && selectionEnd !== null) {
            try {
              element.setSelectionRange(selectionStart, selectionEnd);
            } catch {}
          }
        }
        return normalized;
      },
      [latinizeDigits]
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const normalized = normalizeEvent(event.currentTarget);
        if (latinizeDigits) {
          event.target.value = normalized;
        }
        onChange?.(event);
      },
      [latinizeDigits, normalizeEvent, onChange]
    );

    const handleInput = React.useCallback(
      (event: React.FormEvent<HTMLTextAreaElement>) => {
        const normalized = normalizeEvent(event.currentTarget);
        if (latinizeDigits && event.currentTarget.value !== normalized) {
          event.currentTarget.value = normalized;
        }
        onInput?.(event);
      },
      [latinizeDigits, normalizeEvent, onInput]
    );

    const normalizedValue = latinizeDigits ? ensureLatinDigits(value) : value;
    const normalizedDefaultValue = latinizeDigits ? ensureLatinDigits(defaultValue) : defaultValue;

    const textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
      className: cn(
        "w-full rounded-md p-2 bg-[var(--surface)] shadow-sm outline-none focus:ring-2 focus:ring-[color:rgb(29_78_216_/_0.35)]",
        className
      ),
      onChange: handleChange,
      onInput: handleInput,
      ...props,
    };

    if (value !== undefined) {
      textareaProps.value = normalizedValue as any;
    }
    if (defaultValue !== undefined) {
      textareaProps.defaultValue = normalizedDefaultValue as any;
    }

    return <textarea ref={ref} {...textareaProps} />;
  }
);
Textarea.displayName = "Textarea";
