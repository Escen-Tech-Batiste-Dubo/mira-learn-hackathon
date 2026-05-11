# Groupe A — Mira Mentors (front public + onboarding mentor)

## Périmètre

- Front public mentor : annuaire, fiche détail, candidature en ligne
- Backoffice admin : revue des candidatures, validation/refus
- Import CV + extraction skills par IA (OpenRouter)
- Catalogue skills (lecture)

PRD : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`
Organisation : `shared/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`

## Structure

```
group-a-mentor/
├── .env.example          # credentials Supabase (Auth) + OpenRouter + DATABASE_URL local
├── docker-compose.yml    # Postgres 16 local (port 5432)
├── README.md             # ce fichier
├── backend/              # FastAPI (port 8000) — DB tables métier en local
│   ├── app/
│   ├── alembic/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
└── web/                  # Next.js 16 (port 3000)
    ├── app/
    ├── components/
    ├── lib/
    ├── package.json
    └── README.md
```

> **Auth Supabase / DB locale** : Supabase n'est utilisé que pour Auth (login → JWT). Les tables métier (`mentor_profile`, `mira_class`, etc.) vivent dans le Postgres local Docker. Les `auth.users.id` Supabase sont référencés comme **clé externe non-enforced** côté backend.

## Setup (à faire J1 matin)

```bash
# 1. Lancer Postgres local (terminal 1, en arrière-plan)
docker compose up -d
# → Postgres 16 sur localhost:5432 (user/pass: postgres/postgres)

# 2. Préparer les .env locaux à partir du .env.example racine
cp .env.example backend/.env
cp .env.example web/.env.local

# 3. Lancer le backend (terminal 2)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head                  # crée les tables métier dans Postgres local
uvicorn main:app --reload --port 8000
# → Swagger sur http://localhost:8000/docs

# 4. Lancer le front (terminal 3)
cd web
npm install
npm run dev
# → http://localhost:3000
```

Commandes utiles Docker :

```bash
docker compose down       # arrêt (garde le volume)
docker compose down -v    # arrêt + reset DB (supprime le volume)
docker compose logs -f    # suivre les logs Postgres
```

## Contrats DB

Voir `hackathon/contracts/group-a-mentor/` — 10 entités :

- `mentor_application` / `mentor_application_skill` / `mentor_cv_import`
- `mentor_profile` / `mentor_profile_skill` / `mentor_rating_breakdown`
- `mira_class` / `mira_class_module_outline` / `mira_class_ai_suggestion`
- `skill_demand_aggregate`

Skills partagées : `hackathon/contracts/shared/skill.md`

## Comptes test

22 comptes pré-seedés sur la branche `groupe-a` (Auth Supabase isolé par branche).
Liste canonique : `hackathon/contracts/test-accounts.md`
Password commun : `Hackathon2026!`

Comptes phares pour la démo :
- `antoine.martin@hackathon.test` — star mentor (rating 4.8, 12 classes)
- `emma.rossi@hackathon.test` — candidate `submitted` à valider en live
- `chloe.dubois@hackathon.test` — candidate `in_review`
- `paul.weiss@hackathon.test` — candidate `rejected` (démo flow refus)
- `admin@hackathon.test` — admin HLMR (validation candidatures)

## OpenRouter

Clé dédiée groupe-a (cap $5) déjà injectée dans `.env.example`.
Modèle par défaut : `anthropic/claude-3.5-haiku` (rapide + économique).

Use-cases attendus : extraction skills depuis un CV (PDF → texte → skills), suggestion de modules pour une class proposée.
