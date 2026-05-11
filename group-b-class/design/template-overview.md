# Template Mira Mentor Backoffice — Groupe B

Maquette interactive React générée via Claude Design, livrée dans `design/template/`. Elle couvre les écrans clés du backoffice mentor (dashboard, gestion classes, modules, sessions, apprenants, QCM avec génération IA) et sert de **référence visuelle + base de code** pour le Groupe B.

> Source : prompts conservés dans `design/template/uploads/` pour traçabilité.
> **Version actuelle** : v2 — inclut les vues agrégées Sessions + Apprenants (correction du proto initial qui les flaggait à tort dans le scope C).

## Comment l'ouvrir

Prototype React standalone (React UMD + Babel standalone, pas de build step).

```bash
cd hackathon
python3 -m http.server 8765
# Puis ouvrir : http://localhost:8765/group-b-class/design/template/Mira%20Mentor%20Backoffice.html
```

Le router est **hash-based** (`#/dashboard`, `#/dashboard/classes`, `#/dashboard/classes/{id}?tab=modules`, etc.) — toutes les routes sont accessibles via `window.location.hash`.

## Arborescence

```
template/
├── Mira Mentor Backoffice.html   Point d'entrée — bootstrap React + scripts JSX
├── styles.css                    Styles globaux (tokens + atoms + layout backoffice)
├── design-system/
│   ├── colors_and_type.css       Tokens couleurs + typo (importé par styles.css)
│   ├── fonts.css                 Imports Google Fonts (Manrope + Playfair Display)
│   ├── hellomira.svg             Logo wordmark
│   └── hmira.svg                 Mark seul (icône)
├── src/
│   ├── app.jsx                   Hash-based router + dispatch écran
│   ├── icons.jsx                 Wrapper icônes Lucide (export I.Plus, I.Edit, I.Layers, etc.)
│   ├── atoms.jsx                 Réutilisables : Btn, StatusBadge, Chip, Avatar, TopBar
│   ├── sidebar.jsx               Sidebar persistante 240 px (navigation + profil mentor)
│   └── screens/
│       ├── Dashboard.jsx         Écran 1 — /dashboard (stat cards + à traiter + activité)
│       ├── Classes.jsx           Écran 2 — /dashboard/classes (liste filtrable)
│       ├── ClassEdit.jsx         Écran 3 — /dashboard/classes/{id} (tabs : overview / modules / sessions / enrolments)
│       ├── Sessions.jsx          Écran 4 — /dashboard/sessions (vue agrégée toutes classes)
│       ├── Learners.jsx          Écran 5 — /dashboard/learners (vue agrégée tous apprenants)
│       └── QuizEditor.jsx        Écran 6 — /dashboard/quizzes/{id} (édition + génération IA)
└── uploads/                      Prompts utilisés pour générer le template
    ├── claude-design-prompt.md                              v1 — backoffice initial
    └── claude-design-prompt-correction-sessions-learners.md v2 — correction + ajout Sessions/Learners
```

## Mapping écrans → composants → routes

| Écran | Composant | Route hash | Route prod (Next.js) |
|---|---|---|---|
| Dashboard mentor | `Dashboard.jsx` | `#/dashboard` | `/dashboard` |
| Liste classes | `Classes.jsx` | `#/dashboard/classes` | `/dashboard/classes` |
| Édition class (4 tabs) | `ClassEdit.jsx` | `#/dashboard/classes/{id}?tab=overview\|modules\|sessions\|enrolments` | `/dashboard/classes/[id]` |
| Sessions agrégées (toutes classes) | `Sessions.jsx` | `#/dashboard/sessions` | `/dashboard/sessions` |
| Apprenants agrégés (toutes classes) | `Learners.jsx` | `#/dashboard/learners` | `/dashboard/learners` |
| Éditeur QCM (avec IA) | `QuizEditor.jsx` | `#/dashboard/quizzes/{id}` | `/dashboard/quizzes/[id]` |
| QCM index | `QuizzesIndex` (dans app.jsx) | `#/dashboard/quizzes` | `/dashboard/quizzes` |
| Profil mentor | `SimplePlaceholder` | `#/dashboard/profile` | placeholder à compléter |

## Détail composant `ClassEdit.jsx` (~636 lignes — le hub d'édition)

Page avec 4 tabs sélectionnables (`overview` / `modules` / `sessions` / `enrolments`) — la sélection est dans l'URL en query string.

### Tab `overview` (default)

Édition inline des métadonnées class :
- Titre (input), description (textarea markdown)
- Format envisagé (radio : physique / virtuel / hybride)
- Rythme (segmented : weekly / biweekly / monthly_workshop / intensive_weekend / async)
- Skills enseignées (chips éditables + 1 primaire en sage-soft)
- Heures collectives + heures individuelles (inputs)
- Pricing : tarif heure collective + individuelle + **bloc simulation revenu calculé en live** (marge plateforme 25 %)
- Actions : `Soumettre à validation admin` / `Mettre en pause` / `Archiver`

### Tab `modules`

