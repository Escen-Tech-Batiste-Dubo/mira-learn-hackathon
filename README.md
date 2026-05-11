# Bienvenue à Mira Learn — Hackathon

> 3 jours · 4 équipes · 1 plateforme edtech à construire pour les digital nomads.

Ce repo contient tout ce qu'il te faut pour démarrer : briefs, contrats d'interface, templates de code, maquettes design, migrations de base de données, comptes test. Suis ce README dans l'ordre.

---

## 1. Trouve ton équipe

| Équipe | Mission | Stack |
|---|---|---|
| **A — Mentors** | Front public + tunnel candidature mentor + backoffice admin | FastAPI + Next.js 16 |
| **B — Class** | Backoffice mentor : classes / modules / sessions / QCM IA / apprenants | FastAPI + Next.js 16 |
| **C — Learn** | Front public apprenant + parcours d'apprentissage IA | FastAPI + Next.js 16 |
| **D — Mobile** | App mobile compagne : modules + QCM + notes organisées par IA | FastAPI + Flutter 3.41 |

Une fois ton équipe assignée, **lis le brief de ton groupe** :
[`group-a-mentor/BRIEF.md`](./group-a-mentor/BRIEF.md) · [`group-b-class/BRIEF.md`](./group-b-class/BRIEF.md) · [`group-c-learn/BRIEF.md`](./group-c-learn/BRIEF.md) · [`group-d-mobile/BRIEF.md`](./group-d-mobile/BRIEF.md)

---

## 2. Installe les prérequis (à faire avant J1 matin)

