# Prompt Claude Design — Groupe A — Mira Mentors

> Copier-coller ce prompt dans Claude Design pour générer la maquette du groupe A.

---

## CONTEXTE PRODUIT

**Mira Learn** est la plateforme edtech de **Hello Mira**, une marque qui s'adresse aux **digital nomads** francophones. Tonalité : chaleureuse, éditoriale, premium mais accessible. Pas corporate, pas gamifié naïf. Mira est un compagnon de voyage exigeant.

Je conçois les écrans du **Groupe A** — la porte d'entrée côté offre : front public pour découvrir les Mira Mentors validés, tunnel de candidature pour qu'un nomade postule comme mentor, et backoffice admin pour modérer les candidatures.

## CE QU'IL FAUT GÉNÉRER (5 écrans)

### 1. `/mentors` — Annuaire public des mentors
- Header sobre avec logo "Mira LEARN" + nav (Mentors, Catalogue) + CTA "Devenir mentor"
- Hero éditorial : "Apprends auprès de mentors qui ont fait le chemin" (Playfair Display, large) + sous-titre court
- Filtres en chips : catégorie (Business, Design, Tech, Soft, Lifestyle), skill, tri (rating ↓, classes ↓, alphabétique)
- Grid 3 colonnes de **mentor cards** :
  - Avatar rond (utiliser des photos chaleureuses de digital nomads, pas corporate)
  - Nom + headline (1 ligne)
  - Rating étoile dorée + nb avis + nb classes
  - 2-3 skill chips (la principale en chip "primary" sage clair, les autres en beige)
  - Bouton secondary "Voir le profil →"

### 2. `/mentors/{slug}` — Fiche détail mentor
- Breadcrumb "← Retour à l'annuaire"
- Hero : avatar large + nom (Playfair Display) + headline + rating + boutons LinkedIn / site perso
- Sections :
  - **À propos** : 3-4 paragraphes markdown
  - **Skills enseignées** : chips
  - **Parcours** : timeline avec date range + role + company
  - **Classes proposées** : card avec titre + prix + format + capacité + bouton "Découvrir"

### 3. `/mentors/apply` — Formulaire de candidature (long form)
- Page tunnel single page (pas wizard)
- Titre Playfair Display "Devenir Mira Mentor" + sous-titre rassurant "3 minutes pour soumettre ta candidature"
- Sections collapsibles : Identité (display_name, slug auto, LinkedIn, site), Expertise (bio courte 255c + bio longue markdown + skills 3 min + 1 primaire), Parcours (timeline éditable), CV (drop zone PDF avec mention "L'IA extraira tes skills"), Motivation (textarea max 2000c)
- Footer : Annuler (ghost) + Soumettre la candidature (primary)

### 4. `/admin/applications` — Liste backoffice
- Header admin "Mira LEARN · admin"
- Titre "Candidatures mentors" + compteur
- Onglets segmentés par status : Toutes / Submitted / In review / Validated / Rejected (badges colorés)
- Liste de candidatures (1 par ligne) :
  - Avatar petit + nom + status badge + tag "✨ CV importé" si applicable
  - Headline en muted
  - Timestamp relatif (il y a 2h)
  - Click → détail

### 5. `/admin/applications/{id}` — Détail candidature avec décision
- Breadcrumb "← Toutes les candidatures"
- Header : avatar + nom + headline + status badge à droite
- Sections : Bio longue, Skills proposées (chips), Parcours timeline, Motivation (en blockquote italique avec barre miraRed à gauche), Pièces jointes (CV avec mention "Skills extraites par IA")
- Bloc décision en bas : textarea commentaire privé + 3 boutons : ✗ Refuser (destructive), ↻ En examen (secondary), ✓ Valider Emma comme mentor (primary)

## DESIGN SYSTEM (TOKENS À RESPECTER)

### Couleurs (palette Mira — usage exclusif)

| Token | Hex | Usage |
|---|---|---|
| `mira-red` | `#E6332A` | CTA principal, accents éditoriaux, logo, focus borders, étoile rating sur hover |
| `warm-beige` | `#EFEAE5` | Background page (toutes les pages) |
| `beige-deep` | `#E2DCD3` | Chips neutres, hover surface |
| `charcoal` | `#1D1D1B` | Texte principal, foreground |
| `muted` | `#888888` | Texte secondaire, labels, timestamps |
| `muted-soft` | `#B6B0A6` | Bordures subtiles |
| `rule` | `#E5E7EB` | Bordures cards + inputs |
| `card-bg` | `#FFFFFF` | Surface cards, modals, surfaces élevées |
| `success` | `#16A34A` | Validation, status "validated" |
| `error` | `#EF4444` | Status "rejected", bouton destructive |
| `gold` | `#D4A853` | Étoiles rating, badges premium |
| `sage-soft` | `#D6E3D0` | Chips "skill primaire" |

**Ne pas inventer** d'autres couleurs (pas de purple, teal, neon). Si tu as besoin d'un statut, mappe-le sur l'existant.

### Typographie

- **Manrope** (sans-serif, 400/500/600/700) — UI par défaut (body, labels, boutons, navigation)
- **Playfair Display** (serif, 400/700) — uniquement titres éditoriaux (h1 hero, h2 fiche mentor, titres de page)

Tailles indicatives : hero h1 56px Playfair / page h1 36px / section h2 24px / card title 16px semibold / body 14px / caption 12px muted.

### Spacing & radius

