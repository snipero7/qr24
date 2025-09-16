"use client";

import { forwardRef, useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { Input, InputProps } from "@/components/ui/input";
import { normalizeNumberInput } from "@/lib/utils";

function createSyntheticEvent(
  event: ChangeEvent<HTMLInputElement>,
  nextValue: string
): ChangeEvent<HTMLInputElement> {
  // Clone the event to avoid mutating the original SyntheticEvent
  const cloned = {
    ...event,
    target: { ...event.target, value: nextValue },
    currentTarget: { ...event.currentTarget, value: nextValue },
  } as ChangeEvent<HTMLInputElement>;
  return cloned;
}

export const PhoneInput = forwardRef<HTMLInputElement, InputProps>(
  ({ value, defaultValue, onChange, inputMode, className, ...props }, ref) => {
    const isControlled = value !== undefined;
    const initial = (value ?? defaultValue ?? "") as string;
    const [innerValue, setInnerValue] = useState(() => normalizeNumberInput(initial));

    useEffect(() => {
      if (isControlled) {
        setInnerValue(normalizeNumberInput(String(value ?? "")));
      }
    }, [isControlled, value]);

    useEffect(() => {
      if (!isControlled) {
        setInnerValue(normalizeNumberInput(String(defaultValue ?? "")));
      }
    }, [isControlled, defaultValue]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const normalized = normalizeNumberInput(event.target.value);
      setInnerValue(normalized);
      onChange?.(createSyntheticEvent(event, normalized));
    }

    return (
      <Input
        ref={ref}
        inputMode={inputMode ?? "tel"}
        className={className}
        value={innerValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
