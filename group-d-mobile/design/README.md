# Design proposal — Groupe D — Mira Learn Mobile

> Tokens partagés : [`hackathon/design-system.md`](../../design-system.md).

## Vue d'ensemble

Mobile companion app pour l'apprenant en mouvement. **iOS + Android via Flutter.** Le ton est **intimiste, focus, peu de surfaces** — chaque écran a un seul propos.

## Sitemap (4 tabs bottom navigation)

```
TAB 1 — 📚 Programmes      → liste class inscrites + détail + modules
TAB 2 — 📖 Bibliothèque    → mes notes (organisées par concept via IA)
TAB 3 — ✨ Tutor IA        → chat Q&A avec IA contextuel
TAB 4 — 👤 Profil          → mon profil + community map + feed activité

Hors tabs :
/login                   → email/password (déjà pré-rempli pour la démo)
/me                      → écran "compte" depuis avatar profil
```

## Maquettes (iPhone portrait, 390×844)

### Tab 1 — Programmes (liste)

```
┌─────────────────────┐
│ Programmes          │
├─────────────────────┤
│                     │
│ Inscrites (1)        │
│ ┌─────────────────┐ │
│ │ Pitcher pour    │ │
│ │ lever 500k €    │ │
│ │ Antoine M.       │ │
│ │ ━━━━━━━━━━━━━━━ │ │
│ │ Module 1/2 en   │ │
│ │ cours · 35 %    │ │
│ └─────────────────┘ │
│                     │
│ Suggestions         │
│ ┌─────────────────┐ │
│ │ UI Design SaaS  │ │
│ │ Marie D. · 60 € │ │
│ │ [En savoir +]   │ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

### Tab 1 — Détail class

```
┌─────────────────────┐
│ ← Pitcher pour      │
│   lever 500k €      │
├─────────────────────┤
│                     │
│ ◯ Antoine M.        │
│ ★ 4.8 · 12 classes  │
│                     │
│ [Pitch] [Funding]   │
│                     │
│ Session : Barcelone │
│ 5-26 juillet 2026   │
│                     │
│ ─── Modules ───     │
│                     │
│ ✓ 1. Narratif       │
│   ━━━━━━━━━━━━ 100% │
│   ▷ 1 QCM validé    │
│                     │
│ ◐ 2. Design deck    │
│   ━━━━━━━░░░░░ 50 % │
│   ▷ 0 QCM           │
│                     │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

### Tab 1 — Détail module

```
┌─────────────────────┐
│ ← Module 1          │
│ Narratif investor   │
├─────────────────────┤
│                     │
│ Durée : 3h          │
│ Type : théorie      │
│                     │
│ ─── Description ─── │
│ Markdown content...  │
│ Sur 3 paragraphes…   │
│                     │
│ ─── Matériel ───    │
│ 📄 Deck template     │
│    [Télécharger]     │
│ 🎥 Vidéo intro       │
│    [Lire]            │
│                     │
│ ─── QCM ───         │
│ ┌─────────────────┐ │
│ │ Valider le      │ │
│ │ narratif        │ │
│ │ Passing : 70 %  │ │
│ │ [Lancer le QCM →]│ │
│ └─────────────────┘ │
│                     │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

### Tab 1 — Passer un QCM (1 question à la fois)

```
┌─────────────────────┐
│ Quiz 1 / 5          │
│ ━━━░░░░░░░░░░░░░░  │
├─────────────────────┤
│                     │
│                     │
│ Quel est le bon     │
│ ordre dans un pitch?│
│                     │
│ ┌─────────────────┐ │
│ │ Solution →      │ │
│ │ Problème →      │ │
│ │ Traction        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Problème →      │ │
│ │ Solution →      │ │
│ │ Traction        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Traction →      │ │
│ │ Problème →      │ │
│ │ Solution        │ │
│ └─────────────────┘ │
│                     │
│      [Suivant →]    │
└─────────────────────┘
```

### Tab 1 — Résultat QCM

```
┌─────────────────────┐
│                     │
│                     │
│                     │
│        🎉           │
│                     │
│   Bravo, Anna !     │
│                     │
│   Tu as eu 4/5      │
│   (80 %)            │
│                     │
│   ━━━━━━━━━━━━      │
│                     │
│   Skill validée :   │
│   ✓ Pitch investor  │
│                     │
│   [Retour module]   │
└─────────────────────┘
```

### Tab 2 — Bibliothèque

```
┌─────────────────────┐
│ Bibliothèque        │
├─────────────────────┤
│ [+ Nouvelle note]    │
│                     │
│ Organisées par      │
│ concept             │
│ [✨ Organiser IA]    │
│                     │
│ ─── Pitch ───       │
│ ┌─────────────────┐ │
│ │ Le narratif doit│ │
│ │ commencer par le│ │
│ │ problème.       │ │
│ │ il y a 2 j      │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Slide 3 =       │ │
│ │ traction. Sans  │ │
│ │ traction, ne pas│ │
│ │ pitcher.        │ │
│ │ hier            │ │
│ └─────────────────┘ │
│                     │
│ ─── Funding ───     │
│ (vide)              │
│                     │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

