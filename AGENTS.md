# CLAUDE.md — Hackathon Mira Learn

Contexte pour Claude Code, Cursor, Copilot et tous les LLM coding agents qui assistent les étudiants sur ce repo.

> Ce fichier est **auto-chargé** au démarrage. Il pose les règles globales partagées par les 4 groupes. Chaque dossier `group-X-*/` contient son propre `CLAUDE.md` avec les spécificités.

## Mission du repo

Construire **Mira Learn**, la plateforme edtech d'Hello Mira pour digital nomads francophones, en 3 jours, à 22 étudiants répartis en 4 équipes :
- **A — Mentors** : recrutement + onboarding mentor + backoffice modération (web)
- **B — Class** : backoffice mentor pour gérer ses classes (web)
- **C — Learn** : front public apprenant + parcours d'apprentissage IA (web)
- **D — Mobile** : app compagne Flutter (modules, notes IA, QCM, communauté)

Tonalité produit : chaleureuse, éditoriale, premium mais accessible. **Pas corporate, pas gamifié naïf.** Mira est un compagnon de voyage exigeant.

## Stack technique

| Côté | Stack |
|---|---|
| Backend (toutes équipes) | FastAPI 0.115 · SQLAlchemy 2.0 async + asyncpg · Alembic · Pydantic v2 |
| Frontend (A, B, C) | Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Supabase JS |
| Mobile (D) | Flutter 3.41 · Riverpod 2 · go_router 14 · Supabase Flutter · Dio |
| Auth | Supabase (JWT RS256 validé via JWKS) — Auth isolée **par branche** |
| DB | **Postgres 16 local via Docker** (1 conteneur isolé par groupe) |
| LLM | OpenRouter — modèle par défaut `anthropic/claude-3.5-haiku` |

## Les 7 règles non-négociables

Lire en détail : [`RULES.md`](./RULES.md). En résumé :

1. **Le design system est intouchable** — tokens Mira uniquement (cf. `design-system.md`)
2. **JSend partout côté API** — `{ status, data, message }` sans exception
3. **Les contracts sont figés** — schémas livrés = source de vérité ; pour évoluer = migration `0003+`
4. **Rien en dur** — URLs, clés, ports : `.env` uniquement
5. **Type strict, zéro `any`** — TS `strict`, Pydantic au boundary, Dart `strict-casts`
6. **Commits atomiques** — `type(scope): message` ; 1 commit = 1 changement
7. **Reste dans ton groupe** — pas de modif cross-groupe sans le mentor HLMR

## Source de vérité

Quand un humain ou un agent veut savoir "quelle est la bonne version de X", l'ordre de priorité est :

1. Les **contracts** (`contracts/group-X-*/*.md` + `contracts/shared/`) = vérité sur les **schémas SQL et Pydantic**
2. Le **BRIEF.md** du groupe = vérité sur le **scope fonctionnel**
3. Le **design/template/** du groupe = vérité sur le **rendu visuel attendu** (handoff Claude Design)
4. Les **migrations Alembic 0001 + 0002** (déjà appliquées) = état initial de la DB
5. Le **design-system.md** = vérité sur les tokens visuels partagés

Si tu vois une contradiction entre ces sources, **demande au mentor HLMR** avant de coder.

## Comment poser une question à un agent

✅ **Bonne question** (contexte + référence + intention) :
> Crée un endpoint `POST /v1/mentor-applications` qui crée une `mentor_application` en `draft`, en suivant le contract dans `contracts/group-a-mentor/mentor_application.md` et le pattern de `app/api/examples.py`. Auth requise via `require_role("nomad")`.

❌ **Mauvaise question** (trop vague) :
> Fais-moi le backend du groupe A.

Plus tu donnes de contexte (fichier source, contract concerné, pattern à reproduire), meilleure est la réponse.

## Migration post-hackathon

À J3 18h, ton code sera relu par un encadrant Hello Mira pour intégration dans le monorepo backbone Hello Mira. Pour faciliter ça :

- Garder les noms / chemins suggérés par le template
- Ne pas dévier du JSend / des conventions
- Documenter les choix non-évidents en commentaire (`# WHY : ...` plutôt que `# WHAT : ...`)
- Référence : [`template/MIGRATION_GUIDE.md`](./template/MIGRATION_GUIDE.md) — décrit le mapping vers `ms_common_api`, `BaseMicroservice`, etc.

## Ne fais PAS

- Ne supprime ni ne modifie les migrations Alembic `0001_*` et `0002_*` livrées
- Ne change pas les couleurs/fonts (`design-system.md` est figé)
- Ne commit pas `.env` (déjà dans `.gitignore`)
- Ne push pas sans relecture par un coéquipier (créer une PR)
- Ne crée pas une 2e copie d'un atom (Avatar, Chip, Btn) — réutilise celui du template
- Ne fais pas de cross-groupe sans le mentor

## Quand demander un humain

- Tu veux modifier un **contract** SQL ou Pydantic → mentor HLMR avant
- Tu veux toucher au **code d'un autre groupe** → mentor
- Tu hésites entre 2 approches archi → mentor
- Tu es bloqué > 1h sur le même problème → mentor
- Tu veux mettre à jour `RULES.md`, `design-system.md`, `CLAUDE.md` → mentor obligatoire

## Mentors HLMR référents

| Groupe | Mentor | Slack |
|---|---|---|
| A | mentor HLMR | `#hackathon-mira-learn-a` |
| B | mentor HLMR | `#hackathon-mira-learn-b` |
| C | mentor HLMR | `#hackathon-mira-learn-c` |
| D | mentor HLMR | `#hackathon-mira-learn-d` |
