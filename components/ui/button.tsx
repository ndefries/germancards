"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/25",
  secondary:
    "bg-surface-2 text-fg hover:bg-surface-3 border border-line",
  ghost: "text-fg hover:bg-surface-2",
  outline: "border border-line text-fg hover:bg-surface-2",
  danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/25",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/25",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
  lg: "h-14 px-7 text-base rounded-2xl",
  icon: "h-11 w-11 rounded-2xl",
};

/** Primary interactive button. Uses semantic colour tokens from globals.css. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