Liste drag/drop des modules : drag handle `≡`, title + meta (durée · type · status), compteurs `1 quiz · 4 ressources`, actions inline `[Édit] [Quiz] [Matériel]`. Bouton `+ Nouveau module`. Édition inline déplie un mini-form.

### Tab `sessions` (sessions de cette class uniquement)

Cards par session avec type (📍 / 🌐), location, dates, capacité (X/Y inscrits + waitlist), status. Bouton `+ Nouvelle session` ouvre drawer (type, lieu, online provider, dates, capacité, waitlist_max, prix).

### Tab `enrolments` (candidats de cette class uniquement)

Tabs filter par status (Tous / Applied / Accepted / Waitlist / Cancelled). Cards apprenant avec avatar + nom + status badge + bio courte + extrait motivation. Actions inline selon status.

## Détail composant `Sessions.jsx` (~381 lignes — vue agrégée toutes classes)

**Différence avec `ClassEdit.jsx` tab sessions** : ce composant montre **TOUTES les sessions du mentor à plat**, indépendamment de la class.

- Header : "Sessions" + sous-titre "Toutes tes sessions, toutes classes confondues" + bouton primary `+ Nouvelle session`
- Filtres en row : status segmented (Toutes / Planned / Open enrolment / Full / In progress / Completed / Cancelled), class multi-select, type (Physique / Virtuel / Hybride), période date range
- **Liste dense style Linear** (1 ligne par session, hover row) :
  - Icône type (📍 / 🌐) + lieu + status badge à droite
  - Class associée (cliquable)
  - Métadonnées : dates · type · inscrits/capacité · waitlist · prix
  - Bouton `[Gérer →]` → renvoie vers `/dashboard/classes/{class_id}?tab=sessions&session={session_id}`
- Empty state : icône Calendar + "Aucune session" + CTA `Voir mes classes`

## Détail composant `Learners.jsx` (~465 lignes — vue agrégée tous apprenants)

**Vue CRM mentor** : tous les apprenants ayant une relation avec lui (inscrits, en waitlist, candidats), à plat.

