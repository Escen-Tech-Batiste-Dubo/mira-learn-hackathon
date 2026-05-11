# Prompt Claude Design — Groupe D — Mira Learn Mobile

> Prompt complet à coller dans Claude Design pour générer les **maquettes visuelles mobile** servant de référence aux développeurs Flutter du Groupe D.

---

## CONTEXTE PRODUIT

**Mira Learn** est la plateforme edtech de Hello Mira (digital nomads francophones). Les Groupes A, B, C livrent l'expérience web (offre + backoffice + front apprenant). **Le Groupe D livre l'app mobile compagne** (iOS + Android via Flutter) utilisée au quotidien par l'apprenant en café à Bali ou en coworking à Lisbonne pour : suivre ses classes, **prendre des notes pendant les modules**, **laisser une IA organiser ces notes par concept**, faire des QCM, et voir la communauté nomade en mouvement.

Tonalité : **intimiste, focus, peu de surfaces, un seul propos par écran**. C'est l'inverse du desktop éditorial — sur mobile on doit pouvoir scroller d'une main en marchant. **Inspiration : Duolingo, Mimo, Notion mobile, Reflect (note-taking IA), Polywork, Mira Chat (notre propre app sociale mobile).**

⚠️ **Format de sortie attendu** : maquettes **HTML/CSS qui simulent un viewport iPhone 14 (390 × 844 px)**. Le code Flutter sera ensuite réécrit par les étudiants en se basant sur ces maquettes. Cadre iPhone visible autour des écrans pour la démo.

## DESIGN SYSTEM (REPRISE A + B + C)

### Couleurs Mira (palette exclusive)

| Token | Hex | Usage |
|---|---|---|
| `mira-red` | `#E6332A` | CTA primary, accents, tab active, ring autour QCM en cours, lien concept dans une note |
| `warm-beige` | `#EFEAE5` | Background app (toutes les pages) |
| `beige-deep` | `#E2DCD3` | Hover, card secondaire |
| `charcoal` | `#1D1D1B` | Texte principal |
| `muted` | `#888888` | Texte secondaire, timestamps |
| `muted-soft` | `#B6B0A6` | Bordures subtiles |
| `rule` | `#E5E7EB` | Bordures cards / inputs |
| `card-bg` | `#FFFFFF` | Surface cards / notes |
| `success` | `#16A34A` | Skill validée, module completed, bonne réponse QCM |
| `error` | `#EF4444` | Mauvaise réponse QCM |
| `gold` | `#D4A853` | Achievements, badges QCM 100 %, étoiles |
| `sage-soft` | `#D6E3D0` | Chips skill primaire, concept header, progression ring |

### Typo + spacing mobile

- **Manrope** (sans, 400/500/600/700) — UI par défaut
- **Playfair Display** (serif, 700) — uniquement titre principal écran résultat QCM ("Bravo, Anna !"), splash, et titres de concept dans la vue Notes regroupée
- Tailles mobile : titre écran 20 px / body 14 / caption 12 muted
- Échelle 4 px, cards radius 16 sans ombre, boutons radius 12 hauteur 48 (touch-friendly)
- Padding latéral 20 px

## STRUCTURE BOTTOM NAVIGATION (présente partout sauf splash / login / QCM en cours)

```
┌────────────────────────┐
│  Content scrollable    │
│                         │
├────────────────────────┤
│  📚    📝    🌍    👤  │  ← 4 tabs, height 64, bg card-bg
└────────────────────────┘
```

4 tabs (icônes Lucide outlined, 24 px) :
- 📚 **Programmes** — class inscrites + modules + QCM
- 📝 **Notes** — TAB CŒUR : prise de notes + organisation IA par concept
- 🌍 **Communauté** — feed activité anonymisé + carte sessions actives
- 👤 **Profil** — skills validées + paramètres + déconnexion

Label sous l'icône : 11 px semibold, color muted (charcoal + dot mira-red dessous si active).

