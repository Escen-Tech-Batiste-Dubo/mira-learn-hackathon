# Frontend Next.js — Template hackathon

Frontend Next.js 16 + React 19 + TypeScript + Tailwind 4, inspiré de `book-web` mais allégé pour le hackathon (pas de SDK officiel ni de design system Mira).

> Voir `../README.md` pour le contexte général et `../MIGRATION_GUIDE.md` pour les transformations cibles vers le backbone Hello Mira.

## Setup

```bash
# 1. Copier la config d'env
cp .env.example .env.local

# 2. Renseigner :
#    - NEXT_PUBLIC_API_URL (URL du backend FastAPI du groupe, par défaut http://localhost:8000)
#    - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (fournis par Lorenzo)

# 3. Installer les dépendances
make install

# 4. Démarrer en mode dev
make dev
```

Front sur `http://localhost:3000`.

## Commandes

| Commande | Description |
|---|---|
| `make install` | `npm install` |
| `make dev` | Next.js dev server avec hot reload (port 3000) |
| `make build` | Build production |
| `make start` | Démarre le build de prod |
| `make lint` | Typecheck TypeScript (`tsc --noEmit`) |

## Structure

```
frontend/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # root layout (HTML + body)
│   ├── page.tsx                        # /  (home publique)
│   ├── globals.css                     # Tailwind + CSS variables
│   ├── login/page.tsx                  # /login (email/password Supabase)
│   ├── callback/page.tsx               # /callback (OAuth redirect)
│   ├── (authenticated)/                # group routes derrière auth
│   │   ├── layout.tsx                  # AuthGuard + header
│   │   └── me/page.tsx                 # /me (exemple page authentifiée)
│   └── api/
│       └── health/route.ts             # GET /api/health
├── components/
│   ├── ui/                             # composants base vanilla
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── auth/                           # à compléter par le groupe
├── lib/
│   ├── supabase.ts                     # client Supabase + getAccessToken()
│   ├── api-client.ts                   # fetch wrapper (JWT auto, JSend)
│   └── utils.ts                        # cn() helper Tailwind
├── hooks/
│   └── useAuth.ts                      # hook React Supabase
├── types/
│   └── index.ts                        # types partagés (à enrichir)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs                  # Tailwind v4
├── .env.example
├── .gitignore
└── Makefile
```

## Patterns alignés sur `fronts/book-web` (= cible post-hackathon)

| Aspect | Template hackathon | Cible Hello Mira (post-migration) |
|---|---|---|
| Routes | App Router, paths simples (`/login`, `/me`) | App Router avec `[locale]` + `next-intl` middleware (FR/EN/ES) |
| Auth | Supabase localStorage (`@supabase/supabase-js`) | Idem + cookie cross-subdomain `hlmr_jwt` |
| API | `lib/api-client.ts` custom fetch + JSend | `@hlmr-travel/sdk-js` (HlmrClient typé) |
| UI | Composants vanilla (`components/ui/Button.tsx`) | `@hlmr-travel/ui-public` (Button, Card, etc. tunés design Mira) |
| i18n | FR uniquement (hardcodé) | `next-intl` + `@hlmr-travel/booking-i18n` |
| State | React hooks (`useAuth`) | Idem + SDK Provider context |
| Forms | HTML natifs | Idem + Radix UI + react-day-picker selon besoin |
| Animations | Aucune | Framer Motion (cf. book-web) |
| Build | `next build` | `output: "standalone"` pour Docker K8s |

## Conventions de routing

### Routes publiques

Tout ce qui est accessible sans auth (landing, catalogue, fiche mentor publique) :
```
app/page.tsx                  → /
app/some-public-route/page.tsx → /some-public-route
```

### Routes authentifiées

