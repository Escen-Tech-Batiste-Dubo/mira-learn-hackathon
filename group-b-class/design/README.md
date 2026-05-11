# Design proposal — Groupe B — Mira Class (backoffice mentor)

> Tokens partagés : [`hackathon/design-system.md`](../../design-system.md).

## Vue d'ensemble

| Audience | Surface | Auth |
|---|---|---|
| Mira Mentor | Backoffice perso | Login + role `mentor` |
| Admin HLMR | Modération classes | Login + role `admin` |

Le groupe B est **un backoffice** — sobre, clavier-friendly, productif. Pas de fioritures éditoriales.

## Sitemap

```
AUTH (mentor)
├── /dashboard                       Vue d'ensemble (compteurs)
├── /dashboard/classes               Mes classes (liste)
├── /dashboard/classes/new           Créer une class
├── /dashboard/classes/{id}          Édition class (overview)
│   ├── /modules                     Modules de la class
│   ├── /sessions                    Sessions de la class
│   └── /enrolments                  Apprenants inscrits
├── /dashboard/modules/{id}          Détail module
│   └── /quizzes                     QCM du module
└── /dashboard/quizzes/{id}          Édition QCM

AUTH (admin)
├── /admin/classes                   Toutes les classes (modération)
└── /admin/classes/{id}              Détail class (approve/reject)
```

## Layout standard backoffice

```
┌──────────────────────────────────────────────────────────┐
│  Mira Learn · Dashboard                       👤 Antoine │
├─────────────┬────────────────────────────────────────────┤
│             │                                             │
│ Sidebar     │  Main content                              │
│             │                                             │
│ ◀ Overview  │  ┌─────────────────────────────────────┐  │
│ ▣ Classes   │  │ Page title          [+ Action]      │  │
│ ◇ Sessions  │  │                                      │  │
│ ◯ Élèves    │  │  ... content ...                     │  │
│ ▽ Quizzes   │  │                                      │  │
│             │  └─────────────────────────────────────┘  │
│             │                                             │
│ ⚙ Profil    │                                             │
└─────────────┴────────────────────────────────────────────┘
```

Sidebar : 240px de large, bg `cardBg`, items hauteur 36px.

## Écrans clés

### 1. Dashboard `/dashboard`

```
┌─────────────────────────────────────────────────────────┐
│ Bonjour Antoine 👋                                       │
│                                                           │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│ │ Classes   │ │ Sessions  │ │ Élèves    │ │ QCM       │ │
│ │   3       │ │   2       │ │  18       │ │   5       │ │
│ │ published │ │ open      │ │ inscrits  │ │ publiés   │ │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │
│                                                           │
│ ─── À traiter ───                                        │
│ ⚠ 3 nouvelles candidatures à examiner                    │
│ ⚠ 1 session démarre dans 3 jours (Barcelone)             │
│                                                           │
│ ─── Activité récente ───                                 │
│ • Anna Lopez s'est inscrite à "Pitcher pour lever 500k"  │
│ • Pierre Lambert est en waitlist                          │
│ • Marie Dupont a publié sa class "UI Design pour SaaS"    │
└─────────────────────────────────────────────────────────┘
```

### 2. Liste classes `/dashboard/classes`

