# Brief — Groupe A — Mira Mentors (candidature en 8 étapes + validation)

> **Pitch en 1 phrase** : Construire le **tunnel de candidature mentor en 8 étapes** assisté par IA (ingestion CV/LinkedIn, suggestions de classes, simulation revenu), plus le **back-office admin** de modération + l'annuaire public des mentors validés.

## Pourquoi cette feature ?

Mira Learn est la plateforme edtech d'Hello Mira pour les digital nomads. Sans **experts validés**, pas de classes — donc pas de Mira Learn. Le Groupe A construit la **porte d'entrée du côté offre** : un tunnel guidé qui transforme un nomade compétent en **Mira Mentor avec sa première Mira Class proposée**, prêt à être validé par l'équipe HLMR.

Le tunnel est conçu pour qu'un candidat sérieux le complète en **10-15 minutes**, avec aide IA à chaque étape :
1. Identité légère
2. Ingestion CV/LinkedIn (ou mode manuel)
3. Profil pro (prérempli si CV ingéré)
4. Suggestion IA de 3 sujets de classes alignés sur son profil
5. Format + rythme + villes de la classe choisie
6. Simulation de revenu avec marge plateforme 25 %
7. Acceptation conditions + submission
8. Suivi état candidature (éditable tant que pas en review)

## Ce qui est attendu (livrables fin J3)

### Must-have (démo end-to-end)

#### 🛣️ Tunnel candidature (8 étapes)

- [ ] **Étape 1 — Identité** : `/mentors/apply/step-1` — first_name, last_name, nomad_since_year, prior_masterclasses_count
- [ ] **Étape 2 — Choix méthode** : `/mentors/apply/step-2` — 3 cards : "Importe ton LinkedIn", "Upload ton CV PDF", "Renseigne en manuel"
- [ ] **Étape 3.1 — Ingestion IA** : si LinkedIn URL ou CV PDF, parsing + extraction par OpenRouter, statut visuel "Mira analyse ton profil…"
- [ ] **Étape 3.2 — Profil pro** : `/mentors/apply/step-3` — expériences (préremplies), skills (préremplies), bio courte + bio longue + transmission_pitch ("ce que tu aimerais transmettre et pourquoi")
- [ ] **Étape 4 — Suggestions classes** : `/mentors/apply/step-4` — 3 cards de classes suggérées par IA (titre + description + skills + demand signal "🔥 47 nomades cherchent — 0 mentor enseigne") avec actions Adopter / Modifier / Pas pour moi + possibilité de saisir une classe manuelle
- [ ] **Étape 5 — Format & lieux** : `/mentors/apply/step-5` — pour la classe choisie : durée totale collective / individuelle estimée, rythme (1×/sem, intensif weekend, async…), format (online/physique/hybride), villes envisagées si physique
- [ ] **Étape 6 — Simulation revenu** : `/mentors/apply/step-6` — saisie du prix recommandé par heure collective + heure individuelle → simulation calculée à la volée : revenue brut, frais plateforme 25 %, net mentor
- [ ] **Étape 7 — Acceptation + submit** : `/mentors/apply/step-7` — récap + checkbox conditions + bouton "Soumettre ma candidature"
- [ ] **Étape 8 — Suivi candidature** : `/me/application` — état (`draft` / `submitted` / `in_review` / `validated` / `rejected`) ; édition possible tant que `status != in_review` SAUF identité (verrouillée après step 1)

#### 🏛️ Backoffice admin

- [ ] `/admin/applications` — liste filtrable par status (`submitted` / `in_review` / `validated` / `rejected`)
- [ ] `/admin/applications/{id}` — fiche détail complète : identité, profil pro, classe proposée (avec format/rythme/villes/simu), décision (textarea + 3 boutons : refuser / en examen / valider)
- [ ] **Flow de validation** : admin valide → backend crée `mentor_profile` + slug + passe `mira_class.status` en `validated_draft`

#### 🌐 Annuaire public

- [ ] `/mentors` — annuaire filtrable + grid de mentor cards
- [ ] `/mentors/{slug}` — fiche détail mentor avec parcours + classes proposées

### Nice-to-have (si temps)

