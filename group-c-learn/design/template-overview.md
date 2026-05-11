# Template Mira Learn — Groupe C (front public apprenant)

Maquette interactive React générée via Claude Design, livrée dans `design/template/`. Elle couvre les 8 écrans clés du front apprenant (landing, catalogue, fiche class, profil, parcours IA, candidature, communauté) et sert de **référence visuelle + base de code** pour le Groupe C.

> Source : prompt conservé dans `design/template/uploads/claude-design-prompt.md` pour traçabilité.

## Comment l'ouvrir

Prototype React standalone (React UMD + Babel standalone, pas de build step).

```bash
cd hackathon
python3 -m http.server 8765
# Puis ouvrir : http://localhost:8765/group-c-learn/design/template/Mira%20Learn.html
```

Le router est **hash-based** (`#/`, `#/classes`, `#/classes/{slug}`, `#/me`, `#/me/path/generate`, etc.). Toutes les routes sont accessibles via `window.location.hash`.

Un **panneau "Tweaks"** (en bas de page) permet de basculer entre des états démo :
- `personaState` : Anna early-journey / mid-journey / completed (change ce qui est affiché dans `/me`)
- `pathStyle` : vertical / horizontal (orientation timeline parcours)
- `accentIntensity` : balanced / subtle / bold (intensité de la couleur rouge Mira)

## Arborescence

```
template/
├── Mira Learn.html               Point d'entrée — bootstrap React + scripts JSX
├── tweaks-panel.jsx              Dev tool : panneau de toggles démo (état persona, style parcours, accent)
├── assets/
│   ├── hellomira.svg             Logo wordmark Hello Mira
│   └── hmira.svg                 Mark seul (icône)
├── src/
│   ├── app.jsx                   Hash-based router (8 routes) + Header public/auth + Footer + Tweaks
│   ├── atoms.jsx                 Réutilisables : Btn, Chip, Avatar, Header, Footer, SkillChip, ClassCard, MentorMini, etc.
│   ├── data.js                   Mocks : 5 mentors, 3 classes (Pitch / UI Design / Growth B2B), Anna persona, community
│   ├── tokens.css                Variables CSS (couleurs Mira, fonts, spacing) + layout atoms
│   └── pages/
│       ├── Landing.jsx           Écran 1 — / (hero + classes featured + how it works)
│       ├── Catalogue.jsx         Écran 2 — /classes (filtres + grid de class cards)
│       ├── ClassDetail.jsx       Écran 3 — /classes/{slug} (mentor + modules + sessions disponibles)
│       ├── Me.jsx                Écran 4 — /me (profil apprenant : skills cibles + validées + visibilité)
│       ├── PathGenerate.jsx      Écran 5 — /me/path/generate (form génération parcours IA + loading state)
│       ├── Path.jsx              Écran 6 — /me/path (timeline étapes locked / in_progress / completed)
│       ├── Apply.jsx             Écran 7 — /classes/{slug}/apply (form intent inscription)
│       └── Community.jsx         Écran 8 — /community (annuaire apprenants opt-in)
└── uploads/
    └── claude-design-prompt.md   Prompt d'origine donné à Claude Design
```

## Mapping écrans → composants → routes

| Écran | Composant | Route hash | Route prod (Next.js) |
|---|---|---|---|
| Landing chaleureux | `LandingPage` | `#/` | `/` |
| Catalogue | `CataloguePage` | `#/classes` | `/classes` |
| Détail class | `ClassDetailPage` | `#/classes/{slug}` | `/classes/[slug]` |
| Profil apprenant | `MePage` | `#/me` | `/me` |
| Génération parcours IA | `PathGeneratePage` | `#/me/path/generate` | `/me/path/generate` |
| Mon parcours | `PathPage` | `#/me/path` | `/me/path` |
| Form intent inscription | `ApplyPage` | `#/classes/{slug}/apply` | `/classes/[slug]/apply` |
| Communauté | `CommunityPage` | `#/community` | `/community` |

## Détail des écrans clés

### `Landing.jsx` (~234 lignes) — Page d'accueil chaleureuse

