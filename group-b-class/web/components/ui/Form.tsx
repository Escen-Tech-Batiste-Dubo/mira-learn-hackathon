import { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Form({ children, ...rest }: { children: ReactNode } & HTMLAttributes<HTMLFormElement>) {
  return <form {...rest}>{children}</form>;
}

export function FormField({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function FormItem({ className, children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...rest}>
      {children}
    </div>
  );
}

export function FormLabel({ className, children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...rest}>
      {children}
    </label>
  );
}

export function FormControl({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function FormDescription({ className, children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[var(--muted-foreground)]", className)} {...rest}>
      {children}
    </p>
  );
}

export function FormMessage({ className, children, ...rest }: { className?: string; children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm font-medium text-red-500", className)} {...rest}>
      {children}
    </p>
  );
}

