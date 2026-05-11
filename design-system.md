# Design system Mira Learn — référence partagée hackathon

Document partagé par les 4 groupes pour assurer la cohérence visuelle entre :
- Front public mentor (groupe A)
- Backoffice mentor (groupe B)
- Front public apprenant (groupe C)
- App mobile Flutter (groupe D)

---

## 1. Identité visuelle Mira

> **Tonalité** : chaleureuse, éditoriale, premium mais accessible. Pas corporate, pas gamifié naïf. Mira est un compagnon de voyage exigeant.

### Couleurs (tokens)

| Token | Hex | Usage |
|---|---|---|
| `miraRed` | `#E6332A` | Couleur de marque, accents CTA, accent éditorial |
| `warmBeige` | `#EFEAE5` | Background principal (toutes les pages) |
| `charcoal` | `#1D1D1B` | Texte principal, foreground |
| `muted` | `#888888` | Texte secondaire, labels, captions |
| `mutedSoft` | `#B6B0A6` | Bordures subtiles, séparateurs |
| `beigeDeep` | `#E2DCD3` | Hover state sur surface beige, hover cards |
| `cardBg` | `#FFFFFF` | Cards, modals, surfaces élevées |
| `rule` | `#E5E7EB` | Bordures de cards, inputs |
| `success` | `#16A34A` | Validation, skill validée, état "completed" |
| `error` | `#EF4444` | Erreurs, validation manquante |
| `gold` | `#D4A853` | Achievements, badges premium, stars |
| `pastelSage` | `#A8C5A2` | Tags "in progress", chips secondaires |

⚠️ **Ne pas inventer** d'autres couleurs. Si vous avez besoin d'un teal ou d'un purple, demandez au mentor HLMR.

### Typographie

| Famille | Usage |
|---|---|
| **Manrope** (sans-serif, 400/500/600/700) | Default UI : labels, body, boutons, navigation |
| **Playfair Display** (serif, 400/700) | Titres éditoriaux, hero h1, citations |

Hiérarchie type recommandée :

| Style | Famille | Taille | Weight | Usage |
|---|---|---|---|---|
| `displayHero` | Playfair Display | 48-56 | 700 | Hero landing, titre dashboard |
| `displayLarge` | Manrope | 36 | 700 | Page title secondaire |
| `headlineMedium` | Manrope | 24 | 700 | Section title (h2) |
| `titleMedium` | Manrope | 16 | 600 | Card title, label fort |
| `bodyMedium` | Manrope | 14 | 400 | Body par défaut |
| `bodySmall` | Manrope | 12 | 400 | Captions, footnotes, muted |

### Spacing (Tailwind v4 / Flutter SizedBox)

Échelle 4px : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

- `p-4` (16px) = padding card par défaut
- `gap-3` (12px) = spacing inter-éléments dans une row/column
- `mb-6` (24px) = espacement entre sections d'une page
- `mb-12` (48px) = espacement entre blocs majeurs d'une page

### Radius

- `rounded-lg` (12px) = inputs, boutons
- `rounded-xl` (16px) = cards, modals
- `rounded-full` = avatars, badges, chips

### Élévations / shadows

⚠️ Mira est **flat** par défaut. **Pas d'ombres lourdes**. Les surfaces sont distinguées par leur bg, pas leur shadow.

- `shadow-none` partout par défaut
- `shadow-sm` autorisé sur modal / popover / dropdown uniquement

---

## 2. Composants partagés (shadcn/ui + custom)

### Boutons

| Variante | Bg | Texte | Usage |
|---|---|---|---|
| `primary` | `miraRed` | white | CTA principal, "S'inscrire", "Soumettre" |
| `secondary` | `cardBg` + border `mutedSoft` | `charcoal` | Action secondaire, "Modifier" |
| `ghost` | transparent | `miraRed` | Action discrète, "Annuler" |
| `destructive` | `error` | white | "Supprimer", "Refuser" |

Hauteur fixe : 44px (mobile + desktop pour cohérence touch).

### Cards