- Échelle 4 px (gap-3 = 12px, p-6 = 24px, mb-12 = 48px)
- Cards : padding 24px, radius 16px
- Boutons : radius 12px, hauteur fixe 44px (touch-friendly desktop + mobile)
- Chips : radius full, padding 4×10
- Inputs : radius 12px, padding 12×16, border 1px rule, focus border 2px miraRed

### Composants

- **Boutons** : primary (miraRed bg, white text), secondary (white bg, charcoal text, border muted-soft), ghost (transparent, miraRed text), destructive (error red bg)
- **Cards** : bg blanc sur fond beige, border `rule`, radius 16, padding 24. **Pas d'ombre** (Mira est flat sauf modals).
- **Chips status** : submitted (jaune doux), in_review (bleu doux), validated (vert success doux), rejected (rouge error doux). Texte foncé sur fond clair.
- **Avatar** : rond, gradient subtil 2 tons (pas de photos stock corporate). Initiales du nom en blanc semi-bold.

### Iconographie

- Lucide icons uniquement (outlined, stroke 1.5)
- Pas d'emoji décoratifs (sauf 📎 pour attachment, 📍 pour location)

## VOICE & TONE (UX WRITING)

- **Tutoie** toujours en FR (pas de "vous")
- **Direct** : "Inscris-toi", pas "Veuillez procéder à votre inscription"
- **Concret** : "Construis ton deck investor en 6 semaines", pas "Une expérience transformative"
- **Vocabulaire** : Mira Mentor (pas coach / expert / teacher), Mira Class (pas cours / formation), apprenant ou nomade (pas étudiant / utilisateur), skill (pas compétence dans les chips), parcours (pas learning path)

### Exemples textes ✅
- Page titre annuaire : "Apprends auprès de mentors qui ont fait le chemin"
- Bouton CTA candidature : "Devenir mentor"
- Toast après submit : "On a bien reçu ta candidature. Tu seras notifié sous 48 h."
- Empty state liste candidatures : "Aucune candidature pour l'instant. Calme avant la tempête."

## CONTENU RÉALISTE (PERSONAS À UTILISER)

### Mentors validés (à afficher dans annuaire)

| Initiales | Nom | Headline | Rating | Classes | Skills |
|---|---|---|---|---|---|
| AM | Antoine Martin | Pitch investor + funding strategist | 4.8 (47) | 12 | Pitch investor (primary), Funding, Public speaking |
| MD | Marie Dupont | UI Designer + Webflow master | 4.7 (38) | 9 | UI Design (primary), Figma |
| DC | David Cohen | Growth Marketing B2B | 4.6 (52) | 15 | Growth B2B (primary), Lean Canvas |
| SB | Sophie Bernard | Lean Startup + Business Model Canvas | 4.5 (29) | 7 | Lean Canvas (primary), Business model |
| LG | Lucas Garcia | Product Manager + UX research | 4.3 (11) | 3 | UI Design (primary) |

### Candidatures à afficher dans backoffice

| Initiales | Nom | Status | Headline | Détail |
|---|---|---|---|---|
| ER | Emma Rossi | submitted (il y a 2h) | Designer brand + content créatrice DTC | Bio : ex-Stripe, founder Brand Studio 200K€ ARR |
| NK | Nathan Kim | submitted (il y a 1h, ✨ CV importé) | Tech Lead → CTO startup | Bio : 10 ans tech, ex-Doctolib |
| CD | Chloé Dubois | in_review (il y a 3j) | Sales B2B + closing négociation | Bio : 50M€ closed, ex-Salesforce |
| PW | Paul Weiss | rejected (il y a 5j) | Coach perso | Refusé : expertise insuffisamment documentée |

### Fiche détail à utiliser : Antoine Martin

- Bio : "Ex-VC, 10 ans à accompagner des fondateurs vers leur première levée. J'aide mes apprenants à construire un narratif investor qui résiste au Q&A, à structurer leur deck pour donner envie en 2 minutes, et à comprendre les attentes réelles d'un fonds amorçage français."
- Parcours :
  - 2022-2024 — Partner @ Eutopia Ventures (Paris)
  - 2018-2022 — Director Investments @ Daphni (Paris)
  - 2014-2018 — Associate @ Idinvest Partners (Paris)
- Class proposée : "Pitcher pour lever 500k €" — 80 € — live hybride — 5-8 personnes — 2 modules

## INSPIRATIONS VISUELLES

- **Toptal** (`toptal.com`) — fiche mentor claire avec avatar + skills + CTA "book"
- **Maven** (`maven.com`) — catalogue éditorial chaleureux avec photos
- **Linear settings** (`linear.app`) — backoffice sobre clavier-friendly
- **YC application form** — tunnel single page, pas wizard intempestif
- **Notion** — densité de liste backoffice, hover states subtils

## CONTRAINTES TECHNIQUES (POUR INFO)

- Le code généré sera intégré dans une app **Next.js 16 + Tailwind v4 + shadcn/ui** (composants base : Button, Input, Card, Badge, Avatar, Tabs)
- Layout responsive : desktop prioritaire (annuaire grid 3 col → mobile 1 col), backoffice peut rester desktop-only
- Pas d'i18n EN — **FR uniquement**
- Pas d'animations complexes — transitions subtiles uniquement (hover transform, opacity)

## DEMANDE FINALE

Génère-moi les **5 écrans listés ci-dessus** avec le design system Mira appliqué. Privilégie une cohérence forte inter-écrans (mêmes composants, même densité, même grid). Si tu hésites entre plusieurs options, montre-moi la version la plus **chaleureuse et éditoriale** (pas la version corporate SaaS générique). Mira doit donner envie de prendre un café avec un mentor à Lisbonne, pas de remplir un formulaire RH.
