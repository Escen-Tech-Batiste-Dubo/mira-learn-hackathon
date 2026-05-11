# Prompt Claude Design — Groupe B — Backoffice mentor (Mira Class)

> Prompt complet à coller dans Claude Design pour générer la maquette du backoffice Mira Class.

---

## CONTEXTE PRODUIT

**Mira Learn** est la plateforme edtech de Hello Mira (digital nomads francophones). Le Groupe A a livré l'onboarding mentor + l'annuaire public. **Le Groupe B livre le backoffice où un Mira Mentor opère sa classe** : créer la structure pédagogique (modules + matériel + QCM), planifier des sessions concrètes (dates + lieu + capacité + waitlist), gérer les candidatures des apprenants.

Tonalité du backoffice : **sobre, productif, clavier-friendly**. Pas l'éditorial chaleureux du front public — ici on est dans la production. Inspiration : **Linear, Notion DB views, Teachable course editor**. Mais on garde les couleurs Mira et les fonts pour la cohérence visuelle.

## DESIGN SYSTEM (REPRISE DU GROUPE A)

### Couleurs Mira (palette exclusive)

| Token | Hex | Usage |
|---|---|---|
| `mira-red` | `#E6332A` | CTA primary, focus, accent éditorial |
| `warm-beige` | `#EFEAE5` | Background page principal |
| `beige-deep` | `#E2DCD3` | Hover surface, chips neutres |
| `charcoal` | `#1D1D1B` | Texte principal |
| `muted` | `#888888` | Texte secondaire, labels |
| `muted-soft` | `#B6B0A6` | Bordures subtiles |
| `rule` | `#E5E7EB` | Bordures cards / inputs |
| `card-bg` | `#FFFFFF` | Surface cards / sidebar |
| `success` | `#16A34A` | Status validated/published |
| `error` | `#EF4444` | Destructive, rejected |
| `gold` | `#D4A853` | Status in_review, badge IA |
| `sage-soft` | `#D6E3D0` | Chips skill primaire |

### Typo + spacing

- **Manrope** (sans, 400/500/600/700) — UI par défaut
- **Playfair Display** (serif, 700) — uniquement titres de page (h1) éditoriaux
- Échelle 4 px, cards radius 16 sans ombre, boutons radius 12 hauteur 44, inputs idem
- Composants : `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-destructive`, `.chip`, `.card`, `.input`, `.status-badge`

## ARBORESCENCE BACKOFFICE

Layout standard : **sidebar gauche persistante 240 px + main content scrollable**.

```
AUTH mentor (role=mentor)
├── /dashboard                       Vue d'ensemble (compteurs + activité récente)
├── /dashboard/classes               Mes classes (liste)
├── /dashboard/classes/{id}          Édition class (overview + tabs)
│   ├── Modules tab                  Liste modules drag/drop + édition
│   ├── Sessions tab                 Liste sessions + création nouvelle
│   └── Enrolments tab               Gestion candidatures apprenants
├── /dashboard/classes/{id}/sessions/new   Création de session
├── /dashboard/quizzes/{id}          Édition QCM avec génération IA
└── /dashboard/profile               Profil mentor (édition fiche publique)
```

## SIDEBAR (présente sur toutes les pages /dashboard/*)

```
┌────────────────────┐
│ Mira LEARN         │
├────────────────────┤
│ ◀ Vue d'ensemble   │
│ ▣ Mes classes (3)  │
│ ◇ Sessions (2)     │
│ ◯ Apprenants (18)  │
│ ▽ QCM (5)          │
├────────────────────┤
│ ⚙ Mon profil       │
│ 👤 Antoine M. ▾    │
└────────────────────┘
```

Largeur 240 px, bg `card-bg`. Items hauteur 36 px. Active state : bg `warm-beige` + barre verticale `mira-red` 3 px à gauche. Icônes Lucide outlined (16 px). Compteurs entre parens en `muted`. Footer : avatar + nom + dropdown (Profil, Déconnexion).

## ÉCRANS À GÉNÉRER (7 ÉCRANS)

### 1. `/dashboard` — Vue d'ensemble