## ÉCRANS À GÉNÉRER (12 ÉCRANS — viewport 390×844)

### 1. Splash

Centré, fond warm-beige :
- Titre "Mira" 48 px Playfair Display mira-red
- Sous-titre "Learn" 18 px Manrope spacing 4 muted
- Spinner mira-red en bas (stroke 2)

### 2. Login

Form vertical centré :
- Logo "Mira Learn" centré en haut
- Input email pré-rempli : `anna.lopez@hackathon.test`
- Input password pré-rempli : `Hackathon2026!` (masked)
- Bouton primary full-width "Se connecter"
- Texte caption : "Comptes test : voir contracts/test-accounts.md"

### 3. Tab Programmes — liste

AppBar 56 px : titre "Programmes" + icône search à droite.

**Section "Inscrites (1)"** :
```
┌─────────────────────────────────┐
│ ◯ Pitcher pour lever 500k €     │
│   Antoine Martin                  │
│   ━━━━━━━━━━━░░░░ 50 %            │
│   Module 1/2 en cours · 3 j      │
└─────────────────────────────────┘
```

**Section "Suggestions" (basées sur le parcours web Groupe C)** :
```
┌─────────────────────────────────┐
│ UI Design pour SaaS B2B          │
│ Marie Dupont · 60 €              │
│ [En savoir +]                    │
└─────────────────────────────────┘
```

### 4. Tab Programmes — détail class

AppBar : `← Pitcher pour lever 500k €`

Header :
- Avatar mentor + nom + rating ("◯ Antoine M. · ★ 4.8 · 12 classes")
- Chips skills (`[Pitch investor ⭐]` `[Funding]`)
- Card session active : `📍 Barcelone · 5-26 juillet 2026` + bouton ghost "Voir détails session"

**Section "Modules"** (liste vertical avec progress ring par module) :

```
┌─────────────────────────────────┐
│ ⦿ ✓ 1. Construire le narratif   │
│      ━━━━━━━━━━━━━━━━━ 100 %      │
│      1 QCM validé · 3 notes      │
├─────────────────────────────────┤
│ ◐ 2. Design + délivery du deck   │
│    ━━━━━━━━░░░░░░░░░ 50 %         │
│    0 QCM · 1 note                 │
└─────────────────────────────────┘
```

Tap sur un module → détail module.

### 5. Tab Programmes — détail module

AppBar : `← Module 1` + titre "Narratif investor"

- Header : Durée 3 h · Type théorie · Status published
- Section "Description" : markdown content sur 3-4 paragraphes
- Section "Matériel" : liste cards icône + nom + bouton
  - `📄 Deck template.pdf` + [Télécharger]
  - `🎥 Vidéo intro (12 min)` + [Lire]
