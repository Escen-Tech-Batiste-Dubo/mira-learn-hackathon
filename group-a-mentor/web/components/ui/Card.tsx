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
        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