- Header de page : titre `Bonjour Antoine 👋` (Playfair Display 32 px)
- Sous-titre en `muted` : "Voici où en sont tes classes et tes apprenants."

**Stat cards** : 4 cards en row, chacune avec :
- Label en `muted` uppercase (ex. "Classes")
- Valeur grosse 36 px charcoal (ex. "3")
- Sous-label muted (ex. "published")

Cartes : Classes (3 published), Sessions (2 open enrolment), Apprenants (18 inscrits), QCM (5 publiés).

**Section "À traiter"** (card warm-beige) :
- ⚠ icone gold : "3 nouvelles candidatures à examiner" + lien `→ Voir`
- ⏰ icone gold : "1 session démarre dans 3 jours (Barcelone)" + lien `→ Voir`

**Section "Activité récente"** (liste avec timeline dots) :
- Anna Lopez s'est inscrite à "Pitcher pour lever 500k" — il y a 2 h
- Pierre Lambert est passé en waitlist (Pitcher) — il y a 1 j
- Tu as publié le module 2 de "Pitcher pour lever 500k" — il y a 3 j
- Marie Dupont a publié sa class "UI Design pour SaaS B2B" — il y a 5 j

### 2. `/dashboard/classes` — Mes classes (liste)

- Titre `Mes classes` + bouton primary à droite `+ Créer une class`
- Tabs filter par status : `Tous (3)` `Draft (0)` `In review (1)` `Published (1)` `Archived (0)`

**Liste de class cards** (1 par ligne, full width) :

```
┌──────────────────────────────────────────────────────────┐
│ Pitcher pour lever 500k €                  [published]   │
│ 6 sem · live hybride · 80 € · 2 modules · 1 session       │
│ 3 apprenants inscrits · 1 en waitlist                     │
│                                            [Éditer →]    │
├──────────────────────────────────────────────────────────┤
│ UI Design pour SaaS B2B                    [draft]       │
│ Pas encore configurée — 0 module · 0 session              │
│                            [Continuer la configuration →]│
├──────────────────────────────────────────────────────────┤
│ Growth B2B en 8 semaines                   [in_review]   │
│ Soumise il y a 2 j à l'admin                              │
│ 8 modules · 2 sessions                     [Voir →]      │
└──────────────────────────────────────────────────────────┘
```

`status-badge` colorés : draft (beige-deep), in_review (gold), published (success), archived (muted).

### 3. `/dashboard/classes/{id}` — Édition class

Header de page :
- Breadcrumb `← Mes classes`
- Titre h1 (Manrope 32 semibold) "Pitcher pour lever 500k €" + status badge "published"
- Sous-titre muted "Créée il y a 14 jours · 3 apprenants inscrits"

**Tabs horizontaux** sous le titre (border-bottom sur la sélection en mira-red) :
- `Vue d'ensemble` (active)
- `Modules (2)`
- `Sessions (1)`
- `Apprenants (3 + 1 waitlist)`

**Tab Vue d'ensemble** (active par défaut) :

Card 1 — Détails de la class (édition inline) :
- Titre (input)
- Description (textarea markdown)
- Format envisagé : radio (physique / virtuel / hybride)
- Rythme : segmented (weekly / biweekly / monthly_workshop / intensive_weekend / async)
- Skills enseignées : chips éditables (1 primaire en sage-soft)
- Heures collectives + heures individuelles : inputs

Card 2 — Pricing :
- Tarif heure collective + heure individuelle (inputs €)
- Bloc simulation revenu calculé en live (background sage-soft) : revenue brut, frais 25 %, net mentor

Card 3 — Actions :
- Bouton primary `Soumettre à validation admin` (si draft)
- Bouton secondary `Mettre en pause`
- Bouton ghost destructive `Archiver`

### 4. `/dashboard/classes/{id}` — Tab Modules

Liste de modules drag & drop :