- Bg `cardBg` (#FFF) sur fond `warmBeige`
- Border `1px solid rule` (#E5E7EB)
- Radius `xl` (16px)
- Padding `24px` (p-6) par défaut
- **Pas de shadow**

### Inputs

- Bg `cardBg` (#FFF) sur fond `warmBeige`
- Border `1px solid rule` au repos
- Border `2px solid miraRed` au focus
- Hauteur 44px
- Padding horizontal 16px

### Chips / Tags

- Background subtle (`beigeDeep` ou `sageSoft`)
- Texte `charcoal` 12px medium
- Radius `full`
- Padding 6px x 12px

### Skill chip

Token réutilisable pour afficher une skill (utilisé par A, B, C, D) :

```
[ Pitch investor ]   ← bg beigeDeep, text charcoal, radius full
[ ★ Pitch investor ] ← variante validée : icon star + bg pastelSage
```

### États vides (empty states)

- Icon line-art 48px en `muted`
- Titre `titleMedium`
- Sous-titre `bodyMedium` en `muted`
- CTA primary si action possible

Pattern courant : "Aucun X pour l'instant. Commence par Y."

---

## 3. Patterns d'interface

### Layout standard page front (groupes A, C)

```
┌─────────────────────────────────────────────────────────┐
│  Header (logo Mira + nav + avatar)         [warmBeige]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Container max-w-6xl mx-auto px-6 py-12                  │
│  ┌────────────────────────────────────────────────┐     │
│  │  Hero / Titre page                             │     │
│  │                                                 │     │
│  │  Section 1 (cards row)                          │     │
│  │  Section 2 (list / grid)                        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Footer minimal (links + copyright)                      │
└─────────────────────────────────────────────────────────┘
```

### Layout backoffice (groupe B)

```
┌──────────────────────────────────────────────────────────┐
│  Top bar : logo + user menu                              │
├─────────────┬────────────────────────────────────────────┤
│             │                                             │
│  Sidebar    │  Main content                              │
│  - Classes  │  ┌─────────────────────────────────────┐  │
│  - Sessions │  │  Page title + actions             │  │
│  - Apprenan │  │                                    │  │
│  - QCM      │  │  Content (tables, forms, cards)   │  │
│             │  │                                    │  │
│             │  └─────────────────────────────────────┘  │
└─────────────┴────────────────────────────────────────────┘
```

### Layout mobile (groupe D)

```
┌─────────────────────┐
│  AppBar (titre)     │
├─────────────────────┤
│                     │
│  Content scrollable │
│  (ListView, Cards)  │
│                     │
│                     │
├─────────────────────┤
│ [📚][📖][✨][👤]    │  Bottom nav (4 tabs)
└─────────────────────┘
```

---

## 4. Voice & tone (UX writing)

### Voice

- **Direct** : "Inscris-toi", pas "Veuillez procéder à votre inscription"
- **Chaleureux** : "Tu" partout (pas de "Vous" sauf back office admin)
- **Concret** : "1h de pitch avec Antoine, le 7 juillet à Barcelone", pas "Une expérience d'apprentissage transformative"
- **Cinq sens** : décrire ce qui se passe, pas le mécanisme

### Exemples ✅ / ❌

| ❌ | ✅ |
|---|---|
| "Soumission de la candidature en cours" | "On enregistre ta candidature…" |
| "Une erreur s'est produite" | "Hmm, on n'a pas réussi à enregistrer. Réessaie ?" |
| "Veuillez compléter les champs obligatoires" | "Il manque le nom et l'email" |
| "Mira Class published" | "C'est publié, ta class est visible" |

### Vocabulaire Mira (à utiliser)

- **Mira Mentor** (pas "coach", "expert", "teacher")
- **Mira Class** (pas "cours", "formation")
- **Apprenant** ou **nomade** (pas "élève", "étudiant", "utilisateur")
- **Skill** (pas "compétence" pour les chips — "skill" est notre vocabulaire interne)
- **Parcours** (pas "learning path" en français)
- **Session** (l'instance datée d'une class)
- **Cohorte** (les apprenants d'une même session — usage interne, pas exposé front)

---

## 5. Iconographie

### Source

- **Web** : [Lucide icons](https://lucide.dev) (default shadcn/ui) — line-art, stroke 1.5
- **Mobile Flutter** : Material Icons `_outlined` variant (cohérence visuelle)

### Règles

- Toujours en `outlined` variant (jamais filled sauf hover/active state)
- Stroke 1.5px par défaut
- Couleur : `charcoal` au repos, `miraRed` au focus / actif

---

## 6. États (loading, empty, error)

### Loading

- Skeleton boxes (bg `beigeDeep`, animation pulse) — préféré aux spinners
- Spinner `CircularProgressIndicator` en `miraRed` uniquement pour les actions courtes (< 2s)

### Empty

- Layout : icon line-art 48px + titre + sous-titre + CTA optionnel
- Centré dans la zone, padding 48px vertical

### Error

- Toast en haut à droite (auto-dismiss 5s)
- Bg `error`, texte blanc
- Pas d'alert() ni modal bloquante

---

## 7. Cohérence inter-groupes (checklist mentor)

Avant J3 18h, chaque groupe doit avoir :

- [ ] Couleurs Mira utilisées uniquement depuis les tokens (pas de hex custom)
- [ ] Fonts Manrope + Playfair installées et utilisées
- [ ] Spacing échelle 4 respecté
- [ ] Boutons hauteur 44px partout
- [ ] Cards sans shadow, border `rule`
- [ ] Voice "tu" en FR
- [ ] Pas d'i18n EN
- [ ] Iconographie Lucide / Material outlined uniquement

Un pass design system de 30 min par groupe est prévu J2 18h avec un référent designer HLMR.

---

## Références

- `fronts/book-web/app/globals.css` — source de vérité prod pour les couleurs
- `mobile/packages/mira_ui/lib/src/tokens/mira_colors.dart` — équivalent Flutter
- `mobile/packages/mira_ui/lib/src/theme/mira_theme.dart` — ThemeData référence
