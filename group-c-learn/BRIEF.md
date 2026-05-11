# Brief — Groupe C — Mira Learn (front public apprenant + parcours IA)

> **Pitch en 1 phrase** : Construire le **front public apprenant** : catalogue de Mira Class, profil apprenant avec skills cibles, et **parcours d'apprentissage généré par IA** qui recommande les bonnes classes pour passer du point A au point B.

## Pourquoi cette feature ?

C'est ici qu'un nomade **découvre la valeur** de Mira Learn pour la première fois. Sans Groupe C, on a juste un annuaire (A) et un backoffice mentor (B) mais aucun parcours utilisateur côté demande. Le Groupe C livre :

1. **Catalogue public** : liste des Mira Class published (filtres par skill, format, prix, langue)
2. **Profil apprenant** : déclaration des skills cibles + import CV pour identifier les skills déjà acquises
3. **Parcours IA** : à partir des skills cibles, l'IA génère un parcours en N étapes avec les classes recommandées
4. **Intent d'inscription** : un apprenant remplit un form pré-inscription qui sera traité par le mentor (Groupe B)
5. **Carte communauté** : annuaire des apprenants visible publiquement (opt-in)

Votre livrable est **le point d'entrée du growth** : c'est ce qui transforme un visiteur en candidat à une class.

## Ce qui est attendu (livrables fin J3)

### Must-have (démo end-to-end)

- [ ] **Catalogue public** : `/classes` — liste des Mira Class published avec filtre par skill
- [ ] **Détail Class** : `/classes/{slug}` — fiche complète (mentor, modules, sessions disponibles, prix)
- [ ] **Profil apprenant** : `/me/profile` — édition display_name, bio, current_country, skills cibles
- [ ] **Génération parcours IA** : bouton "Génère mon parcours" → call OpenRouter avec target_skills + profil → parcours en 3-5 étapes
- [ ] **Fiche parcours** : `/me/path` — affiche les étapes, l'étape courante, les classes recommandées par étape
- [ ] **Intent inscription** : `/classes/{slug}/apply` — form pré-inscription → POST `/v1/enrolments` (status `applied`)
- [ ] **Démo storytelling** : Anna se connecte, déclare ses skills cibles (Pitch + Funding), génère son parcours, voit la class d'Antoine recommandée en étape 1, click "S'inscrire"

### Nice-to-have (si temps)

- [ ] Carte communauté `/community` : annuaire apprenants filtré par destination
- [ ] CV import IA : upload PDF → extraction skills déjà acquises
- [ ] Régénération du parcours (avec historique dans `student_path_regeneration_log`)
- [ ] Filtres avancés catalogue (prix, langue, format)

### Out of scope

- Pas de paiement
- Pas de chat / messaging entre apprenants
- Pas de map interactive (carte = simple liste filtrable)
- Pas d'i18n EN

## Contraintes

### Techniques

- **Stack** : FastAPI + Next.js 16 (front public), couleurs Mira, shadcn/ui, design fortement visuel
- **JSend** + **Auth Supabase** (role `nomad` pour `/me/*`)
- **Catalogue = SSR** dans Next.js (`fetch` côté server pour SEO)
- **Parcours IA** : prompt structuré avec `target_skills` + `skill_relation` + `mira_class` candidates → retourne `learning_path` + `steps`
- **DB locale** : `student_profile`, `student_skill`, `student_learning_path*` + cross-group refs `mira_class`, `mentor_profile` (seedées)

### Organisationnelles

- 5-6 étudiants, 3 jours, mentor HLMR dédié
- ⚠️ La qualité de la **génération du parcours IA** est le point critique de votre démo — itérez tôt sur le prompt

## Comment démarrer

```bash
cd hackathon/group-c-learn
docker compose up -d
cp .env.example backend/.env
cp .env.example web/.env.local

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head      # 0001 schema + 0002 seed (5 student_profiles)
uvicorn main:app --reload --port 8000

cd ../web && npm install && npm run dev
```

## Personas clés pour la démo

| Email | Rôle démo | Pourquoi |
|---|---|---|
| `anna.lopez@hackathon.test` | **Star nomad** (Pitch + Funding cibles) | Protagoniste storytelling — génère son parcours en live |
| `marco.silva@hackathon.test` | Designer en transition UI | Profil avec parcours actif déjà généré (4 skills, 5 classes) |
| `lea.bauer@hackathon.test` | Profil vide | Démo "Définis tes objectifs" — onboarding fresh |
| `tom.evans@hackathon.test` | Parcours `completed` | Démo certificats / achievements |
| `clara.kovac@hackathon.test` | Fresh signup | Démo onboarding nomad |

## Inspirations / refs

- **Catalogue** : style Maven, Reforge, Section 4 — listing chaleureux, fiches détaillées
- **Parcours IA** : style Khan Academy, Duolingo learning paths — étapes claires, progression visuelle
- **Profil apprenant** : style LinkedIn Learning ou Mind Studio — skills tagged + objectifs déclarés
- **Mira branding** : warm beige + red accents, photos de digital nomads (Unsplash collection)

## Mentor HLMR référent

**Cédric (@FourmiCrobe)** — produit / IA, Slack `#hackathon-mira-learn-c`.