| Outil | Version min | Lien |
|---|---|---|
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |
| **Docker Desktop** | 4.30+ | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) (ou via `nvm`) |
| **Flutter** *(équipe D uniquement)* | 3.22+ | [docs.flutter.dev](https://docs.flutter.dev/get-started/install) |
| **Xcode** *(équipe D, iOS)* | dernier | App Store |
| **VS Code** ou Cursor | dernier | recommandé |

Vérifie que tout est OK :

```bash
git --version
docker --version && docker compose version
python3 --version    # ≥ 3.11
node --version       # ≥ 20
flutter doctor       # équipe D uniquement
```

---

## 3. Clone le repo + récupère tes credentials

```bash
git clone https://github.com/hlmr-travel/mira-learn-hackathon.git
cd mira-learn-hackathon
```

⚠️ **Demande à ton mentor HLMR sur Slack** (`#hackathon-mira-learn-{a|b|c|d}`) :
- `SUPABASE_URL` de ta branche
- `SUPABASE_ANON_KEY` de ta branche
- `OPENROUTER_API_KEY` de ton équipe (budget cap **$5** — pas de boucle d'agent qui spamme)

---

## 4. Lance ton stack local

Toutes les commandes ci-dessous se font depuis ton dossier équipe : `cd group-a-mentor` (ou `b-class`, `c-learn`, `d-mobile`).

### 4.1 — Postgres local (Docker)

```bash
docker compose up -d
```

→ Postgres 16 lance sur `localhost:5432` (user/pass : `postgres/postgres`). Conteneur isolé par groupe.

### 4.2 — Prépare tes fichiers d'environnement

```bash
# Équipes A, B, C (web + backend) :
cp .env.example backend/.env
cp .env.example web/.env.local

# Équipe D (mobile + backend) :
cp .env.example backend/.env
cp .env.example mobile/.env
```

Édite les `.env` créés et remplace les `REPLACE_WITH_...` par les vraies clés reçues sur Slack.

### 4.3 — Backend FastAPI

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head        # crée toutes les tables + seed minimal (skills, profils)
uvicorn main:app --reload --port 8000
```

✅ Vérif : ouvre http://localhost:8000/docs — tu dois voir le **Swagger** avec les routes `/v1/health`, `/v1/version`, etc.
✅ Vérif : `curl http://localhost:8000/v1/health` retourne `{"status":"success","data":{"status":"ok"},...}`.

### 4.4 — Front (équipes A, B, C — terminal séparé)

```bash
cd web
npm install
npm run dev
```

→ Front sur http://localhost:3000.

### 4.4 — Mobile (équipe D — terminal séparé)

```bash
cd mobile
flutter create . --org com.hellomira.learn --project-name mira_learn --no-overwrite
flutter pub get
flutter devices               # liste les simulateurs disponibles
flutter run -d <device-id>    # ex: iPhone 16
```

⚠️ Sur **Android Emulator**, le backend doit être joignable sur `http://10.0.2.2:8000` au lieu de `localhost`. À éditer dans `mobile/.env`.

---

## 5. Ce qui est déjà câblé pour toi

Pour t'éviter de réinventer la roue, on a pré-câblé :

| Côté | Fichier | Quoi |
|---|---|---|
| Backend | `app/core/auth.py` | Validation JWT Supabase via JWKS RS256 + `require_role()` |
| Backend | `app/core/responses.py` | Helpers JSend `{status, data, message}` |
| Backend | `app/integrations/openrouter.py` | Client OpenRouter prêt à l'emploi (`LLMClient.complete()`) |
| Backend | `alembic/versions/0001_*.py` | Schéma SQL complet (toutes les tables de ton groupe) |
| Backend | `alembic/versions/0002_*.py` | Seed minimal (5 skills + 5 profils référence) |
| Front | `app/globals.css` | Tokens Mira (couleurs + fonts Manrope/Playfair) |
| Front | `lib/supabase.ts` | Client Supabase Auth pré-configuré |
| Front | `lib/api-client.ts` | Fetch wrapper qui déballe le JSend automatiquement |
| Front | `hooks/useAuth.ts` | Hook React pour l'état d'auth |
| Mobile (D) | `lib/app/theme.dart` | `MiraTheme` avec tokens couleurs |
| Mobile (D) | `lib/app/providers/auth_provider.dart` | AsyncNotifier Supabase auth |
| Mobile (D) | `lib/app/providers/api_provider.dart` | Dio + Bearer auto + JSend unwrapper |
| Design | `group-X/design/template/` | Maquette React générée par Claude Design (référence visuelle) |

---

## 6. Ce qu'il faut lire avant de pousser ta première ligne de code

Dans cet ordre :

1. [**`RULES.md`**](./RULES.md) — **les 7 règles non-négociables** (5 min). Lis-les. Vraiment.
2. [**`group-X/BRIEF.md`**](./group-a-mentor/BRIEF.md) — la mission précise de ton groupe (10 min)
3. [**`group-X/design/template-overview.md`**](./group-a-mentor/design/template-overview.md) — comment lire le handoff Claude Design (5 min)
4. **Ouvre le proto Claude Design** de ton groupe pour t'imprégner du visuel :
   ```bash
   cd hackathon
   python3 -m http.server 8765
   ```
   Puis ouvre http://localhost:8765/group-X-.../design/template/ (`Mira Mentors.html`, `Mira Mentor Backoffice.html`, `Mira Learn.html`, ou `index.html`)
5. [**`contracts/group-X-*/`**](./contracts) — les schémas SQL + Pydantic de tes entités (référence quand tu codes les endpoints)
6. [**`design-system.md`**](./design-system.md) — tokens couleurs + typo + voice & tone (référence permanente)

---

## 7. Comptes test (login Supabase)

22 comptes pré-seedés sur ta branche Supabase. Liste complète : [`contracts/test-accounts.md`](./contracts/test-accounts.md).

**Password identique pour tous** : `Hackathon2026!`

Personas qui reviennent souvent dans les démos :
- `antoine.martin@hackathon.test` — mentor star (équipes A, B, C, D)
- `anna.lopez@hackathon.test` — protagoniste apprenante (équipes C, D)
- `emma.rossi@hackathon.test` — candidate mentor `submitted` (équipe A)
- `admin@hackathon.test` — admin HLMR pour modération (équipes A, B)

---

## 8. Workflow git

- Branche depuis `main` : `git checkout -b feat/{your-feature}`
- Commits atomiques : `type(scope): message` — `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- 1 PR par story (pas une seule PR géante par groupe en fin de J3)
- Pour relire ton code en équipe avant de push : Pull Request avec au moins 1 reviewer dans ton groupe
- À J3 18h : finalise ta PR pour revue par ton mentor HLMR

---

## 9. Si tu es bloqué

| Durée | Action |
|---|---|
| > 15 min | Tente une approche différente, regarde les contrats / template / brief |
| > 30 min | Demande à un coéquipier de ton groupe |
| > 1 h | **Ping ton mentor HLMR** sur Slack — on est là pour ça |

| Groupe | Mentor référent | Slack |
|---|---|---|
| A | mentor HLMR | `#hackathon-mira-learn-a` |
| B | mentor HLMR | `#hackathon-mira-learn-b` |
| C | mentor HLMR | `#hackathon-mira-learn-c` |
| D | mentor HLMR | `#hackathon-mira-learn-d` |

---

## 10. Reset DB si tu casses tout

```bash
docker compose down -v       # supprime le volume Postgres
docker compose up -d         # relance Postgres vierge
cd backend && alembic upgrade head    # ré-applique 0001 + 0002
```

5 secondes. Pas de drama.

---

> Question avant chaque commit : *"Si un encadrant Hello Mira reprend ma PR lundi matin, est-ce qu'il comprend tout en 5 min ?"*

Bonne chance — et amusez-vous 🚀
