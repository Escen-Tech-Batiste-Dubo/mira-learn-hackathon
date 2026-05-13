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

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 border-b border-[var(--border)] pb-4 -m-6 mb-6 px-6 pt-6", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-6 border-t border-[var(--border)] -m-6 mt-6 px-6 pb-6", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...rest}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--muted-foreground)]", className)}
      {...rest}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("pt-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
