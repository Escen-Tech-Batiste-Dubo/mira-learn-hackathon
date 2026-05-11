# Groupe C — Mira Learn (front public apprenant + parcours IA)

## Périmètre

- Catalogue Mira Class (public)
- Profil apprenant : skills cibles, CV import, target_skills
- Parcours apprenant généré par IA : N étapes → classes recommandées
- Carte communauté : annuaire apprenants (ouvert par défaut, opt-out)
- Système d'intent d'inscription (form pré-rempli avant candidature class)

PRD : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`
Organisation : `shared/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`

## Structure

```
group-c-learn/
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

Voir `hackathon/contracts/group-c-learn/` — 8 entités :

- `student_profile` / `student_skill` / `student_cv_import`
- `student_learning_path` / `student_learning_path_step` / `student_path_regeneration_log`
- `student_enrolment_intent`
- `skill_relation`

Vues : `hackathon/contracts/group-c-learn/seed-views.md`

## Comptes test

22 comptes pré-seedés sur la branche `groupe-c`. Liste : `hackathon/contracts/test-accounts.md`.

Comptes phares :
- `anna.lopez@hackathon.test` — **star nomad** (Pitch investor + Funding cibles → recommandation class Antoine)
- `marco.silva@hackathon.test` — parcours UI Design actif (4 skills, 5 classes recommandées)
- `lea.bauer@hackathon.test` — profil vide (démo "Définis tes objectifs")
- `tom.evans@hackathon.test` — parcours `completed` (certificats)
- `clara.kovac@hackathon.test` — fresh signup (démo onboarding)

## OpenRouter

Clé dédiée groupe-c (cap $5) déjà injectée dans `.env.example`.

Use-cases attendus : génération de parcours apprenant (cibles + profil → liste de skills/classes ordonnées), extraction skills depuis CV de l'apprenant.
