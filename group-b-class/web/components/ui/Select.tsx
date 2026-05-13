import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-2 text-base",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function SelectTrigger({ className, children, ...props }: any) {
  return (
    <div className={cn("flex h-11 w-full items-center rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3", className)} {...props}>
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-[var(--muted-foreground)]">{placeholder || "Sélectionner..."}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return children;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

