"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
} from "react";

import { Button } from "./Button";
import { Card } from "./Card";

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext =
  createContext<AlertDialogContextType | null>(null);

function useAlertDialog() {
  const context = useContext(AlertDialogContext);

  if (!context) {
    throw new Error(
      "AlertDialog components must be used inside AlertDialog"
    );
  }

  return context;
}

export function AlertDialog({children}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialogContext.Provider
      value={{ open, setOpen }}
    >
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({children}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useAlertDialog();

  return (
    <div
      onClick={() => setOpen(true)}
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({children}: {
  children: ReactNode;
}) {
  const { open } = useAlertDialog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        {children}
      </Card>
    </div>
  );
}

export function AlertDialogTitle({children}: {
  children: ReactNode;
}) {
  return (
    <h2 className="text-lg font-semibold">
      {children}
    </h2>
  );
}

export function AlertDialogDescription({children}: {
  children: ReactNode;
}) {
  return (
    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
      {children}
    </p>
  );
}

export function AlertDialogCancel({children}: {
  children: ReactNode;
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button
      variant="outline"
      onClick={() => setOpen(false)}
    >
      {children}
    </Button>
  );
}

export function AlertDialogAction({children, onClick, disabled, className = ""}: {
  children: ReactNode;
  onClick?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}) {
  const { setOpen } = useAlertDialog();

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={async () => {
        await onClick?.();
        setOpen(false);
      }}
    >
      {children}
    </Button>
  );
}