- Hero plein écran : titre Playfair Display 56 px "Apprends en voyageant. Avec des mentors qui ont fait le chemin." + sous-titre + 2 CTAs (Découvrir / Devenir mentor)
- Section "Classes featured" : 3 cards en row (Pitch d'Antoine, UI Design de Marie, Growth de David)
- Section "Comment ça marche" : 4 étapes numérotées
- Section témoignages apprenants

### `Catalogue.jsx` (~147 lignes) — Liste des Mira Class

- Filtres en chips row : skill multi-select, catégorie, format (physique / virtuel / hybride), prix max (slider)
- Grid 2 colonnes (responsive 1 col mobile) de `ClassCard`
- Chaque card : photo 16:9 + titre + mentor mini + format/durée + skill chips + prix `mira-red` + bouton `Découvrir →`

### `ClassDetail.jsx` (~146 lignes) — Fiche détaillée

- Hero class : photo 16:9 + titre Playfair + chips skills + format/durée + prix + bouton `Postuler à une session →`
- Section mentor (avatar + nom + rating + lien vers fiche)
- Section "À propos" markdown
- Section "Modules" timeline verticale
- Section "Sessions disponibles" (cards avec lieu, dates, capacité, bouton Postuler)

### `Me.jsx` (~242 lignes) — Profil apprenant

Page contrôlée par le tweak `personaState` (Anna early-journey / mid-journey / completed) pour démontrer 3 états du profil :
- **early-journey** : skills cibles déclarées, parcours non généré, pas d'inscription
- **mid-journey** : 1 parcours actif, 1 class inscrite (Pitcher), bibliothèque vide
- **completed** : 2 skills validées, parcours `completed`, certificats visibles

Sections : header (avatar + nom Playfair + bio + 📍 country) · skills cibles éditables · skills validées success-colored · radio visibilité (public / privé) · preview parcours + CTA · liste inscriptions.

### `PathGenerate.jsx` (~243 lignes) — Génération parcours IA

- Form centré max-w-xl : skills cibles + horizon (3 / 6 / 12 mois) + budget total (€ slider) + CV optionnel (drop zone PDF)
- Bouton primary large `✨ Générer mon parcours`
- État loading : page entière avec animation chaleureuse + texte rotatif "Mira analyse tes objectifs…" → "On croise avec le catalogue…" → "Construction du parcours…"

### `Path.jsx` (~167 lignes) — Mon parcours

Page contrôlée par le tweak `pathStyle` (vertical / horizontal) :
- Header : titre Playfair "Mon parcours" + sous-titre récap (skills · horizon · budget) + bouton ghost `↻ Régénérer`
- Timeline N étapes (généralement 3-5) avec states `in_progress` (mira-red ring), `locked` (muted grisé), `completed` (success + check)
- Chaque étape : titre skill + card class recommandée + rationale

### `Apply.jsx` (~174 lignes) — Form intent inscription

- Header : breadcrumb `← Class : Pitcher pour lever 500k €` + titre Playfair "Postuler à cette Mira Class" + sous-titre rassurant
- Radio cards "Session souhaitée" (📍 Barcelone / 🌐 Virtuelle)
- Radio "Ton niveau actuel" (5 options : débutant → expert)
- Textarea "Objectif concret"
- Checkboxes "Disponibilité"
- Footer : Annuler (ghost) + Soumettre (primary)

### `Community.jsx` (~245 lignes) — Annuaire apprenants

- Header : titre Playfair "La communauté Mira" + sous-titre opt-in
- Filtres : ville (chips), skill cible (chips), skill validée (chips)
- Grid de profil cards (mode liste — pas de vraie carte interactive en MVP)
- Chaque card : avatar + nom + country + nomadisme + skills cibles + skills validées (★ gold)
- Variante optionnelle (selon tweak) : carte mondiale stylisée avec markers pulsants

## Composants atomiques (`atoms.jsx`)

Exposés globalement :
- `Btn` : variants `primary` / `secondary` / `ghost` + sizes
- `Chip` : variant `chip-primary` (sage-soft) pour skill primaire
- `Avatar` : gradient déterministe via initiales
- `Header` : `mode="public"` (logo + nav + Se connecter) ou `mode="auth"` (logo + nav + avatar utilisateur)
- `Footer` : links Hello Mira + mentions
- `SkillChip` : variant standard + "★ validée" success
- `ClassCard` : card catalogue avec photo + meta + CTA
- `MentorMini` : compact (avatar + nom + rating 1 ligne) — utilisé dans cards class et community
- `SessionCard` : icône type + lieu + dates + places + CTA Postuler
- `PathStepCard` : avec status + class recommandée
- `EmptyState` : icône Lucide + titre + sous-titre + CTA optionnel

## Mocks data (`data.js`)

Contient :
- **5 mentors validés** : Antoine, Marie, David, Sophie, Lucas (matchés sur `test-accounts.md`)
- **3 Mira Class published** : Pitcher pour lever 500k (Antoine, 80 €), UI Design pour SaaS B2B (Marie, 60 €), Growth B2B (David, 49 €)
- **Persona Anna Lopez** : 3 états (early / mid / completed) pour démontrer le profil + parcours
- **Communauté** : Marco Silva, Léa Bauer, Tom Evans, Clara Kovač

→ À remplacer par les fetchs API lors du portage Next.js.

## Tokens design appliqués (`src/tokens.css`)

Couleurs : `--mira-red #E6332A`, `--warm-beige #EFEAE5`, `--charcoal #1D1D1B`, `--muted #888`, `--gold #D4A853`, `--sage-soft #D6E3D0`, `--beige-deep #E2DCD3`, `--success #16A34A`, `--error #EF4444`.
Fonts : Manrope (sans, body) + **Playfair Display (serif assumé)** sur les titres éditoriaux (`.serif` class).

→ Strictement cohérent avec les templates des Groupes A + B et `hackathon/design-system.md`.

## Tweaks panel — outil démo

Le composant `Tweaks` en bas de page permet de switcher entre :
- `personaState` : "early-journey" · "mid-journey" · "completed" — change le rendu de `/me`
- `pathStyle` : "vertical" · "horizontal" — change l'orientation timeline `/me/path`
- `accentIntensity` : "balanced" (default) · "subtle" · "bold" — modifie `--mira-red`

Ces toggles sont des **outils Claude Design** pour itérer sur le design. Lors du portage Next.js, ils sont à supprimer (ou à garder comme dev tool sous flag).

## Comment intégrer dans `web/` (Next.js 16)

1. **Tokens** : copier `src/tokens.css` dans `web/app/globals.css` (variables CSS + atoms). Avec Tailwind v4, mapper en `@theme inline`.
2. **Components** : chaque page JSX a son équivalent Next.js :
   - `Landing.jsx` → `web/app/page.tsx` (Server Component)
   - `Catalogue.jsx` → `web/app/classes/page.tsx` (Server Component, fetch SSR pour SEO)
   - `ClassDetail.jsx` → `web/app/classes/[slug]/page.tsx` (Server Component, fetch SSR)
   - `Me.jsx` → `web/app/me/page.tsx` (Client Component, useState pour édition)
   - `PathGenerate.jsx` → `web/app/me/path/generate/page.tsx` (Client Component, loader pendant call IA)
   - `Path.jsx` → `web/app/me/path/page.tsx` (Server Component pour le data, Client pour interactions)
   - `Apply.jsx` → `web/app/classes/[slug]/apply/page.tsx` (Client Component)
   - `Community.jsx` → `web/app/community/page.tsx` (Server Component)
   - `atoms.jsx` → `web/components/ui/` (réutilisé Groupes A + B si déjà porté)
3. **API** : remplacer les imports de `data.js` par des fetchs réels :
   - Catalogue : `GET /v1/classes?status=published`
   - Détail class : `GET /v1/classes/{slug}` (inclut mentor + modules + sessions)
   - Profil : `GET/PATCH /v1/me`
   - Génération parcours : `POST /v1/me/path/generate` (proxy OpenRouter côté backend, ~10-15 s)
   - Mon parcours : `GET /v1/me/path` (renvoie steps avec class recommandées)
   - Intent inscription : `POST /v1/enrolments` (status=`applied`)
   - Communauté : `GET /v1/community/learners?city=&skill_target=` (apprenants `visibility=public`)
4. **Auth** : wrapper `/me/*` dans middleware Supabase auth
5. **Photos hero** : utiliser un service comme Unsplash Source API (`https://images.unsplash.com/...`) pour la démo
6. **Tweaks panel** : retirer en prod, ou garder sous flag `?dev=1` pour QA

## Limites connues du template (et écarts vs scope)

⚠️ **Manques par rapport au scope BRIEF** :

1. **CV import IA** (nice-to-have BRIEF) — pas câblé dans `PathGenerate.jsx`. Le drop zone PDF est visuel mais pas connecté à OpenRouter pour extraction de skills déjà acquises.
2. **Régénération du parcours** — bouton `↻ Régénérer` présent dans `Path.jsx` mais sans confirmation modal ni historique `student_path_regeneration_log`.
3. **Carte interactive mondiale** dans `/community` — implémenté en mode liste filtrable seulement. Une vraie carte avec markers nécessite library `react-map-gl` ou `maplibre-gl` à intégrer post-hackathon.
4. **Filtres avancés catalogue** (nice-to-have) — prix slider présent, mais pas de filtre par langue, par durée totale, par mentor.

**Autres limites prototype** :
- Pas de validation form, pas de persistance backend (state local React)
- Pas de vrai appel OpenRouter (génération parcours simulée avec timer)
- Photos absentes (à ajouter via Unsplash en production)
- Mobile responsive partiel — désigné desktop-first, à valider responsive sur catalogue + class detail
- Aucun système d'auth réel — le tweak `personaState` simule différents états de Anna

## Prochaines actions Groupe C (J1-J3)

1. **J1 matin** : lecture du template + brief → distribution stories
2. **J1 après-midi** : portage atoms + tokens dans `web/` → Landing + Catalogue en Next.js avec données seed
3. **J2 matin** : ClassDetail + Me + Apply (avec persistance backend `/me` PATCH auto-save)
4. **J2 après-midi** : PathGenerate avec **vrai appel OpenRouter** (call backend qui orchestre la génération du parcours) + Path
5. **J3 matin** : Community + responsive mobile + photos Unsplash intégrées
6. **J3 après-midi** : démo storytelling end-to-end Anna (anonyme → catalogue → inscrit profil → génère parcours → s'inscrit class Antoine)
