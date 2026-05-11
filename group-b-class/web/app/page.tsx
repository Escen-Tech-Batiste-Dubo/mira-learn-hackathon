import Link from "next/link";

/**
 * Page d'accueil — Server Component.
 *
 * Hello world du template. À remplacer par la vraie landing page du groupe :
 *   - Group A : présentation Mira Mentor + CTA candidature + annuaire mentors
 *   - Group B : page de connexion mentor + redirect dashboard si auth
 *   - Group C : catalogue Mira Class + filtres + hero
 *
 * MIGRATION HINT (post-hackathon) :
 *   En prod Hello Mira, le path est `/[locale]/` avec next-intl (FR par défaut,
 *   plus EN/ES). Voir book-web pattern.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenue sur le template Hackathon Mira Learn
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Frontend Next.js prêt à être customisé pour ton groupe.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-[var(--primary)] px-6 py-3 text-white hover:opacity-90"
          >
            Se connecter
          </Link>
          <Link
            href="/me"
            className="rounded-md border border-gray-300 px-6 py-3 hover:bg-gray-50"
          >
            Mon profil (auth)
          </Link>
        </div>

        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 text-left text-sm">
          <h2 className="font-semibold">Prochaines étapes</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
            <li>
              Renseigner <code>.env.local</code> (Supabase + URL backend)
            </li>
            <li>
              Lancer le backend FastAPI sur <code>:8000</code>
            </li>
            <li>
              Construire les pages selon les contrats{" "}
              <code>hackathon/contracts/group-X-xxx/</code>
            </li>
            <li>
              Consulter le <code>README.md</code> pour les conventions et la
              structure
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
