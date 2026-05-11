# Groupe B — Mira Class (backoffice mentor)

## Périmètre

- Backoffice mentor : créer / éditer une class, modules, matériel
- Gestion sessions : capacité, dates, waitlist
- Formulaire de validation candidature apprenant + accept/decline
- QCM : générer questions par IA, valider, attribuer en fin de module
- Forms personnalisés mentor

PRD : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`
Organisation : `shared/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`

## Structure

```
group-b-class/
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

> **Auth Supabase / DB locale** : Supabase pour l'Auth seul, Postgres local Docker pour les tables métier.

## Setup (à faire J1 matin)

```bash
# 1. Lancer Postgres local
docker compose up -d

# 2. Préparer les .env
cp .env.example backend/.env
cp .env.example web/.env.local

# 3. Backend (terminal 1)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head
uvicorn main:app --reload --port 8000

# 4. Front (terminal 2)
cd web
npm install
npm run dev
```

Reset DB : `docker compose down -v && docker compose up -d && (cd backend && alembic upgrade head)`

## Contrats DB

Voir `hackathon/contracts/group-b-class/` — 9 entités :

- `mira_class_module` / `mira_class_module_skill`
- `mira_class_session` / `mira_class_session_module` / `mira_class_session_module_material`
- `mira_class_module_quiz` / `mira_class_module_quiz_question` / `mira_class_module_quiz_option`
- `mira_class_enrolment`

## Comptes test

22 comptes pré-seedés sur la branche `groupe-b`. Liste : `hackathon/contracts/test-accounts.md`.

Comptes phares :
- `antoine.martin@hackathon.test` — mentor avec class "Pitcher pour lever 500k" en `validated_draft`
- `pierre.lambert@hackathon.test` — nomad en **waitlist** session Antoine
- `samuel.nguyen@hackathon.test` — nomad qui a annulé une inscription
- `admin@hackathon.test` — admin pour valider les classes

## OpenRouter

Clé dédiée groupe-b (cap $5) déjà injectée dans `.env.example`.

Use-cases attendus : génération de QCM (5-10 questions sur un module + corrections), suggestion de matériel à ajouter à un module.