```
┌─────────────────────────────────────────────────────────┐
│ Mes classes                              [+ Créer une class]│
│ ──────────                                                │
│ [Tous] [Draft] [In review] [Published] [Archived]         │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Pitcher pour lever 500k €              [published]  │ │
│ │ 6 semaines · live hybride · 80€                     │ │
│ │ 2 modules · 1 session · 3 inscrits                  │ │
│ │                                          [Éditer →] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ UI Design pour SaaS B2B                [draft]      │ │
│ │ — pas encore configurée                              │ │
│ │ 0 module · 0 session                                  │ │
│ │                              [Continuer la config →] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Growth B2B en 8 semaines             [in_review]    │ │
│ │ 8 modules · 2 sessions · soumis 2j                   │ │
│ │                                          [Voir →]    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3. Édition class `/dashboard/classes/{id}`

```
┌─────────────────────────────────────────────────────────┐
│ ← Mes classes                                            │
│                                                           │
│ Pitcher pour lever 500k €              [published]       │
│ ──────────────────────────                               │
│ [Vue d'ensemble] [Modules (2)] [Sessions (1)] [Élèves]   │
│                                                           │
│ ─── Détails ───                                          │
│ Titre              [Pitcher pour lever 500k €____]        │
│ Description        Markdown éditable                      │
│ Format             ◉ live_hybride  ◯ virtuel  ◯ async    │
│ Total hours        [8______]                              │
│ Skills enseignées  [Pitch investor ×] [Funding strategy ×]│
│                    [+ Ajouter]                            │
│                                                           │
│ ─── Actions ───                                          │
│ [Soumettre à validation]  [Mettre en pause]               │
└─────────────────────────────────────────────────────────┘
```

### 4. Modules — drag & drop liste `/dashboard/classes/{id}/modules`

```
┌─────────────────────────────────────────────────────────┐
│ Pitcher pour lever 500k € / Modules    [+ Nouveau module]│
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡  1. Construire le narratif investor               │ │
│ │    3h · théorie · published                          │ │
│ │    [Édit] [Quizzes (1)] [Matériel (4)]              │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ≡  2. Design + délivery du deck                     │ │
│ │    4h · practice · published                         │ │
│ │    [Édit] [Quizzes (0)] [Matériel (2)]              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

(L'icône `≡` représente la zone de drag/drop pour réordonnancer.)

### 5. Édition QCM `/dashboard/quizzes/{id}`

```
┌─────────────────────────────────────────────────────────┐
│ ← Module "Construire le narratif"                       │
│                                                           │
│ Valider le narratif investor              [published]    │
│ Passing score : 70 %                                      │
│                                                           │
│ ─── Questions (5) ───                  [✨ Générer 5 questions IA]│
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Q1. Quel est le bon ordre dans un pitch ?           │ │
│ │     ◯ Solution → Problème → Traction                 │ │
│ │     ◉ Problème → Solution → Traction  ← bonne        │ │
│ │     ◯ Traction → Problème → Solution                 │ │
│ │                                              [Éditer]│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Q2. La slide 3 d'un pitch deck est généralement...  │ │
│ │ (…)                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [+ Ajouter une question]                                  │
└─────────────────────────────────────────────────────────┘
```

### 6. Gestion candidatures `/dashboard/classes/{id}/enrolments`

```
┌─────────────────────────────────────────────────────────┐
│ Pitcher pour lever 500k €  /  Apprenants                 │
│ Session : Barcelone, 5-26 juillet 2026                   │
│ Capacité : 3 / 8                                          │
│                                                           │
│ [Tous] [Applied (1)] [Accepted (2)] [Waitlist (1)]       │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ◯ Anna Lopez            applied · il y a 2h          │ │
│ │   Designer en transition vers SaaS                    │ │
│ │   « Je veux passer du design à la levée. »           │ │
│ │                                  [Refuser] [Accepter] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ◯ Pierre Lambert        waitlist · il y a 1j         │ │
│ │   Solo founder, levée seed cible                      │ │
│ │                                       [Déplacer →]    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Composants à créer

| Composant | Note |
|---|---|
| `<Sidebar>` | Persistante, items avec icon Lucide + label + active state |
| `<StatCard>` | Mini-card 1 ligne dans dashboard (label + value + couleur) |
| `<ClassListItem>` | Card title + status + métadonnées + CTA |
| `<ModuleListItem>` | Card draggable avec position + title + meta + actions |
| `<QuestionEditor>` | Éditable inline : enoncé + N options + bonne réponse |
| `<EnrolmentCard>` | Apprenant : avatar + name + bio + motivation + actions |
| `<StatusBadge>` | Cohérent avec groupe A |
| `<ChipMultiSelect>` | Pour skills : input + chips + suggestions |

## Flow IA : génération de QCM

```
/dashboard/quizzes/{id}
    → Click "✨ Générer 5 questions IA"
    → Modal : "Sur quoi sont les questions ?"
              [textarea : Description du module + contexte]
              [Modèle : claude-3.5-haiku ▼]
              [Générer]
    → POST /v1/internal/llm/generate-quiz {module_id, instructions}
    → Backend : prompt OpenRouter (5 Q + 4 options + correct)
    → Loader 8-15s
    → Preview des 5 questions
    → [Accepter tout] [Modifier individuellement]
    → Saving en base
```

## Inspirations spécifiques B

| Source | Quoi piquer |
|---|---|
| [Notion DB views](https://notion.so) | Tableau classes : tri/filtre clair, actions inline |
| [Linear issues](https://linear.app) | Sidebar productive + raccourcis clavier |
| [Teachable course editor](https://teachable.com) | Liste modules draggable simple |
| [Notion AI generate](https://notion.so/ai) | UX du prompt → preview → accept |
