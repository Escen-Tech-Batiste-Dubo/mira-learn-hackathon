import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  outline: "border border-[var(--border)] bg-[var(--color-card)] text-[var(--foreground)]",
  destructive: "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]",
};

export function Badge({ variant = "default", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

