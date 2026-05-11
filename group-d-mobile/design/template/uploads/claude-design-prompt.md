# Prompt Claude Design — Groupe D — Mira Learn Mobile

> Prompt complet à coller dans Claude Design pour générer les **maquettes visuelles mobile** servant de référence aux développeurs Flutter du Groupe D.

---

## CONTEXTE PRODUIT

**Mira Learn** est la plateforme edtech de Hello Mira (digital nomads francophones). Les Groupes A, B, C livrent l'expérience web. **Le Groupe D livre l'app mobile compagne** (iOS + Android via Flutter) que l'apprenant utilise au quotidien, en café à Bali ou en coworking à Lisbonne, pour suivre ses classes, prendre des notes intelligentes, faire des QCM, et voir la communauté en mouvement.

Tonalité : **intimiste, focus, peu de surfaces, chaque écran a un seul propos**. C'est l'inverse du desktop éditorial — sur mobile on doit pouvoir scroller d'une main en marchant. **Inspiration : Duolingo, Mimo, Notion mobile, Polywork, Mira Chat (notre propre app sociale mobile).**

⚠️ **Format de sortie attendu** : maquettes **HTML/CSS qui simulent un viewport iPhone 14 (390 × 844 px)**. Le code Flutter sera ensuite réécrit par les étudiants en se basant sur ces maquettes. Cadre iPhone visible autour des écrans pour la démo.

## DESIGN SYSTEM (REPRISE A + B + C)

### Couleurs Mira (palette exclusive)

| Token | Hex | Usage |
|---|---|---|
| `mira-red` | `#E6332A` | CTA primary, accents, tab active, ring autour QCM en cours |
| `warm-beige` | `#EFEAE5` | Background app (toutes les pages) |
| `beige-deep` | `#E2DCD3` | Bubble user dans tutor IA, hover |
| `charcoal` | `#1D1D1B` | Texte principal |
| `muted` | `#888888` | Texte secondaire, timestamps |
| `muted-soft` | `#B6B0A6` | Bordures subtiles |
| `rule` | `#E5E7EB` | Bordures cards / inputs |
| `card-bg` | `#FFFFFF` | Surface cards / bubble Mira |
| `success` | `#16A34A` | Skill validée, module completed, bonne réponse QCM |
| `error` | `#EF4444` | Mauvaise réponse QCM |
| `gold` | `#D4A853` | Achievements, badges QCM 100 %, étoiles |
| `sage-soft` | `#D6E3D0` | Chips skill primaire, progression ring |

### Typo + spacing mobile

