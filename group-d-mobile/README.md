# Groupe D — Mira Learn Mobile (app companion + community)

## Périmètre

- App Flutter compagne : suivi class, modules, sessions
- QCM mobile : passer un quiz, scoring, résultat
- Notes personnelles + organisation IA par concept
- Feed activité communauté (anonymisé) + carte sessions actives
- Tutor IA Q&A simple (OpenRouter)

PRD : `docs/mira-documentation/Platform/PRD/mira-Learn/v3-vision-cedric/prd.md`
Organisation : `shared/Platform/Tech/notes/hackathon-mira-learn-organisation-v7.md`

## Structure

```
group-d-mobile/
├── .env.example          # credentials Supabase (Auth) + OpenRouter + DATABASE_URL local
├── docker-compose.yml    # Postgres 16 local (port 5432)
├── README.md             # ce fichier
├── backend/              # FastAPI (port 8000) — DB tables métier en local
│   ├── app/
│   ├── alembic/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
└── mobile/               # Flutter (iOS Simulator + Android Emulator)
    ├── lib/              # main.dart + app/ + features/
    ├── test/
    ├── pubspec.yaml
    ├── analysis_options.yaml
    └── README.md
```

> **Auth Supabase / DB locale** : Supabase pour l'Auth seul, Postgres local Docker pour les tables métier.

## Setup (à faire J1 matin)

```bash
# 1. Lancer Postgres local (terminal 1, en arrière-plan)
docker compose up -d

# 2. Préparer les .env locaux
cp .env.example backend/.env
cp .env.example mobile/.env

# 3. Lancer le backend (terminal 2)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head
uvicorn main:app --reload --port 8000

# 4. Lancer le mobile (terminal 3)
cd mobile
flutter create . --org com.hellomira.learn --project-name mira_learn --no-overwrite
flutter pub get
flutter devices                  # lister simulateurs dispos
flutter run -d <device-id>       # démarrer sur le simulateur choisi
```

Reset DB : `docker compose down -v && docker compose up -d && (cd backend && alembic upgrade head)`

⚠️ **Android Emulator** : utiliser `MOBILE_API_URL=http://10.0.2.2:8000` dans `mobile/.env` (10.0.2.2 = host depuis l'émulateur).

## Contrats DB

Voir `hackathon/contracts/group-d-mobile/` — 6 entités :

- `student_note` / `student_note_organization`
- `student_quiz_attempt` / `student_quiz_answer`
- `community_activity_feed`
- Vues : `seed-views.md`

## Comptes test

22 comptes pré-seedés sur la branche `groupe-d`. Liste : `hackathon/contracts/test-accounts.md`.

L'écran de login mobile est pré-rempli avec `anna.lopez@hackathon.test` (nomad démo end-to-end).

Comptes phares :
- `anna.lopez@hackathon.test` — protagoniste storytelling (suit class Antoine, fait QCM, valide skill)
- `nora.ahmed@hackathon.test` — démo QCM (tentatives multiples)
- `eva.fischer@hackathon.test` — démo notes IA (beaucoup de notes prises)

## OpenRouter

Clé dédiée groupe-d (cap $5) déjà injectée dans `.env.example`.

Use-cases attendus : organisation IA des notes (clustering par concept), Q&A tutor IA contextuel.