```
┌────────────────────────────────────────────────────────┐
│ ≡ 1. Construire le narratif investor                   │
│   3 h · théorie · published                             │
│   1 quiz · 4 ressources                                 │
│   [Édit] [Quiz] [Matériel]                              │
├────────────────────────────────────────────────────────┤
│ ≡ 2. Design + délivery du deck                         │
│   4 h · practice · published                            │
│   0 quiz · 2 ressources                                 │
│   [Édit] [Quiz] [Matériel]                              │
└────────────────────────────────────────────────────────┘
                                       [+ Nouveau module]
```

Drag handle `≡` à gauche, click sur module ouvre édition inline (titre, description markdown, durée, type, status).

### 5. `/dashboard/classes/{id}` — Tab Sessions

**Liste sessions** :

```
┌──────────────────────────────────────────────────────┐
│ 📍 Barcelone, Espagne                                 │
│    5–26 juillet 2026 · type hybride                   │
│    3/8 apprenants · 1 waitlist · status open_enrolment│
│    [Édit] [Gérer apprenants]                          │
└──────────────────────────────────────────────────────┘
                                  [+ Nouvelle session]
```

**Création nouvelle session** (drawer / modal) : type (physique/virtuel/hybride), location (city + country + adresse si physique), online_meeting_provider (Zoom/Meet/LiveKit), dates (starts_at / ends_at / enrolment_deadline), capacité (1-50), waitlist_max_size, prix.

### 6. `/dashboard/classes/{id}` — Tab Apprenants

Tabs filter status : `Tous (4)` `Applied (1)` `Accepted (2)` `Waitlist (1)` `Cancelled (0)`

**Liste d'enrolments** :

```
┌──────────────────────────────────────────────────────────┐
│ ◯ Anna Lopez            [applied] · il y a 2 h           │
│   Designer en transition vers SaaS                        │
│   « Je veux passer du design à la levée. »               │
│                              [Refuser] [Accepter]        │
├──────────────────────────────────────────────────────────┤
│ ◯ Pierre Lambert        [waitlist] · il y a 1 j          │
│   Solo founder, levée seed cible                          │
│                              [Déplacer en active →]      │
├──────────────────────────────────────────────────────────┤
│ ◯ Nora Ahmed            [accepted] · il y a 12 j         │
│   Product manager en reconversion                          │
│                              ✓ Active                     │
└──────────────────────────────────────────────────────────┘
```

Click sur un enrolment → drawer avec détail apprenant + ses skills cibles + commentaire libre du mentor.

### 7. `/dashboard/quizzes/{id}` — Édition QCM (assistant IA)

Header :
- Breadcrumb `← Module "Construire le narratif investor"`
- Titre `Valider le narratif investor` + status badge
- Sous-titre muted : `Passing score : 70 %` · `1 quiz du module · 5 questions`

**Bouton primary haut droite** : `✨ Générer 5 questions avec Mira AI`

**Modal/drawer génération IA** (sur click du bouton) :
- Titre Playfair "Mira AI te génère un QCM"
- Textarea (5 lignes) : "Description / contexte du module + niveau attendu" — prérempli avec la description du module
- Slider : nombre de questions (3 / 5 / 7 / 10)
- Dropdown modèle : `Claude 3.5 Haiku (rapide)` / `Claude 3.5 Sonnet (qualité)`
- Bouton primary `Générer →`
- Loading state : skeleton 5 questions pulsantes (~10 s)

**Liste de questions** (après génération ou édition manuelle) :

```
┌──────────────────────────────────────────────────────────┐
│ Q1. Quel est le bon ordre dans un pitch ?              ✓ │
│  ◯ Solution → Problème → Traction                       │
│  ◉ Problème → Solution → Traction   ← bonne              │
│  ◯ Traction → Problème → Solution                       │
│  ◯ Pitch → Problème → Traction                          │
│                              [Édit] [Supprimer]          │
├──────────────────────────────────────────────────────────┤
│ Q2. La slide 3 d'un pitch deck doit montrer…           ✓ │
│  ◯ Le market size (TAM/SAM/SOM)                          │
│  ◉ La traction (chiffres, MRR, NPS)                      │
│  ◯ L'équipe                                              │
│  ◯ Les concurrents                                       │
│                              [Édit] [Supprimer]          │
└──────────────────────────────────────────────────────────┘
                                       [+ Ajouter une question]
```

