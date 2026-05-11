"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type MiraAuthMetadata = {
  role?: unknown;
};

function readRole(...metadataItems: Array<unknown>): string | null {
  for (const item of metadataItems) {
    if (item && typeof item === "object") {
      const metadata = item as MiraAuthMetadata;
      if (typeof metadata.role === "string") {
        return metadata.role;
      }
    }
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const role = readRole(data.user?.user_metadata, data.user?.app_metadata);
    if (role !== "mentor") {
      await supabase.auth.signOut();
      setError("Ce compte n'est pas un compte Mira Mentor.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/classes");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-8 text-[var(--foreground)]">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">Backoffice mentor</p>
            <h1 className="mt-1 text-2xl font-bold">Se connecter</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Utilise ton compte Mira Mentor pour retrouver tes Mira Classes.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--color-destructive)]">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <p className="text-xs text-[var(--muted-foreground)]">
            Compte demo :{" "}
            <code className="rounded bg-[var(--background)] px-1 py-0.5">
              antoine.martin@hackathon.test
            </code>
          </p>
        </Card>
      </form>
    </main>
  );
}