### Tab 3 — Tutor IA

```
┌─────────────────────┐
│ Tutor IA            │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Bonjour Anna,   │ │
│ │ je suis ton     │ │
│ │ tutor IA. Pose- │ │
│ │ moi une question│ │
│ │ sur tes class.  │ │
│ │           Mira  │ │
│ └─────────────────┘ │
│         ┌────────┐  │
│         │ C'est  │  │
│         │ quoi un│  │
│         │ pitch  │  │
│         │ deck ? │  │
│         │   Anna │  │
│         └────────┘  │
│ ┌─────────────────┐ │
│ │ Un pitch deck   │ │
│ │ est une présent.│ │
│ │ de 10-15 slides │ │
│ │ qui résume ton  │ │
│ │ projet…         │ │
│ │           Mira  │ │
│ └─────────────────┘ │
│                     │
│ [_________] [→]     │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

### Tab 4 — Profil

```
┌─────────────────────┐
│ Profil              │
├─────────────────────┤
│                     │
│      ┌────┐         │
│      │avat│         │
│      └────┘         │
│  Anna Lopez         │
│  Designer ↗ SaaS    │
│  📍 Lisbonne, PT    │
│                     │
│ ─── Skills validées │
│ ✓ Pitch investor    │
│                     │
│ ─── En cours ───    │
│ ◐ Funding strategy  │
│                     │
│ ─── Communauté ───  │
│ [Carte mondiale  📍]│
│ 15 sessions actives │
│                     │
│ ─── Activité ───    │
│ • 1 nomad valide    │
│   Pitch · il y a 6h │
│ • 1 nomad termine   │
│   UI Design · 12h   │
│ • Session démarre   │
│   Barcelone · 2h    │
│                     │
│ [Déconnexion]       │
├─────────────────────┤
│ 📚 📖 ✨ 👤        │
└─────────────────────┘
```

## Composants Flutter à créer

| Composant | Note |
|---|---|
| `ProgramListCard` | Card avec progress bar |
| `ModuleListItem` | Listile avec progress dot |
| `MaterialItem` | PDF/vidéo + bouton télécharger / lire |
| `QuizQuestionWidget` | 1 question + N options + sélection |
| `QuizProgressBar` | Linear barre 1/N filled |
| `NoteCard` | Card éditable avec timestamp |
| `ChatBubble` | 2 variantes : user (right, beige) / mira (left, white border) |
| `SkillStatusBadge` | ✓ validé / ◐ en cours / ⌛ ciblé |
| `ActivityFeedItem` | Icône + texte anonymisé + timestamp |
| `CommunityMapWidget` | Stub : juste une List de markers, pas de vraie carte (out of scope) |

## User flow démo (storytelling Anna)

```
Splash → Login (anna.lopez@hackathon.test pré-rempli)
       → Tab 1 Programmes → Card "Pitcher pour lever 500k €"
       → Tap → Détail class → Module 1 "Narratif investor"
       → Lecture du contenu → Tap "[+ Note]"
       → "Le narratif doit commencer par le problème"
       → Tap "Lancer le QCM"
       → 5 questions, 4 bonnes réponses
       → Résultat 80% → 🎉 → "Skill validée : Pitch investor"
       → Bouton "Retour module" → progress bar 100% module 1
       → Tab 2 Bibliothèque → Voit ses 2 notes → Tap "✨ Organiser IA"
       → IA regroupe sous le concept "Pitch"
       → Tab 4 Profil → Voit "Pitch investor ✓ validé"
       → Feed : "1 nomad valide Pitch · il y a quelques secondes" (c'est elle !)
```

## Inspirations spécifiques D

| Source | Quoi piquer |
|---|---|
| [Duolingo](https://duolingo.com) | Progress bar par lesson, célébration de fin |
| [Mimo](https://mimo.org) | Quiz UX mobile : 1 question/écran, gros boutons |
| [Notion mobile](https://notion.so) | Bibliothèque de notes : sobres, regroupées |
| [Polywork](https://polywork.com) | Feed activité anonymisé chaleureux |
| [Mira Chat](https://github.com/hello-mira/mobile/tree/main/apps/mira_chat) | Notre own brand mobile : bottom tabs, glass effects, warm |
