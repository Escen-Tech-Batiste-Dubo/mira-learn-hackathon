# Brief — Groupe B — Mira Class (backoffice mentor + sessions)

> **Pitch en 1 phrase** : Construire le **backoffice mentor** où un Mira Mentor structure sa class (modules + matériel + QCM) et la rend opérable via des sessions concrètes (capacité + waitlist + accept/decline d'inscriptions).

## Pourquoi cette feature ?

Une fois qu'un nomad est devenu Mira Mentor (Groupe A), il doit pouvoir **créer et opérer ses classes**. C'est le cœur de l'expérience produit : sans backoffice fonctionnel, pas de class, pas de session, pas d'apprentissage. Le Groupe B livre :

1. **Création de Mira Class** : titre, description, skills enseignées, format (live virtuel / présentiel / hybride / async)
2. **Modules pédagogiques** : structure en N modules (1 module = une unité d'apprentissage avec matériel + objectif)
3. **Sessions concrètes** : dates, lieu, capacité, prix — c'est la session qui est **inscriptible**, pas la class abstraite
4. **QCM IA-assistés** : génération de questions via OpenRouter à partir du contenu du module
5. **Gestion candidatures apprenants** : voir les enrolments `applied`, accepter, refuser, gérer la waitlist

Votre livrable conditionne les autres :
- Sans modules + sessions → les Groupes C et D n'ont rien à afficher / suivre
- Sans QCM → pas de validation de skill côté mobile (Groupe D)

## Ce qui est attendu (livrables fin J3)

### Must-have (démo end-to-end)

- [ ] **Login mentor** → dashboard `/dashboard/classes` (liste des classes du mentor connecté)
- [ ] **Création Mira Class** : `/dashboard/classes/new` (form titre + description + skills + format)
- [ ] **Édition modules** : `/dashboard/classes/{id}/modules` — ajout / réordonnancement / édition (titre, durée, type)
- [ ] **Création de session** : `/dashboard/classes/{id}/sessions/new` (type, dates, capacité, prix, lieu)
- [ ] **Gestion candidatures** : `/dashboard/classes/{id}/enrolments` — voir liste, accepter/refuser
- [ ] **Création QCM IA** : `/dashboard/modules/{id}/quizzes/new` — bouton "Générer 5 questions" via OpenRouter
- [ ] **Démo storytelling** : Antoine se connecte, ajoute un module à sa class "Pitcher pour lever 500k", génère un QCM, publie une session à Barcelone, accepte la candidature d'Anna

### Nice-to-have (si temps)

- [ ] Upload matériel de module (PDF, image, vidéo URL)
- [ ] Forms personnalisés mentor (questions pré-inscription apprenant)
- [ ] Workflow "validated_draft → enrichment → published" complet
- [ ] Édition inline d'un QCM (modifier les questions générées)

### Out of scope (explicitement)

- Pas de paiement Stripe — seulement le **prix indicatif** stocké
- Pas de signature électronique
- Pas de notifs (emails, push) — events en console
- Pas d'i18n EN — **FR uniquement**

## Contraintes

### Techniques

- **Stack** : FastAPI + Next.js 16 (admin layout SPA), couleurs Mira, shadcn/ui forms
- **JSend** + **Auth Supabase** via JWT (role `mentor` requis pour `/dashboard/*`, role `admin` pour modération)
- **CHECK constraints SQL** : respectez les ENUMS des contracts (status mira_class : `draft|submitted|in_review|validated_draft|enrichment_in_progress|published|rejected|archived`, etc.)
- **DB locale Postgres** isolée par groupe
- **Cross-group refs** : `mentor_user_id` pointe vers Supabase auth.users.id (les profils mentors sont dans la table `mentor_profile` seedée localement, FK non-enforced vers groupe A)

### Organisationnelles

- 5-6 étudiants, 3 jours, mentor HLMR dédié
- Pas de modif cross-groupe

## Comment démarrer

```bash
cd hackathon/group-b-class
docker compose up -d
cp .env.example backend/.env
cp .env.example web/.env.local

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head      # 0001 schema + 0002 seed (5 mentors)
uvicorn main:app --reload --port 8000

# autre terminal
cd ../web && npm install && npm run dev
```

## Personas clés pour la démo

| Email | Rôle démo | Pourquoi |
|---|---|---|
| `antoine.martin@hackathon.test` | **Mentor principal** | Sa class "Pitcher pour lever 500k" est la flagship — c'est lui qui se connecte et opère |
| `marie.dupont@hackathon.test` | Mentor design | Pour démontrer un autre profil mentor |
| `anna.lopez@hackathon.test` | Nomad inscrite | Sa candidature à la session Antoine est `applied` — à accepter en live |
| `pierre.lambert@hackathon.test` | Nomad waitlist | Démo capacité atteinte + waitlist |
| `samuel.nguyen@hackathon.test` | Nomad annulé | Démo flow `cancelled` |
| `admin@hackathon.test` | Admin HLMR | Validation finale des classes (status → published) |

## Inspirations / refs

- **Backoffice mentor** : style Teachable, Maven, Podia — productivité + clarté
- **Modules + matériel** : style Notion (drag/drop, blocs) ou Linear (claviers + listes)
- **QCM IA** : pattern "Generate with AI" (Notion AI, Coda AI) — un bouton, une preview, accepter/refuser

## Mentor HLMR référent

**Louis (@lougail)** — backend / data, Slack `#hackathon-mira-learn-b`.
