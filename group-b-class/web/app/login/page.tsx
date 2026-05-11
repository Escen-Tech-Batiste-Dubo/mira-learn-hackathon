"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
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

    const role = readRole(data.user?.app_metadata, data.user?.user_metadata);
    if (role !== "mentor") {
      await supabase.auth.signOut();
      setError("Ce compte n'est pas un compte Mira Mentor.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/classes");
  }

  return (
    <main className="flex min-h-screen w-full bg-white">
      {/* PANNEAU GAUCHE : Formulaire Épuré */}
      <div className="flex w-full shrink-0 flex-col items-center justify-center p-8 lg:w-[400px] xl:w-[480px]">
        <div className="flex w-full max-w-[380px] flex-col">
          
          {/* Logo (Centré et rapproché du texte) */}
          <div className="mb-4 flex justify-center">
            <img 
              src="https://www.hello-mira.com/Logos/hmiraMeta.png" 
              alt="Hello Mira" 
              className="h-28 w-auto object-contain sm:h-32"
            />
          </div>

          {/* Textes (Centrés) */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Espace Mentor
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Connectez-vous pour façonner les parcours de nos apprenants.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Input E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--foreground)]">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="anna.lopez@mira.com"
                className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-base outline-none transition-all placeholder:text-gray-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-[var(--foreground)]">
                  Mot de passe
                </label>
                <a href="#" className="text-sm font-medium text-[var(--primary)] hover:underline">
                  Oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 pr-12 text-base tracking-widest outline-none transition-all placeholder:text-gray-400 placeholder:tracking-normal focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-[var(--primary)]"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-[var(--primary)] text-[15px] font-bold text-white transition-all hover:bg-opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

        </div>
      </div>

      {/* PANNEAU DROIT : Image Immersive */}
      <div className="relative hidden flex-1 lg:block">
        {/* L'image de fond */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center">
          {/* Overlay subtil */}
          <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* Contenu sur l'image */}
        <div className="absolute bottom-0 left-0 right-0 p-12 xl:p-20">
          <div className="max-w-xl">
            <h2 className="mb-4 font-serif text-3xl font-bold leading-tight text-white xl:text-4xl">
              "L'écosystème parfait pour transmettre votre savoir aux nomades du monde entier."
            </h2>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop" 
                  alt="Mentor"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Marie Dupont</p>
                <p className="text-xs text-white/80">Mira Mentor — UI Design</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