- **Manrope** (sans, 400/500/600/700) — UI par défaut
- **Playfair Display** (serif, 700) — uniquement titre principal écran result QCM ("Bravo, Anna !") et splash
- Tailles mobile : titre écran 20 px / body 14 / caption 12 muted
- Échelle 4 px, cards radius 16 sans ombre, boutons radius 12 hauteur 48 (touch-friendly)
- Padding latéral 20 px (un peu plus serré que desktop pour gagner de l'espace)

## STRUCTURE BOTTOM NAVIGATION (présente partout sauf splash / login / QCM)

```
┌────────────────────────┐
│  Content scrollable    │
│                         │
│                         │
├────────────────────────┤
│  📚    📖    ✨    👤  │  ← 4 tabs, height 64, bg card-bg
└────────────────────────┘
```

4 tabs (icônes Lucide outlined, 24 px) :
- 📚 **Programmes** (active = mira-red filled icon + dot mira-red dessous)
- 📖 **Bibliothèque**
- ✨ **Tutor IA**
- 👤 **Profil**

Label sous l'icône : 11 px, semibold, color muted (charcoal si active).

## ÉCRANS À GÉNÉRER (10 ÉCRANS — viewport 390×844)

### 1. Splash (au lancement)

Centré, fond warm-beige :
- Titre "Mira" 48 px Playfair Display mira-red
- Sous-titre "Learn" 18 px Manrope spacing 4 muted
- Spinner mira-red en bas (CircularProgressIndicator stroke 2)

### 2. Login (email + password)

Form vertical centré :
- Logo "Mira Learn" (42 + 14 px) centré en haut
- Input email pré-rempli : `anna.lopez@hackathon.test`
- Input password pré-rempli : `Hackathon2026!` (masked)
- Bouton primary full-width "Se connecter"
- Texte caption en bas : "Comptes test : voir contracts/test-accounts.md"

### 3. Tab Programmes — liste

Top : AppBar 56 px, titre "Programmes" Manrope 20 semibold + icône search à droite.

**Section "Inscrites (1)"** :
```
┌─────────────────────────────────┐
│ ◯ Pitcher pour lever 500k €     │
│   Antoine Martin                  │
│   ━━━━━━━━━━━░░░░ 50 %            │
│   Module 1/2 en cours · 3 j      │
└─────────────────────────────────┘
```

**Section "Suggestions" (basées sur le parcours web)** :
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
│      1 QCM validé                 │
├─────────────────────────────────┤
│ ◐ 2. Design + délivery du deck   │
│    ━━━━━━━━░░░░░░░░░ 50 %         │
│    0 QCM                          │
└─────────────────────────────────┘
```

Tap sur un module → écran détail module.

### 5. Tab Programmes — détail module

AppBar : `← Module 1` + titre "Narratif investor"

- Header : Durée 3 h · Type théorie · Status published
- Section "Description" : markdown content sur 3-4 paragraphes
- Section "Matériel" : liste cards icône + nom + bouton télécharger / lire
  - `📄 Deck template.pdf` + [Télécharger]
  - `🎥 Vidéo intro (12 min)` + [Lire]
- Section "QCM" : card large avec bouton primary `Lancer le QCM →`

### 6. Passer un QCM — 1 question à la fois

Header très épuré :
- Progress bar haute : `━━━━░░░░░░░░░░ Quiz 1 / 5` (mira-red filled)

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
┌─────────────────────────────────┐
│ ◯ Pitch → Problème → Traction    │
└─────────────────────────────────┘
```

Bouton primary fixed bottom : `Suivant →` (disabled si pas sélectionné)

### 7. Résultat QCM (skill validée 🎉)

Plein écran centré :
- Émoji 🎉 grand (4 lignes en haut)
- Titre Playfair 32 "Bravo, Anna !"
- Score "Tu as eu 4/5 (80 %)" Manrope 18
- Séparateur horizontal
- Bloc success : "Skill validée : ✓ Pitch investor" sur fond sage-soft, icône check large
- Bouton primary `Retour au module`
- Bouton ghost `Voir mes skills validées`

### 8. Tab Bibliothèque

AppBar : "Bibliothèque" + bouton primary mini `+ Note`

**Header de section "Organisées par concept"** :
- Texte muted "Tes notes ont été regroupées par Mira AI."
- Bouton secondary `✨ Réorganiser`

**Groupes par concept** (collapsible) :

```
─── Pitch ───
┌─────────────────────────────────┐
│ Le narratif doit commencer par   │
│ le problème, pas la solution.    │
│ il y a 2 j                       │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Slide 3 = traction. Sans         │
│ traction, ne pas pitcher des     │
│ investisseurs.                    │
│ hier                              │
└─────────────────────────────────┘

─── Funding ───
(empty state : "Aucune note encore.")
```

### 9. Tab Tutor IA — chat

AppBar : "Tutor IA"

Body en thread chat :

Bubble Mira (left, bg card-bg, border rule) :
```
Bonjour Anna, je suis ton tutor IA.
Pose-moi une question sur tes class.
                              — Mira
```

Bubble user (right, bg beige-deep) :
```
C'est quoi un pitch deck ?
                              — Anna
```

Bubble Mira :
```
Un pitch deck est une présentation
de 10-15 slides qui résume ton
projet pour des investisseurs.
La structure classique : problème,
solution, marché, traction, équipe,
demande.
                              — Mira
```

Input bottom fixed : input texte + bouton primary rond `→` (paper plane icon).

### 10. Tab Profil

AppBar : "Profil"

Header centré :
- Avatar 96 px gradient warm
- Nom Manrope 24 semibold "Anna Lopez"
- Bio mini "Designer ↗ SaaS"
- 📍 Lisbonne, PT

**Section "Mes skills validées"** :
- Card success : ✓ Pitch investor (sage-soft bg, success text + check)

**Section "En cours"** :
- Card neutre : ◐ Funding strategy (sage-soft bg light, muted text)

**Section "Communauté"** :
- Carte mondiale stylisée (placeholder — au moins une vue avec des dots sur les villes Lisbonne, Bali, Barcelone, Berlin) avec compteur "15 sessions actives dans le monde"
- Bouton secondary `Voir la communauté →`

**Section "Activité récente" (feed anonymisé)** :
```
• Une nomade vient de valider la
  skill 'Pitch investor'           il y a 6 h
• Un nomad vient de terminer
  'UI Design pour SaaS B2B'        il y a 12 h
• Session démarre à Barcelone :
  'Pitcher pour lever 500k €'      il y a 2 h
```

Footer : bouton ghost destructive `Déconnexion` (centré)

## VOICE & TONE (UX WRITING)

- **Tutoiement FR** partout
- **Phrases courtes mobile** (max 1-2 lignes par texte)
- **Toasts** très courts, dismiss 3 s :
  - "Note enregistrée" (après création note)
  - "Skill validée ✓" (après QCM passing)
  - "Bonne réponse !" (pendant QCM)
- **Empty states encourageants** :
  - Bibliothèque vide : "Prends ta première note pendant un module."
  - Skills validées vides : "Passe ton premier QCM pour valider ta skill."
  - Tutor IA premier message : "Pose-moi n'importe quelle question sur tes class — je connais le contenu."

## PERSONA CONNECTÉ (Anna Lopez)

Le user logué est **Anna Lopez** tout au long de la maquette :
- Bio : "Nomad designer en transition vers le SaaS"
- 📍 Lisbonne, PT
- Skills cibles déclarées (web Groupe C) : `Pitch investor` (primaire) + `Funding strategy`
- État au début : inscrite à la class Antoine "Pitcher pour lever 500k €", module 1 en cours, 0 skill validée
- État après QCM passé : `Pitch investor` ✓ validée, module 1 ✓ completed

Pour la démo storytelling :
1. Anna ouvre l'app → splash → login auto → Tab Programmes
2. Tap sur "Pitcher pour lever 500k €" → détail class → tap module 1
3. Détail module → tap "Lancer le QCM"
4. 5 questions à la suite, 4 bonnes → écran résultat 🎉
5. Skill `Pitch investor` validée → tap "Retour module" → progress bar 100 %
6. Tab Bibliothèque → voit ses notes regroupées par "Pitch"
7. Tab Profil → voit "✓ Pitch investor" + feed "Une nomade vient de valider Pitch investor" (c'est elle, anonymisée)

## INSPIRATIONS SPÉCIFIQUES D

| Source | Quoi piquer |
|---|---|
| **Duolingo** | Progress bar par module, célébration de fin avec emoji + score, bottom tab bar sobre |
| **Mimo** | UX QCM 1 question / écran, gros boutons radio cards plein-width |
| **Notion mobile** | Bibliothèque de notes : sobre, regroupements clairs, edit-in-place |
| **Polywork** | Feed activité anonymisé chaleureux |
| **Mira Chat** (notre propre app) | Bottom tabs 4, glass effects subtils, warm beige background |
| **Headspace** | Splash apaisant, transitions douces |

## CONTRAINTES TECH

- Maquettes **HTML/CSS qui simulent un iPhone 14** (cadre device visible, viewport 390 × 844). Pas Flutter natif.
- **Fonts** Manrope + Playfair Display via Google Fonts CDN
- **iOS Simulator + Android Emulator** ciblés en prod (Flutter), donc design must work on both — éviter trop d'iOS-specific design tokens
- **FR uniquement**
- **Pas d'animations complexes** dans les maquettes (le rendu Flutter sera linéaire)
- **Photos** : éviter les portraits, privilégier les icônes Lucide outlined + dégradés warm pour avatars

## DEMANDE FINALE

Génère **les 10 écrans listés** :
- En **maquettes HTML/CSS dans un viewport iPhone 14** (cadre device subtil autour)
- **Cohérence forte avec Groupes A + B + C** : mêmes tokens, mêmes atoms (Avatar, SkillChip, StatusBadge) — au pixel près adapté au mobile
- **Bottom navigation persistante** sur les écrans 3, 4, 5, 8, 9, 10 (pas sur 1, 2, 6, 7)
- **1 écran par viewport** (pas de design responsive desktop ici, mobile-only)
- **Empty states** soignés (Bibliothèque vide, Skills non validées, Tutor IA premier message)
- **Privilégie le confort tactile** : boutons hauteur 48 px (vs 44 desktop), padding latéral 20 px, gros radius
- **Densité épurée** : un seul focus par écran (ne pas charger Tab Profil avec 7 sections — quitte à scroller)

Une fois généré :
1. Montre-moi les 10 écrans côte à côte en grid (iPhone preview)
2. Indique quels écrans nécessitent une animation/transition spécifique côté Flutter (ex. swipe entre questions du QCM, expand bibliothèque)
3. Liste les composants Flutter à créer en correspondance (ProgramListCard, ModuleListItem, QuizQuestionWidget, ChatBubble, etc.)