Sous le **route group** `(authenticated)` (parenthèses = pas dans l'URL, juste regroupement) :
```
app/(authenticated)/me/page.tsx        → /me  (auth requise)
app/(authenticated)/dashboard/page.tsx → /dashboard  (auth requise)
```

Le `app/(authenticated)/layout.tsx` force l'auth (redirige vers `/login` si pas de session).

### Routes admin (pour Group A — admin valide candidatures)

À ajouter sous `(authenticated)` avec check de role supplémentaire :
```typescript
// app/(authenticated)/admin/layout.tsx
"use client";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const role = user?.user_metadata?.role;

  if (loading) return <p>Chargement...</p>;
  if (role !== "admin") return <p>Accès refusé</p>;

  return <>{children}</>;
}
```

## Ajouter une nouvelle page (workflow)

### 1. Page Server Component (sans interactivité)

```tsx
// app/(authenticated)/mentors/page.tsx
import { apiClient } from "@/lib/api-client";

export default async function MentorsPage() {
  // ⚠️ Server Component : pas de useAuth ici, l'auth est garantie par le layout parent.
  // Pour appeler le backend en SSR, on appelle l'API direct (pas via apiClient qui est client).
  return <h1>Liste des mentors</h1>;
}
```

### 2. Page Client Component (avec interactivité)

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export default function MyClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    apiClient.get("/v1/classes/me").then(setClasses);
  }, []);

  return (
    <ul>
      {classes.map((c) => <li key={c.id}>{c.title}</li>)}
    </ul>
  );
}
```

### 3. Composant réutilisable

```tsx
// components/MentorCard.tsx
import { Card } from "@/components/ui/Card";

interface MentorCardProps {
  name: string;
  bio: string;
}

export function MentorCard({ name, bio }: MentorCardProps) {
  return (
    <Card>
      <h3 className="font-semibold">{name}</h3>
      <p className="mt-2 text-sm text-gray-600">{bio}</p>
    </Card>
  );
}
```

## Conventions non-négociables

(Voir `hackathon/contracts/README.md` pour les détails)

1. **TypeScript strict** — pas d'`any` (sauf dans `lib/types/external.d.ts` si vraiment nécessaire)
2. **`apiClient` pour tous les appels backend** — jamais de `fetch` direct (sauf appels publics tiers : OpenStreetMap, etc.)
3. **Composants UI réutilisables** — extraire dans `components/` dès que c'est utilisé 2+ fois
4. **Server Components par défaut** — `"use client"` uniquement si interactivité requise
5. **`cn()` helper** pour merger les classes Tailwind
6. **Pas d'URLs hardcodées** — toujours via `process.env.NEXT_PUBLIC_*`

## Anti-patterns interdits

- ❌ `fetch(...)` direct vers le backend — utiliser `apiClient`
- ❌ `<a href="...">` interne — utiliser `<Link>` de `next/link`
- ❌ `localStorage` direct pour le JWT — utiliser `supabase.auth.getSession()`
- ❌ State global non-Supabase (Redux/Zustand) pendant le hackathon (pas nécessaire pour le scope)
- ❌ Composant > 250 lignes — splitter en sous-composants
- ❌ `any` TypeScript

## Pour la migration post-hackathon

Tous les fichiers critiques contiennent des `MIGRATION HINT` :

| Fichier | Devient |
|---|---|
| `lib/api-client.ts` | `@hlmr-travel/sdk-js` (HlmrClient) |
| `components/ui/*` | `@hlmr-travel/ui-public` |
| `lib/supabase.ts` | Idem + cookie cross-subdomain `hlmr_jwt` |
| `hooks/useAuth.ts` | `useHlmrClient()` + context provider |
| `app/layout.tsx` | + `NextIntlClientProvider`, SDK provider, polices custom |
| `app/login/page.tsx` | Redirige vers `idp-front` (login centralisé) |
| `app/page.tsx` | Sous `app/[locale]/page.tsx` avec next-intl |
| `next.config.ts` | + `output: "standalone"`, `withNextIntl(...)` |
| `package.json` | Ajout des deps Hello Mira |

**Plus de détails dans `../MIGRATION_GUIDE.md`.**
