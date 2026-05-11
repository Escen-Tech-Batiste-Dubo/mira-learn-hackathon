import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Bouton vanilla Tailwind.
 *
 * MIGRATION HINT (post-hackathon) :
 *   Remplacer par `import { Button } from "@hlmr-travel/ui-public"` qui apporte :
 *     - Variants tunés design Mira (primary, secondary, ghost, destructive)
 *     - Tailles standardisées (sm, md, lg)
 *     - Loading state intégré avec spinner
 *     - icon prop (Solar icons)
 *     - Animation hover/active Framer Motion
 *
 *   Ce fichier (`components/ui/Button.tsx`) sera supprimé post-migration.
 */
type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
  outline: "border border-[var(--border)] bg-[var(--color-card)] hover:bg-[var(--color-background)]",
  ghost: "hover:bg-[var(--color-background)]",
  destructive: "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