- Header : "Apprenants" + sous-titre "Tous tes apprenants, toutes classes et sessions confondues" (pas de bouton primary — un mentor ne crée pas d'apprenant)
- Filtres : status enrolment segmented, class multi-select, session dépendant de la class, tri (Plus récent / Plus ancien / Nom A→Z)
- **Liste dense** : 1 ligne par apprenant × session (Anna dans 2 sessions = 2 lignes)
  - Avatar + nom + status badge à droite
  - `Class · Session` cliquable
  - Timestamp relatif + extrait motivation (si applied)
  - Actions inline selon status : `[Refuser] [Accepter]` / `[Déplacer en active →]` / `✓ Active`
- **Click sur ligne** → drawer side-panel droit ~50 % largeur écran avec fiche apprenant détaillée (bio, country, skills cibles + validées, toutes inscriptions chez ce mentor, réponses au form personnalisé, textarea commentaire, actions contextuelles)
- Empty state : icône Users + "Personne ne s'est encore inscrit"

## Détail composant `QuizEditor.jsx` (~444 lignes)

Hub d'édition d'un QCM avec **génération IA** :

- Header : breadcrumb `← Module "..."` + titre + status badge + sous-titre passing score
- **Bouton primary haut droite** : `✨ Générer 5 questions avec Mira AI`
- Modal génération IA : textarea contexte + slider nombre questions + dropdown modèle + bouton `Générer →` + loading skeleton ~10 s
- Liste questions cards : énoncé + 4 options radio (1 marquée bonne avec ring success) + actions inline `[Édit] [Supprimer]`
- Édition inline déplie mini-form (enoncé + 4 options + bonne réponse + explication optionnelle)
- Footer : bouton `Publier ce QCM` (désactivé si moins de 3 questions)

## Composants atomiques (`atoms.jsx`)

Exposés globalement :
- `Btn` : button polymorphe avec `variant` (primary / secondary / ghost / destructive), `size` (sm / md), `icon`, `iconRight`
- `StatusBadge` : chip coloré pour status (draft / in_review / validated_draft / published / archived / etc.)
- `Chip` : neutre + variant `chip-primary` (sage-soft) pour skills primaires
- `Avatar` : rond, gradient déterministe via initiales
- `TopBar` : header de page avec breadcrumbs + actions

## Sidebar (`sidebar.jsx`)

Persistante 240 px, bg `card-bg`. Items 36 px avec icône Lucide outlined + label + compteur en muted entre parens. Active state : bg `warm-beige` + barre verticale `mira-red` 3 px à gauche.

Sections :
- Vue d'ensemble · Mes classes (N) · Sessions (N) · Apprenants (N) · QCM (N)
- Séparateur
- Mon profil
- Footer : avatar + nom mentor (Antoine M.) + dropdown (Profil / Déconnexion)

## Tokens design appliqués (`design-system/colors_and_type.css`)

Couleurs : `--mira-red #E6332A`, `--warm-beige #EFEAE5`, `--charcoal #1D1D1B`, `--muted #888`, `--gold #D4A853`, `--sage-soft #D6E3D0`, `--beige-deep #E2DCD3`, `--success #16A34A`, `--error #EF4444`.
Fonts : Manrope (sans, body) + Playfair Display (serif, titres éditoriaux uniquement — Dashboard greeting).

→ Strictement cohérent avec le template du Groupe A et `hackathon/design-system.md`.

## Comment intégrer dans `web/` (Next.js 16)

1. **Tokens** : copier `design-system/colors_and_type.css` + `fonts.css` dans `web/app/globals.css`. Si Tailwind v4, mapper en `@theme inline { --color-mira-red: ... }`.
2. **Components** : chaque écran JSX a son équivalent Next.js :
   - `Dashboard.jsx` → `web/app/dashboard/page.tsx` (Server Component, fetch SSR stats + activité)
   - `Classes.jsx` → `web/app/dashboard/classes/page.tsx`
   - `ClassEdit.jsx` → `web/app/dashboard/classes/[id]/page.tsx` (Client Component pour tabs + édition inline)
   - `Sessions.jsx` → `web/app/dashboard/sessions/page.tsx` (Server Component, filtres en query string)
   - `Learners.jsx` → `web/app/dashboard/learners/page.tsx` (Client Component, drawer en parallel route ou Sheet)
   - `QuizEditor.jsx` → `web/app/dashboard/quizzes/[id]/page.tsx` (Client Component, useState pour brouillon questions)
   - `atoms.jsx` → `web/components/ui/` (réutilisé du Groupe A si déjà porté)
   - `sidebar.jsx` → `web/components/layout/sidebar.tsx` (Client Component, route active via `usePathname`)
3. **API** : remplacer les mocks par fetchs réels :
   - Dashboard : `GET /v1/me/dashboard-stats`
   - Liste classes : `GET /v1/me/classes`
   - Édition class : `GET /v1/classes/{id}` + `PATCH /v1/classes/{id}` (auto-save sur chaque champ)
   - Modules : `GET/POST/PATCH /v1/classes/{id}/modules`
   - Sessions agrégées : `GET /v1/me/sessions` (avec filtres status / class / type / period en query string)
   - Apprenants agrégés : `GET /v1/me/learners` (avec filtres status / class / session, paginated)
   - Enrolments : `GET /v1/classes/{id}/enrolments` + `POST /v1/enrolments/{id}/accept`
   - Génération QCM : `POST /v1/internal/llm/generate-quiz` (proxy OpenRouter côté backend)
4. **Auth** : wrapper `/dashboard/*` dans middleware Supabase auth + check role `mentor`
5. **Drag & drop modules** : `@dnd-kit/sortable` (compatible Next.js 16 + Server Components)
6. **Drawer Learners.jsx** : utiliser `Sheet` de shadcn/ui (parallel route option pour SEO si besoin)

## Limites connues du template (et écarts vs scope)

⚠️ **Manques par rapport au scope discuté** (à coder pendant le hackathon) :

1. **Forms personnalisés mentor** — pas implémenté dans le template (le builder de questions pré-inscription apprenant n'a pas son UI ; à designer en J2 avec mentor HLMR).
2. **Matériel module détaillé** — le template affiche `4 ressources` dans la liste modules mais pas l'écran d'édition / upload (`mira_class_session_module_material` : PDF, vidéo URL, image).
3. **Workflow `enrichment_in_progress` détaillé** — un seul bouton `Soumettre à validation admin`, mais pas la phase entre `validated_draft` (Group A) et `published` qui est le cœur de l'expérience B.
4. **Création QCM depuis un module spécifique** — route `/dashboard/modules/{id}/quizzes/new` (BRIEF.md) non câblée ; le template a juste l'éditeur de QCM existant en mode "édition existant".

**Autres limites prototype** :
- Pas de validation form, pas de persistance backend (state local React, refresh perd tout)
- Pas de vraie génération IA — questions hardcodées
- Pas de drag & drop fonctionnel (icône `≡` visuelle seulement)
- `SimplePlaceholder` contient encore un texte "Vue agrégée — Groupe C" cosmétique mais n'est plus utilisé pour Sessions/Learners (seulement pour `/dashboard/profile`) — à nettoyer lors du portage

## Prochaines actions Groupe B (J1-J3)

1. **J1 matin** : lecture du template + brief → distribution stories
2. **J1 après-midi** : portage atoms + sidebar dans `web/` → Dashboard.jsx en Next.js avec mocks
3. **J2 matin** : Classes + ClassEdit (tab overview + modules) + persistance backend
4. **J2 après-midi** : ClassEdit (tab sessions + enrolments) + Sessions.jsx + Learners.jsx + drawer apprenant + flow accept/refuse candidature + **forms personnalisés** (manque template, à designer J2 avec mentor HLMR)
5. **J3 matin** : QuizEditor + génération IA OpenRouter + publication QCM
6. **J3 après-midi** : intégration matériel module (PDF upload Supabase Storage) + démo storytelling Antoine end-to-end
