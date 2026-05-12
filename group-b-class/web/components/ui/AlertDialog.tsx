import { ReactNode, useState } from "react";
import { Button } from "./Button";
import { Card, CardContent, CardDescription } from "./Card";

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

let alertDialogContext: AlertDialogContextType | null = null;

export function AlertDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  alertDialogContext = { open, setOpen };
  return <>{children}</>;
}

export function AlertDialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return (
    <div
      onClick={() => {
        if (alertDialogContext) alertDialogContext.setOpen(true);
      }}
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  if (!alertDialogContext?.open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-md w-full">
        {children}
      </Card>
    </div>
  );
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--muted-foreground)] mt-2">{children}</p>;
}

export function AlertDialogCancel({ children }: { children: ReactNode }) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        if (alertDialogContext) alertDialogContext.setOpen(false);
      }}
    >
      {children}
    </Button>
  );
}

export function AlertDialogAction({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Button
      disabled={disabled}
      onClick={() => {
        onClick?.();
        if (alertDialogContext) alertDialogContext.setOpen(false);
      }}
    >
      {children}
    </Button>
  );
}