- **Bouton flottant rouge en bas à droite** (`floating action button`) : `+ Note` (créer une note liée à ce module sans quitter l'écran)
- Section "QCM" : card large avec bouton primary `Lancer le QCM →`

### 6. Création rapide de note (sheet bottom)

Quand on tap `+ Note` depuis n'importe quel module → **bottom sheet drawer 70 % de la hauteur écran** :

```
┌─────────────────────────────────┐
│             ━━━━━                │  ← drag handle
│                                  │
│ Note · Module 1                  │
│ ─────────────────                │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  Le narratif doit commencer   │ │
│ │  par le problème, pas la      │ │
│ │  solution.                    │ │
│ │                                │ │
│ │                                │ │
│ └──────────────────────────────┘ │
│                                  │
│ 🏷  [Pitch] [Funding]            │  ← suggestions concepts (cliquables)
│                                  │
│ [Annuler]            [Enregistrer]│
└─────────────────────────────────┘
```

- Textarea markdown autofocus
- Sous le textarea, **chips suggestions de concepts** auto-générées par IA en temps réel (au fil de la frappe, débouncées 800ms) — l'apprenant peut tap pour les attacher comme tags
- Le module source est attaché automatiquement (visible en header de la sheet)
- Bouton "Enregistrer" → ferme la sheet, toast "Note enregistrée"

### 7. Tab Notes — vue principale

AppBar : titre "Notes" + bouton flottant `+ Note` (création libre, pas attachée à un module).

**Toggle de vue** en haut (segmented control) :
- ◉ **Récentes** (default — chronologique inversé)
- ◯ **Par concept** (regroupées par IA)
- ◯ **Par module** (regroupées par class source)

**Mode "Récentes"** :

```
─── Aujourd'hui ───
┌─────────────────────────────────┐
│ Le narratif doit commencer par   │
│ le problème, pas la solution.    │
│ 🏷 Pitch · Module 1 · il y a 2 j │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Slide 3 = traction. Sans         │
│ traction, ne pas pitcher des     │
│ investisseurs.                    │
│ 🏷 Pitch · Module 1 · hier        │
└─────────────────────────────────┘

─── Cette semaine ───
┌─────────────────────────────────┐
│ Lever 500k → 18-24 mois de       │
│ runway minimum                    │
│ 🏷 Funding · Module 2 · il y a 4 j│
└─────────────────────────────────┘
```

**Mode "Par concept"** (mode démo principal) :

Header explicatif card warm-beige :
> ✨ Tes notes ont été regroupées par concept par Mira AI · dernière analyse il y a 2 h
> [Réorganiser maintenant ↻]

```
─── Pitch (Playfair 24) ───
3 notes
┌─────────────────────────────────┐
│ Le narratif doit commencer par   │
│ le problème, pas la solution.    │
│ Module 1 · il y a 2 j             │
├─────────────────────────────────┤
│ Slide 3 = traction. Sans         │
│ traction, ne pas pitcher des     │
│ investisseurs.                    │
│ Module 1 · hier                   │
└─────────────────────────────────┘

─── Funding (Playfair 24) ───
1 note
┌─────────────────────────────────┐
│ Lever 500k → 18-24 mois de       │
│ runway minimum                    │
│ Module 2 · il y a 4 j             │
└─────────────────────────────────┘

─── Non classées (Playfair 24) ───
2 notes
(notes trop courtes ou trop génériques pour être groupées)
```

Tap sur une note → écran détail note (édition).

**Empty state Notes** (Anna n'a pas encore pris de note) :
- Icône Lucide BookOpen line-art 48px
- Titre "Aucune note encore"
- Sous-titre "Prends ta première note pendant un module — Mira les regroupera par concept pour toi."
- Pas de CTA direct (les notes se créent depuis les modules, pas depuis ici)

### 8. Détail note (édition)

AppBar : `← Notes` + bouton corbeille à droite (delete avec confirm)

- Textarea markdown autofocus, plein écran
- Footer fixé : chips de concepts attachés + chip `+ Concept`
- Card muted en bas : "Liée au module : Module 1 · Narratif investor" cliquable (renvoie au module)
- Sauvegarde auto (toast "Note enregistrée" dismiss 2 s)

### 9. Passer un QCM — 1 question à la fois (pas de bottom nav visible)

Header très épuré :
- Progress bar haute : `━━━━░░░░░░░░░░ Quiz 1 / 5` (mira-red filled)
- Bouton × en haut à droite (sortir avec confirm "Tu perdras ta progression")

Body centré verticalement :
- Énoncé Manrope 18 semibold sur 2-3 lignes : "Quel est le bon ordre dans un pitch ?"

4 options en cards plein-width verticales :
```
┌─────────────────────────────────┐
│ ◯ Solution → Problème → Traction │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ◉ Problème → Solution → Traction │  ← sélectionnée (mira-red ring)
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ ◯ Traction → Problème → Solution │
└─────────────────────────────────┘
```

Bouton primary fixed bottom : `Suivant →` (disabled si pas sélectionné).

### 10. Résultat QCM (skill validée 🎉)

Plein écran centré (pas de bottom nav) :
- Émoji 🎉 grand (4 lignes en haut)
- Titre Playfair 32 "Bravo, Anna !"
- Score "Tu as eu 4/5 (80 %)" Manrope 18
- Séparateur horizontal
- Bloc success : "Skill validée : ✓ Pitch investor" sur fond sage-soft + icône check large
- Bouton primary `Retour au module`
- Bouton ghost `Voir mes skills validées`

### 11. Tab Communauté

AppBar : "Communauté"

Toggle en haut (segmented) :
- ◉ **Carte** (default)
- ◯ **Feed**

**Mode Carte** :
- Carte mondiale stylisée (placeholder — au moins une vue 2D avec des dots pulsants colorés sur les villes Lisbonne, Bali, Barcelone, Berlin)
- Compteur en haut : "15 sessions actives dans le monde"
- Tap sur un dot → bottom sheet avec liste des sessions de cette ville (titre, mentor, dates, places restantes)

**Mode Feed** (activité anonymisée) :
```
┌─────────────────────────────────┐
│ 🎯 Une nomade vient de valider   │
│    la skill 'Pitch investor'     │
│    📍 Portugal · il y a 6 h       │
├─────────────────────────────────┤
│ ✓ Un nomad vient de terminer     │
│    'UI Design pour SaaS B2B'     │
│    📍 Brésil · il y a 12 h        │
├─────────────────────────────────┤
│ 🚀 Session démarre à Barcelone : │
│    'Pitcher pour lever 500k €'   │
│    📍 Espagne · il y a 2 h        │
└─────────────────────────────────┘
```

Chaque event a une icône colorée selon le `kind` (skill_validated = success, class_completed = gold, session_started = mira-red).

### 12. Tab Profil

AppBar : "Profil"

Header centré :
- Avatar 96 px gradient warm
- Nom Manrope 24 semibold "Anna Lopez"
- Bio mini "Designer ↗ SaaS"
- 📍 Lisbonne, PT

**Section "Mes skills validées"** :
- Card success bg sage-soft : ✓ Pitch investor (avec icône check + date validation)

**Section "En cours"** :
- Card neutre : ◐ Funding strategy + progress bar

**Section "Paramètres"** (liste sobre, items 48 px) :
- Visibilité communauté : Public · ` › `
- Notifications : Activées · ` › `
- Langue : Français · ` › `
- Aide & FAQ · ` › `

**Footer** :
- Lien ghost `Mon parcours web →` (renvoie vers `/me/path` du Groupe C dans un WebView)
- Bouton ghost destructive `Déconnexion` (centré, padding bas)

## VOICE & TONE (UX WRITING)

- **Tutoiement FR** partout
- **Phrases courtes mobile** (max 1-2 lignes par texte)
- **Toasts** très courts, dismiss 3 s :
  - "Note enregistrée" (après création note)
  - "Notes réorganisées par concept ✨" (après refresh organisation IA)
  - "Skill validée ✓" (après QCM passing)
  - "Bonne réponse !" (pendant QCM)
- **Empty states encourageants** :
  - Notes vides : "Prends ta première note pendant un module — Mira les regroupera par concept pour toi."
  - Skills validées vides : "Passe ton premier QCM pour valider ta skill."
  - Communauté feed vide : "Pas encore d'activité. Reviens dans quelques heures."

## PERSONA CONNECTÉ (Anna Lopez)

Le user logué est **Anna Lopez** tout au long de la maquette :
- Bio : "Nomad designer en transition vers le SaaS"
- 📍 Lisbonne, PT
- Skills cibles déclarées (web Groupe C) : `Pitch investor` (primaire) + `Funding strategy`
- État au début : inscrite à la class Antoine "Pitcher pour lever 500k €", module 1 en cours, 3 notes prises, 0 skill validée
- État après QCM passé : `Pitch investor` ✓ validée, module 1 ✓ completed, 4 notes

Pour la démo storytelling (J3, 5 min) :
1. Anna ouvre l'app → splash → login auto → Tab Programmes
2. Tap sur "Pitcher pour lever 500k €" → détail class → tap module 1
3. Détail module → elle lit le contenu → tap FAB `+ Note`
4. Bottom sheet → tape "Le narratif doit commencer par le problème" → suggestions IA proposent `[Pitch]` → tap accept → enregistre
5. Retour module → tap "Lancer le QCM"
6. 5 questions à la suite, 4 bonnes → écran résultat 🎉
7. Skill `Pitch investor` validée → tap "Retour module" → progress 100 %
8. **Tab Notes** → mode "Par concept" → voit ses 3 notes regroupées sous "Pitch" — c'est la **wow feature** de la démo
9. **Tab Communauté** → mode Feed → voit "Une nomade vient de valider la skill 'Pitch investor' · Portugal" (c'est elle, anonymisée)
10. Tab Profil → voit "✓ Pitch investor" validée

## INSPIRATIONS SPÉCIFIQUES D

| Source | Quoi piquer |
|---|---|
| **Reflect** (`reflect.app`) | Note-taking simple + organisation IA par concept (le pattern central du Groupe D) |
| **Notion mobile** | Bibliothèque de notes : sobre, regroupements clairs, edit-in-place, bottom sheet pour création |
| **Duolingo** | Progress bar par module, célébration de fin avec emoji + score, bottom tab bar sobre |
| **Mimo** | UX QCM 1 question / écran, gros boutons radio cards plein-width |
| **Polywork** | Feed activité anonymisé chaleureux |
| **Mira Chat** (notre propre app) | Bottom tabs 4, glass effects subtils, warm beige background, FAB pour création |
| **Headspace** | Splash apaisant, transitions douces |

## CONTRAINTES TECH

- Maquettes **HTML/CSS qui simulent un iPhone 14** (cadre device visible, viewport 390 × 844). Pas Flutter natif.
- **Fonts** Manrope + Playfair Display via Google Fonts CDN
- **iOS Simulator + Android Emulator** ciblés en prod (Flutter), donc design must work on both
- **FR uniquement**
- **Pas d'animations complexes** dans les maquettes (le rendu Flutter sera linéaire)
- **Photos** : éviter les portraits, privilégier les icônes Lucide outlined + dégradés warm pour avatars
- **Bottom sheet** : pattern récurrent (création note, détail session sur carte) — implémenter en `position: fixed` avec backdrop semi-transparent + drag handle visible

## DEMANDE FINALE

Génère **les 12 écrans listés** :
- En **maquettes HTML/CSS dans un viewport iPhone 14** (cadre device subtil autour)
- **Cohérence forte avec Groupes A + B + C** : mêmes tokens, mêmes atoms (Avatar, SkillChip, StatusBadge) — au pixel près adapté au mobile
- **Bottom navigation persistante** sur les écrans 3, 4, 5, 7, 8, 11, 12 (pas sur 1, 2, 6, 9, 10 — modales / focus mode)
- **1 écran par viewport** (mobile-only)
- **Wow feature à mettre en avant** : Tab Notes mode "Par concept" — c'est la vraie nouveauté du Groupe D vs un Notion classique
- **Empty states** soignés (Notes vides, Skills non validées, Feed vide, Communauté pas dans ma région)
- **Confort tactile** : boutons hauteur 48 px (vs 44 desktop), padding latéral 20 px, gros radius
- **Densité épurée** : un seul focus par écran

Une fois généré :
1. Montre-moi les 12 écrans côte à côte en grid (iPhone preview)
2. Indique quels écrans nécessitent une animation/transition spécifique côté Flutter (ex. swipe entre questions du QCM, drag bottom sheet, fade fade concepts regroupés)
3. Liste les composants Flutter à créer en correspondance (ProgramListCard, ModuleListItem, NoteCard, ConceptHeader, NoteCreateSheet, QuizQuestionWidget, FeedItem, CommunityMapPlaceholder, etc.)
