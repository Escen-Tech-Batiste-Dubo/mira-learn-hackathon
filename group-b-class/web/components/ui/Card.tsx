import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Card vanilla.
 *
 * MIGRATION HINT (post-hackathon) :
 *   Remplacer par `import { Card } from "@hlmr-travel/ui-public"` qui apporte les
 *   variantes Mira (warm, default, glass) + animations Framer Motion.
 */
export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--color-card)] p-6 shadow-none",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
