# Hackathon Mira Learn — Préparation

Dossier de préparation du hackathon (3 jours, 4 groupes, ~22 étudiants).

> **Référence stratégique** : `docs/mira-documentation/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`
> **Référence PRD** : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`

## Structure

```
hackathon/
├── README.md                              # ce fichier
├── contracts/                             # contrats d'interface (schémas entités)
│   ├── README.md                          # conventions naming + types + reprenabilité
│   ├── shared/                            # entité partagée (skill)
│   ├── group-a-mentor/                    # 10 entités possédées par Group A
│   ├── group-b-class/                     # 9 entités possédées par Group B
│   ├── group-c-learn/                     # 8 entités + seed-views Group C
│   └── group-d-mobile/                    # 5 entités + seed-views Group D
├── template/                              # template canonique à dupliquer par groupe
│   ├── README.md
│   ├── MIGRATION_GUIDE.md                 # mapping vers backbone Hello Mira
│   ├── backend/                           # FastAPI Python — ms-template-api like
│   └── frontend/                          # Next.js 16 + React 19 + Supabase
├── group-a-mentor/.env.example            # creds branche Supabase groupe-a + OpenRouter A
├── group-b-class/.env.example             # creds branche Supabase groupe-b + OpenRouter B
├── group-c-learn/.env.example             # creds branche Supabase groupe-c + OpenRouter C
└── group-d-mobile/.env.example            # creds branche Supabase groupe-d + OpenRouter D
```

## Infrastructure Supabase

**1 projet Supabase shared** (`hackathon` — workspace Hello Mira PRO) avec **4 preview branches** pour isolation par groupe :

| Branche | Project ref | URL | Usage |
|---|---|---|---|
| `main` | `REPLACE_WITH_SUPABASE_MAIN_REF` | https://REPLACE_WITH_SUPABASE_MAIN_URL.supabase.co | Admin only, comptes test seedés ici, jamais touché par les groupes |
| `groupe-a` | `REPLACE_WITH_SUPABASE_GROUPE_A_REF` | https://REPLACE_WITH_SUPABASE_GROUPE_A_URL.supabase.co | DB isolée pour Group A — candidature mentor + annuaire |
| `groupe-b` | `REPLACE_WITH_SUPABASE_GROUPE_B_REF` | https://REPLACE_WITH_SUPABASE_GROUPE_B_URL.supabase.co | DB isolée pour Group B — classes + modules + sessions + QCM |
| `groupe-c` | `REPLACE_WITH_SUPABASE_GROUPE_C_REF` | https://REPLACE_WITH_SUPABASE_GROUPE_C_URL.supabase.co | DB isolée pour Group C — catalogue + profil + parcours |
| `groupe-d` | `REPLACE_WITH_SUPABASE_GROUPE_D_REF` | https://REPLACE_WITH_SUPABASE_GROUPE_D_URL.supabase.co | DB isolée pour Group D — mobile : suivi + notes + community |

**Coût estimé** : 4 branches × $0.32/jour × 4 jours = **~$5 sur le hackathon**.

**Auth Supabase** : les users (5 mentors test + 10 nomads + admins) sont créés sur la branche `main`, et **partagés automatiquement** entre toutes les branches (les preview branches héritent du même Auth pool).

**API keys par branche** : chaque branche a sa propre publishable key (déjà injectée dans le `.env.example` de chaque groupe). Voir tableau dans chaque `.env.example`.

## OpenRouter

**Clé dédiée par groupe** avec **budget cap $5** chacun :
- Group A : `sk-or-v1-REPLACE_WITH_GROUP_A_OPENROUTER_KEY...894`
- Group B : `sk-or-v1-REPLACE_WITH_GROUP_B_OPENROUTER_KEY...e1b`
- Group C : `sk-or-v1-REPLACE_WITH_GROUP_C_OPENROUTER_KEY...4ff`
- Group D : `sk-or-v1-REPLACE_WITH_GROUP_D_OPENROUTER_KEY...be6`

Modèle par défaut : `anthropic/claude-3.5-haiku` (rapport coût/qualité optimal pour hackathon).

## Statut préparation

| Étape | Owner | Statut |
|---|---|---|
| Contrats d'interface (entités) | Cédric + Claude | ✅ Fait (35 entités + 2 README) |
| Template FastAPI backend | Cédric + Claude | ✅ Fait (testé end-to-end) |
| Template Next.js frontend | Cédric + Claude | ✅ Fait (testé end-to-end) |
| Branches Supabase (4) | Cédric + Claude | ✅ Fait |
| OpenRouter clés par groupe ($5 chacune) | Cédric | ✅ Fait |
| `.env.example` par groupe (creds injectées) | Cédric + Claude | ✅ Fait |
| Template Flutter mobile (Group D) | Lorenzo | ⏳ À faire |
| Seeds Supabase (50 skills, comptes test, fixtures) | Louis | ⏳ À faire |
| Schémas DB par branche (Alembic migrations init) | Louis / Lorenzo | ⏳ À faire |
| Kits `HACKATHON.md` par groupe | Cédric | ⏳ À faire |
| Org GitHub `hlmr-hackathon-2026` + 4 forks | Lorenzo | ⏳ À faire |
| Critères jury formalisés avec école | Cédric | ⏳ À faire |
| Composition groupes confirmée école | Cédric | ⏳ À faire |
| Test J-1 par 1 personne externe (setup <1h) | Cédric | ⏳ À faire |

## Usage par groupe (workflow étudiant)

À J0 matin, après kickoff, chaque groupe :

1. **Clone le fork GitHub** de son groupe (créé par Lorenzo, contient `backend/` + `frontend/` issus du template)
2. **Copie `.env.example`** depuis son dossier groupe en `.env` (backend) et `.env.local` (frontend) :
   ```bash
   cp /chemin/vers/hackathon/group-X-xxx/.env.example backend/.env
   cp /chemin/vers/hackathon/group-X-xxx/.env.example frontend/.env.local
   # filtrer les vars selon backend/frontend ou utiliser tel quel
   ```
3. **Récupère le DB password** sur Supabase dashboard (Settings → Database, branche du groupe) et remplace `REPLACE_WITH_DB_PASSWORD` dans `.env`
4. **Installe les deps** : `cd backend && make install && cd ../frontend && make install`
5. **Migrate la DB** : `cd backend && make migrate` (applique les migrations Alembic initiales)
6. **Démarre les serveurs** : `make dev` côté backend (port 8000) et côté frontend (port 3000)

À J0 fin de matinée, chaque groupe a son setup complet et peut commencer à coder selon les contrats `hackathon/contracts/group-X-xxx/`.