- [ ] Filtres avancés annuaire (skill, ville, prix)
- [ ] Édition de la fiche mentor par le mentor lui-même (`/me/profile`)
- [ ] Re-proposition d'une nouvelle classe par le mentor déjà validé
- [ ] Avatar upload Supabase Storage

### Out of scope (explicitement)

- Pas de Stripe / paiement (la simulation revenu est purement indicative)
- Pas de signature électronique / mandat 289 I-2
- Pas de notifications email (toasts en console)
- Pas d'i18n EN — **FR uniquement**
- Pas de mobile (groupe D fait la version mobile)

## Contraintes

### Techniques

- **Stack imposée** : FastAPI 0.115 (backend) + Next.js 16 (front) + shadcn/ui + Tailwind v4
- **Tokens design** : `#E6332A` mira-red, `#EFEAE5` warm-beige, `#1D1D1B` charcoal, fonts Manrope + Playfair Display — voir [`design-system.md`](../design-system.md)
- **JSend** pour toutes les réponses API
- **Auth Supabase** via JWT validé par JWKS, role `nomad` pour candidat, role `admin` pour modération
- **DB locale** : Postgres 16 via Docker, isolé groupe-a (`docker compose up -d`)
- **Migrations Alembic** déjà fournies (0001 schema + 0002 seed)
- **OpenRouter** pour les étapes 3.1 (extraction CV) et 4 (suggestions classes)
- **Persistance multi-étapes** : la `mentor_application` est créée en `draft` dès l'étape 1 et mise à jour par PATCH à chaque étape. La `mira_class` proposée est elle aussi en `draft` jusqu'au submit final.

### Organisationnelles

- 5-6 étudiants, 3 jours, mentor HLMR dédié (Lorenzo)
- Pas de modif cross-groupe ; vos changements de schéma `mira_class` impactent groupes B, C, D — coordonnez J1

### Sécurité

- Clés OpenRouter cap $5 — pas de boucle d'agent
- Service role Supabase jamais exposé au front
- Le CV uploadé reste **privé** (lien Supabase Storage non listé public)

## Comment démarrer

```bash
# 1. Postgres local
cd hackathon/group-a-mentor
docker compose up -d

# 2. Env
cp .env.example backend/.env
cp .env.example web/.env.local

# 3. Backend (terminal 1)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head     # applique 0001 (schema) + 0002 (seed 5 mentors)
uvicorn main:app --reload --port 8000

# 4. Front (terminal 2)
cd web
npm install
npm run dev
```

## Personas clés pour la démo

| Email | Rôle démo | Pourquoi ce compte |
|---|---|---|
| `antoine.martin@hackathon.test` | **Star mentor déjà validé** | Affiché en tête d'annuaire, sa class "Pitcher pour lever 500k €" est la flagship |
| `emma.rossi@hackathon.test` | **Candidate qui démarre le tunnel en live** | Vide pour l'instant — Emma fait les 8 étapes en démo, l'IA lui suggère 3 classes brand/content/Webflow |
| `nathan.kim@hackathon.test` | Candidate avec CV importé | Démo de l'étape 3.1 (ingestion + préremplissage) |
| `chloe.dubois@hackathon.test` | Candidate en `in_review` | Démo d'état intermédiaire admin |
| `paul.weiss@hackathon.test` | Candidate `rejected` | Démo flow refus avec `decision_reason` rempli |
| `admin@hackathon.test` | Admin HLMR | Compte pour valider Emma en live |

Tous : password `Hackathon2026!`

## Inspirations / refs

- **Tunnel multi-étapes** : Typeform, Stripe Atlas onboarding, Notion sign-up flow — sobre, 1 question à la fois
- **Ingestion LinkedIn/CV** : Welcome to the Jungle, AngelList apply — extraction propre + édition
- **Suggestion IA + adopt** : Notion AI, Coda AI — preview + accept inline
- **Simulation revenu** : Stripe Atlas pricing simulator, Indy estimateur — chiffres clairs + tooltip explicatif
- **Suivi état** : Typeform status page, GitHub PR status — progression visible, état clair

## Mentor HLMR référent

**Lorenzo (@lozoclt)** — tech, Slack `#hackathon-mira-learn-a`.