Édition inline : enoncé + 4 options + radio "bonne réponse" + explication optionnelle.

Footer du quiz : bouton `Publier ce QCM` (primary, désactivé si moins de 3 questions).

## VOICE & TONE (UX WRITING)

- **Tutoiement FR** partout (sauf labels admin formels)
- **Direct + concret** : "Publie ce QCM", pas "Procéder à la publication du questionnaire"
- **Vocabulaire** : Mira Class (pas "cours"), modules, sessions, apprenants, skills, QCM (pas quiz tout court)
- **Empty states** : "Aucun module pour l'instant. Commence par poser la structure de ta class." + bouton CTA
- **Toasts** :
  - Sauvegarde auto : "Modifications enregistrées il y a 2 s" (en bas, muted)
  - Action ponctuelle : "QCM publié ✓" (toast en haut à droite, dismiss 4 s)
- **Confirmation destructive** : "Supprimer cette question ? Tu ne pourras pas la récupérer." [Annuler] [Confirmer]

## PERSONAS CONNECTÉS (pour la maquette)

Le user logué est **Antoine Martin** (mentor star, sa class flagship "Pitcher pour lever 500k €" est l'exemple type pour la démo). Avatar AM gradient warm rouge → or.

Apprenants candidats sur sa session Barcelone (à afficher dans Tab Apprenants) :
- **Anna Lopez** (applied il y a 2 h) — motivation "Je veux passer du design à la levée"
- **Pierre Lambert** (waitlist il y a 1 j) — solo founder, levée seed cible
- **Nora Ahmed** (accepted il y a 12 j) — product manager en reconversion

Autres classes du mentor (à lister dans `/dashboard/classes`) :
- "Pitcher pour lever 500k €" — published — flagship démo
- "UI Design pour SaaS B2B" — draft — pas encore configurée
- "Growth B2B en 8 semaines" — in_review

## INSPIRATIONS SPÉCIFIQUES B

| Source | Quoi piquer |
|---|---|
| Linear (`linear.app`) | Sidebar productive + raccourcis clavier + sobriété backoffice |
| Notion DB views | Tableau classes : tri/filtre clair, actions inline |
| Teachable course editor | Liste modules drag/drop simple, édition inline |
| Notion AI generate | UX du prompt → loading skeleton → preview → accept |
| Stripe Dashboard | Stat cards en haut de page + activité récente |
| Linear command-K | Recherche globale (optionnel) |

## CONTRAINTES TECH

- Le code généré sera intégré en **Next.js 16 + Tailwind v4 + shadcn/ui** (Button, Input, Card, Badge, Avatar, Tabs, DropdownMenu, Dialog, Sheet, RadioGroup)
- **Desktop prioritaire** : le backoffice peut rester desktop-only (largeur min 1280)
- **FR uniquement**
- Le composant `<RevenueSimulator>` du Groupe A (`MiraAI.jsx` n'est pas réutilisé ici) est ré-implémenté pour la card Pricing
- **Auto-save** simulé partout (toasts discrets)

## DEMANDE FINALE

Génère **les 7 écrans backoffice listés** avec :

- **Sidebar persistante 240 px** sur toutes les pages `/dashboard/*` (navigation cohérente)
- **Cohérence avec le Groupe A** : mêmes tokens, mêmes atoms (Avatar, Logo, StatusBadge, Chip) — au pixel près
- **Densité backoffice** : plus dense que le front public, lignes plus serrées, moins d'espace blanc
- **Loading states** explicites pour la génération IA du QCM (skeleton pulse, pas spinner)
- **Edit-in-place** partout (pas de page d'édition séparée)
- **Drag & drop** sur la liste de modules (avec handle visible `≡`)
- **Privilégie le pattern Linear / Notion** : keyboard-friendly, lignes hover, actions à droite révélées au hover

Une fois la maquette générée, montre-moi un récap des 7 écrans avec leurs routes + indique quelles parties seraient réutilisées tel quel par le Groupe C (catalogue apprenant).
