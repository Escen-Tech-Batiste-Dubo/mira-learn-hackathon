import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("border-b border-[var(--border)] bg-[var(--background)]", className)} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...rest}>{children}</tbody>;
}

export function TableFooter({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot className={cn("border-t border-[var(--border)] bg-[var(--background)] font-medium", className)} {...rest}>
      {children}
    </tfoot>
  );
}

export function TableRow({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border)] transition-colors hover:bg-[var(--background)]",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-[var(--muted-foreground)]",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("p-4 align-middle", className)} {...rest}>
      {children}
    </td>
  );
}

