"use client";
import { cn, toLatinDigits } from "@/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, onChange, onInput, value, defaultValue, latinizeDigits = true, ...props }, forwardedRef) => {
    const handleNormalization = React.useCallback(
      (event: { currentTarget: HTMLInputElement }) => {
        if (!latinizeDigits) return event.currentTarget.value;
        const current = event.currentTarget.value;
        const normalized = toLatinDigits(current);
        if (normalized !== current) {
          const { selectionStart, selectionEnd } = event.currentTarget;
          event.currentTarget.value = normalized;
          if (selectionStart !== null && selectionEnd !== null) {
            try {
              event.currentTarget.setSelectionRange(selectionStart, selectionEnd);
            } catch {}
          }
        }
        return normalized;
      },
      [latinizeDigits]
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = handleNormalization(event);
        if (latinizeDigits) {
          event.target.value = normalized;
        }
        onChange?.(event);
      },
      [handleNormalization, latinizeDigits, onChange]
    );

    const handleInput = React.useCallback(
      (event: React.FormEvent<HTMLInputElement>) => {
        const normalized = handleNormalization({ currentTarget: event.currentTarget });
        if (latinizeDigits && event.currentTarget.value !== normalized) {
          event.currentTarget.value = normalized;
        }
        onInput?.(event);
      },
      [handleNormalization, latinizeDigits, onInput]
    );

    const normalizedValue = latinizeDigits ? ensureLatinDigits(value) : value;
    const normalizedDefaultValue = latinizeDigits ? ensureLatinDigits(defaultValue) : defaultValue;

    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      className: cn(
        "w-full rounded-md p-2 bg-[var(--surface)] shadow-sm outline-none focus:ring-2 focus:ring-[color:rgb(29_78_216_/_0.35)]",
        className
      ),
      onChange: handleChange,
      onInput: handleInput,
      ...props,
    };

    if (value !== undefined) {
      inputProps.value = normalizedValue as any;
    }
    if (defaultValue !== undefined) {
      inputProps.defaultValue = normalizedDefaultValue as any;
    }

    return <input ref={forwardedRef} {...inputProps} />;
  }
);
Input.displayName = "Input";
