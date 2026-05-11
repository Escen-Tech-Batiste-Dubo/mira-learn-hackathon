# Template Mira Mentors — Groupe A

Maquette interactive React générée via Claude Design, livrée dans `design/template/`. Elle couvre les 6 écrans clés du parcours mentor (public + tunnel + backoffice) et sert de **référence visuelle + base de code** pour le Groupe A.

> Source : prompts conservés dans `design/template/uploads/` pour traçabilité.
> **Version actuelle** : v2 — `MentorsDirectory` repositionné en page de recrutement mentor (hero "Rejoins les Mira Mentors · finance tes voyages grâce à ton expérience" + CTA `Candidater comme mentor` au lieu d'un simple annuaire pour apprenants).

## Comment l'ouvrir

Le template est un **prototype React standalone** (pas Next.js) qui tourne directement dans le navigateur via React UMD + Babel standalone (pas de build step).

```bash
cd hackathon
python3 -m http.server 8765
# Puis ouvrir : http://localhost:8765/group-a-mentor/design/template/Mira%20Mentors.html
```

Un **router bas de page** (sticky dark bar) permet de naviguer entre les écrans pour la démo / revue design. Les routes sont aussi accessibles via `#hash` (`#apply`, `#mentor:antoine-martin`, `#applications`, etc.).

## Arborescence

```
template/
├── Mira Mentors.html             Point d'entrée — bootstrap React + router #hash + scripts JSX
├── styles.css                    Design tokens Mira (couleurs, fonts, atoms : btn, chip, card, input)
├── assets/
│   ├── hellomira.svg             Logo wordmark Hello Mira
│   └── hmira.svg                 Mark seul (icône)
├── components/
│   ├── shared.jsx                Atoms réutilisés : Avatar gradients, Stars, Logo, Nav, Footer
│   ├── data.jsx                  Mocks personas (mentors validés, candidatures, fiche Antoine)
│   ├── MentorsDirectory.jsx      Écran 1 — /mentors (annuaire public)
│   ├── MentorDetail.jsx          Écran 2 — /mentors/{slug} (fiche détail)
│   ├── MentorsApply.jsx          Écran 3 — /mentors/apply (tunnel 7 steps)
│   ├── MyApplication.jsx         Écran 4 — /mentors/my-application (step 8 : suivi état)
│   ├── AdminApplications.jsx     Écran 5 — /admin/applications (backoffice liste)
│   ├── AdminApplicationDetail.jsx Écran 6 — /admin/applications/{id} (décision)
│   └── MiraAI.jsx                Composant : panneau "Mira AI te propose" + Coach sidebar
└── uploads/                      Prompts d'origine utilisés pour générer le template
    ├── claude-design-prompt.md
    └── claude-design-prompt-ai-assistant.md
```

## Mapping écrans → composants → routes BRIEF

| BRIEF | Composant template | Route prototype | Route prod (Next.js) |
|---|---|---|---|
| Annuaire public | `MentorsDirectory.jsx` | `#mentors` | `/mentors` |
| Fiche détail mentor | `MentorDetail.jsx` | `#mentor:antoine-martin` | `/mentors/{slug}` |
| Tunnel candidature 7 steps | `MentorsApply.jsx` | `#apply` | `/mentors/apply` |
| Suivi état candidature | `MyApplication.jsx` | `#my-application` | `/me/application` |
| Backoffice liste | `AdminApplications.jsx` | `#applications` | `/admin/applications` |
| Backoffice détail | `AdminApplicationDetail.jsx` | `#app:emma-rossi` | `/admin/applications/{id}` |

## Détail `MentorsDirectory.jsx` (v2 — page recrutement mentor)

Contrairement à un annuaire neutre, cette page **s'adresse au candidat mentor**, pas à l'apprenant qui cherche un cours :

- Hero éditorial Playfair Display : "Rejoins la communauté des Mira Mentors et **finance tes voyages grâce à ton expérience**"
- Sous-titre orienté offre : "Transmets ce que tu sais faire à d'autres nomades, en petit groupe, depuis là où tu es. **Mira AI t'aide à structurer ta première masterclass en quelques minutes.**"
- **Double CTA** : bouton primary `Candidater comme mentor →` + lien ghost `Découvrir les mentors actuels ↓` (anchor vers la liste plus bas)
- Eyebrow : "Mira Mentors · Rejoins les N mentors validés"
- **Plus bas** : section avec filtres + grid des mentors validés (Antoine, Marie, David, Sophie, Lucas) — sert de preuve sociale, pas de moteur de recherche

Le mapping reste : front public Groupe A = porte d'entrée recrutement mentor (le catalogue côté apprenant est dans le Groupe C).

## Détail du tunnel `MentorsApply.jsx` (le plus gros composant, ~900 lignes)

Implémente le parcours **7 steps en single page** avec persistance d'état local React (`useState`) :

1. **Step 1 — Identité** : first_name, last_name, nomad_since_year, prior_masterclasses_count (segmented)
2. **Step 2 — Méthode** : 3 cards LinkedIn / CV / Manuel (sélection exclusive)
3. **Step 3.1 — Ingestion** : état transitoire avec skeleton pulse + extraction simulée
4. **Step 3.2 — Profil pro** : expériences (drag handle), skills chips, bio courte/longue, transmission pitch
5. **Step 4 — Suggestions classes** : 3 cards générées par `MiraAI.SuggestionsPanel` (adopt / modify / reject + regenerate + "proposer la mienne")
6. **Step 5 — Format + rythme + villes** : durée collective/individuelle, radio rythm (5 options), radio format, city multi-select
7. **Step 6 — Simulation revenu** : 3 inputs (€/h collective, €/h individuelle, capacité) + bloc simulation calculé en live (marge 25 %)
8. **Step 7 — Récap + submit** : 3 cards résumé + checkboxes conditions + bouton primary "Soumettre"

L'écran 8 du flow (suivi état post-submit) vit dans `MyApplication.jsx` parce qu'il a sa propre route `/me/application` et son propre cycle de vie.

Composant `WizardProgress` (dots + labels) en haut, `WizardFooter` (← Retour, "Brouillon enregistré", Continuer →) sticky en bas. Auto-save simulé à chaque modif.

## Composant `MiraAI.jsx`

Exporte 2 widgets utilisés dans `MentorsApply.jsx` :

- **`SuggestionsPanel`** : 3 suggestion cards générées (mock) avec demand signal coloré (🔥 mira-red / 👥 gold / 🌱 muted), boutons Adopter / Modifier / Pas pour moi. Quand toutes rejetées : bouton "Regénérer 3 nouvelles".
- **`CoachSidebar`** : sidebar fixe 320px (desktop), avatar Mira gradient, bulles de conseil contextuelles selon la step active (bio / parcours / motivation / pré-submit). Toggle on/off via prop.

## Composant `shared.jsx`

Atoms réutilisés dans tout le template :
- `Logo` (wordmark Mira + sous-label LEARN)
- `Nav` (header public + variante admin)
- `Footer`
- `Avatar` (rond, gradient déterministe basé sur initiales — `gradFor(initials)`)
- `Stars` (rendu de rating gold)
- Petits utilitaires CSS (timeago, formatCurrency)

## Data mocks (`data.jsx`)

Contient :
- `MENTORS_VALIDATED` : 5 mentors (Antoine, Marie, David, Sophie, Lucas) avec rating + skills + headlines
- `APPLICATIONS` : 4 candidatures (Emma submitted, Nathan submitted avec CV, Chloé in_review, Paul rejected)
- `ANTOINE_DETAIL` : fiche complète d'Antoine (bio, parcours timeline, classes proposées) — utilisée par `MentorDetail`

Tous les personas matchent `hackathon/contracts/test-accounts.md`. Quand on intègre dans `web/` Next.js, ces mocks sont remplacés par les appels API → `GET /v1/mentors`, `GET /v1/me/application`, etc.

## Tokens design appliqués (`styles.css`)

Couleurs : `--mira-red #E6332A`, `--warm-beige #EFEAE5`, `--charcoal #1D1D1B`, `--muted #888`, `--gold #D4A853`, `--sage-soft #D6E3D0`, `--beige-deep #E2DCD3`, success / error.
Fonts : Manrope (sans, body) + Playfair Display (serif, titres hero) via Google Fonts.
Composants atomiques pré-stylés : `.btn-primary` / `.btn-secondary` / `.btn-ghost`, `.chip` (variants : `chip-primary`, `chip-status-*`), `.card`, `.input`.

→ Tous **cohérents avec `hackathon/design-system.md`**.

## Comment intégrer dans `web/` (Next.js 16)

Le template est un prototype, pas le code final. Pour basculer en code de production :

1. **Tokens** : copier `template/styles.css` (variables CSS + atoms) dans `web/app/globals.css` (Tailwind v4 `@theme inline` ou CSS custom). Déjà en place dans `template/frontend/` du hackathon.
2. **Components** : chaque `.jsx` du template a son équivalent en composant React dans `web/components/`. Convertir :
   - `MentorsDirectory.jsx` → `web/app/mentors/page.tsx` (Server Component, fetch SSR)
   - `MentorDetail.jsx` → `web/app/mentors/[slug]/page.tsx`
   - `MentorsApply.jsx` → `web/app/mentors/apply/page.tsx` (Client Component, useState)
   - `MyApplication.jsx` → `web/app/me/application/page.tsx`
   - `Admin*.jsx` → `web/app/admin/applications/...`
   - `MiraAI.jsx` → `web/components/mira-ai/` (panneau + coach sidebar)
   - `shared.jsx` → `web/components/ui/` (Logo, Nav, Footer, Avatar, Stars)
3. **API** : remplacer les imports de `data.jsx` par des fetchs réels :
   - Annuaire : `GET /v1/mentors` → `MentorRead[]`
   - Détail : `GET /v1/mentors/{slug}` → `MentorPublic`
   - Création/édition candidature : `POST/PATCH /v1/me/application`
   - Suggestions IA : `POST /v1/me/application/suggestions` (call OpenRouter côté backend)
4. **Auth** : wrapper les routes `/me/*` et `/admin/*` dans le middleware Supabase auth (cf. `template/frontend/hooks/useAuth.ts` du hackathon)
5. **Validation** : utiliser shadcn/ui `Form` + `react-hook-form` + `zod` pour valider chaque step du tunnel (les contracts Pydantic du backend serviront de référence).

## Limites connues du template

- **Pas de validation form** : aucun champ obligatoire en mode prototype, on passe d'une step à l'autre sans contrôle. À renforcer en prod.
- **Pas de persistance backend** : tout vit en mémoire React, refresh perd l'état. À remplacer par `PATCH /v1/me/application` auto-save.
- **Pas de call OpenRouter** : les suggestions de classes sont hardcodées (Emma → 3 suggestions brand/Webflow/content). En prod, le backend appelle OpenRouter avec les skills + `skill_demand_aggregate` pour générer dynamiquement.
- **CV/LinkedIn ingestion** simulée : skeleton + valeurs hardcodées. En prod : upload Supabase Storage + parsing PDF + call OpenRouter.
- **Pas de redirect router-based** : la step active est en state local au composant `MentorsApply`. En prod, chaque step a son URL `/mentors/apply/step-N` pour partage / reprise de session.

## Prochaines actions Groupe A

1. **J1 matin** : lecture du template + brief → alignement sur le découpage des stories.
2. **J1 après-midi** : portage des atoms (`shared.jsx` + `styles.css`) dans `web/` → vérifier que `MentorsDirectory` se rend en Next.js avec données mockées.
3. **J2** : tunnel candidature step par step (focus auto-save + validation step 1).
4. **J3 matin** : intégration backend (call FastAPI pour persister chaque step + OpenRouter pour suggestions).
5. **J3 après-midi** : démo end-to-end Emma → admin valide en live.
