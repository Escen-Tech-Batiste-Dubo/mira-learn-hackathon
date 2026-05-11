# Design proposal — Groupe C — Mira Learn (front public apprenant)

> Tokens partagés : [`hackathon/design-system.md`](../../design-system.md).

## Vue d'ensemble

| Audience | Surface | Auth |
|---|---|---|
| Visiteur (anonyme) | Catalogue + landing | Public |
| Nomade authentifié | Profil + parcours + intent | Login |

C'est **le visage premium** de Mira Learn — chaleureux, éditorial, généreux en espace blanc et photos. C'est ici qu'un visiteur passe de "tiens c'est joli" à "je m'inscris".

## Sitemap

```
PUBLIC
├── /                            Landing chaleureux (hero + 3 classes featured)
├── /classes                     Catalogue (filtres + grid)
├── /classes/{slug}              Détail class (mentor + modules + sessions)
└── /community                   Carte / annuaire des apprenants (opt-in)

AUTH
├── /me                          Mon profil (skills cibles, bio, country)
├── /me/path                     Mon parcours d'apprentissage
├── /me/path/generate            Génération IA du parcours (CTA)
├── /me/enrolments               Mes inscriptions actuelles
└── /classes/{slug}/apply        Form d'intention d'inscription
```

## Écrans clés

### 1. Landing `/`

```
┌────────────────────────────────────────────────────────────┐
│ [Mira Learn]                          [Catalogue] [👤]      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│              Apprends en voyageant.                          │
│              Avec des mentors qui ont fait le chemin.        │
│       (Playfair Display, 56px, charcoal)                     │
│                                                              │
│   Mira Learn t'aide à apprendre les skills dont tu as besoin │
│   auprès de mentors validés, en présentiel ou en virtuel.    │
│                                                              │
│              [Découvrir les classes]  [Devenir mentor]       │
│                                                              │
│              [photo nomade éditoriale 16:9]                  │
│                                                              │
│   ─── Classes featured ───                                  │
│                                                              │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│   │ Pitcher    │  │ UI Design  │  │ Growth B2B │            │
│   │ pour lever │  │ pour SaaS  │  │ go-to-mkt  │            │
│   │ 500k €     │  │ B2B        │  │ en 8 sem.  │            │
│   │            │  │            │  │            │            │
│   │ Antoine M. │  │ Marie D.   │  │ David C.   │            │
│   │ 80 €       │  │ 60 €       │  │ 49 €       │            │
│   └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│   ─── Comment ça marche ───                                 │
│   1. Définis ta skill cible                                  │
│   2. L'IA te crée un parcours sur mesure                     │
│   3. Tu suis les classes recommandées                        │
│   4. Tu valides la skill, tu rejoins une communauté          │
└────────────────────────────────────────────────────────────┘
```

### 2. Catalogue `/classes`

```
┌────────────────────────────────────────────────────────────┐
│   Catalogue                                                 │
│   ──────────                                                │
│                                                              │
│   [Filtres : Skill ▼] [Catégorie ▼] [Format ▼] [Prix ▼]     │
│                                                              │
│   3 classes published                                        │
│                                                              │
│   ┌────────────────────┐  ┌────────────────────┐            │
│   │ [photo 16:9 mock]  │  │ [photo 16:9 mock]  │            │
│   │                     │  │                     │            │
│   │ Pitcher pour lever │  │ UI Design pour SaaS │            │
│   │ 500k €              │  │ B2B                 │            │
│   │                     │  │                     │            │
│   │ Antoine Martin     │  │ Marie Dupont        │            │
│   │ live hybride · 6sem│  │ live virtuel · 4sem │            │
│   │ [Pitch] [Funding]  │  │ [UI Design]         │            │
│   │ 80 €                │  │ 60 €                │            │
│   │ [Découvrir →]      │  │ [Découvrir →]      │            │
│   └────────────────────┘  └────────────────────┘            │
│                                                              │
│   ┌────────────────────┐                                    │
│   │ Growth B2B...      │                                    │
│   └────────────────────┘                                    │
└────────────────────────────────────────────────────────────┘
```

### 3. Détail class `/classes/{slug}`

```
┌────────────────────────────────────────────────────────────┐
│   ← Catalogue                                               │
│                                                              │
│   ┌──────────────┐                                          │
│   │ [photo hero] │  Pitcher pour lever 500k €               │
│   │              │  (Playfair Display 36)                    │
│   │              │  Construis ton deck investor +            │
│   │              │  délivre ton pitch en 6 semaines          │
│   └──────────────┘                                          │
│                                                              │
│   ◯ Antoine Martin                                          │
│   Pitch investor · ★ 4.8 (47 avis) · 12 classes données      │
│                                                              │
│   [Pitch investor] [Funding strategy]    80 €  · 6 semaines │
│                                                              │
│   ─── À propos ───                                          │
│   Markdown description… (3-4 paragraphes)                    │
│                                                              │
│   ─── Modules ───                                           │
│   1. Construire le narratif investor (3h)                    │
│   2. Design + délivery du deck (4h)                          │
│                                                              │
│   ─── Sessions disponibles ───                              │
│   ┌──────────────────────────────────────────────┐          │
│   │ 📍 Barcelone, Espagne                         │          │
│   │ 5-26 juillet 2026 · 8 places · 3 inscrits     │          │
│   │ [Postuler →]                                  │          │
│   └──────────────────────────────────────────────┘          │
│   ┌──────────────────────────────────────────────┐          │
│   │ 🌐 Virtuel — sessions live + replays          │          │
│   │ Demarre 1er sept · 10 places · 0 inscrit      │          │
│   │ [Postuler →]                                  │          │
│   └──────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────┘
```

### 4. Mon profil `/me`

```
┌────────────────────────────────────────────────────────────┐
│   Mon profil                                                │
│   ───────────                                               │
│                                                              │
│   ┌────────┐  Anna Lopez                                    │
│   │ avatar │  Designer en transition vers SaaS              │
│   │        │  📍 Lisbonne, Portugal                         │
│   └────────┘  [Modifier]                                    │
│                                                              │
│   ─── Mes skills cibles ───                                 │
│   [Pitch investor] [Funding strategy]   [+ Ajouter]          │
│                                                              │
│   ─── Mes skills validées ───                               │
│   (vide — passe des QCM pour les valider !)                  │
│                                                              │
│   ─── Visibilité ───                                        │
│   ◉ Public  ◯ Privé                                         │
│                                                              │
│   ─── Mon parcours ───                                      │
│   Tu as un parcours actif :                                  │
│   "Pitch + Funding"                                          │
│   [Voir mon parcours →]                                      │
│                                                              │
│   ─── Mes inscriptions ───                                  │
│   • Pitcher pour lever 500k € — applied — il y a 2 jours     │
└────────────────────────────────────────────────────────────┘
```

### 5. Génération du parcours `/me/path/generate`

```
┌────────────────────────────────────────────────────────────┐
│   Génère ton parcours sur mesure                            │
│   ──────────────────────────────                            │
│                                                              │
│   On va te proposer un parcours d'apprentissage à partir de :│
│                                                              │
│   ─── Tes skills cibles ───                                 │
│   [Pitch investor] [Funding strategy]    [+ Ajouter]         │
│                                                              │
│   ─── Ton horizon ───                                       │
│   ◯ 3 mois   ◉ 6 mois   ◯ 1 an                             │
│                                                              │
│   ─── Ton budget total ───                                  │
│   [200 ___] €                                                │
│                                                              │
│   ─── Ton CV (optionnel) ───                                │
│   📎 Upload ton CV pour qu'on identifie tes skills déjà     │
│      acquises et les retire du parcours.                     │
│                                                              │
│              [✨ Générer mon parcours]                        │
└────────────────────────────────────────────────────────────┘
```

### 6. Mon parcours `/me/path`

```
┌────────────────────────────────────────────────────────────┐
│   Mon parcours                              [Régénérer]    │
│   ─────────────                                             │
│   Pitch + Funding · estimé 6 mois · 80 € total              │
│                                                              │
│   ▶ Étape 1  (in_progress)                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│   Maîtriser : Pitch investor                                 │
│                                                              │
│   Class recommandée :                                         │
│   ┌──────────────────────────────────────────────┐          │
│   │ Pitcher pour lever 500k €                    │          │
│   │ Antoine Martin · 80 €                         │          │
│   │ [Voir cette class →]                          │          │
│   └──────────────────────────────────────────────┘          │
│                                                              │
│   « Class flagship d'Antoine pour valider la skill pitch. »  │
│                                                              │
│                                                              │
│   ⌛ Étape 2  (locked)                                      │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│   Maîtriser : Funding strategy                                │
│                                                              │
│   « La même class couvre aussi funding strategy.             │
│     Étape débloquée quand l'étape 1 est validée. »           │
└────────────────────────────────────────────────────────────┘
```

## Composants à créer

| Composant | Note |
|---|---|
| `<HeroSection>` | Landing : title + sub + CTA + photo |
| `<ClassCard>` | Catalogue card : photo + titre + mentor + meta + chips + prix + CTA |
| `<MentorMini>` | Compact mentor card : avatar + name + rating (1 ligne) |
| `<SkillChipInteractive>` | Cliquable / removable selon contexte (mes skills cibles) |
| `<SessionCard>` | Session : icon (📍 ou 🌐) + lieu + dates + places + CTA |
| `<PathStepCard>` | Étape avec status : current/locked/completed + class recommandée |
| `<PathProgressBar>` | Visualisation étapes (timeline horizontale) |
| `<EmptyState>` | Cohérent design system |

## User flows clés

### Flow 1 : Découverte → Parcours → Inscription

```
Landing → [Découvrir les classes]
        → /classes (catalogue, je trouve "Pitcher pour lever")
        → /classes/{slug} (je lis détail, je vois Antoine, c'est cher 80€)
        → /me/profile (je me logue, je déclare Pitch + Funding cibles)
        → /me/path/generate
        → 12-30s de loader
        → /me/path (je vois Pitch en étape 1 → class d'Antoine)
        → Click "Voir cette class"
        → /classes/{slug}/apply
        → Form (date pref, motivation, niveau actuel)
        → Submit → POST /v1/enrolments {status: applied}
        → Toast "Antoine examinera ta candidature"
```

### Flow 2 : Régénération parcours

```
/me/path
   → "Mes skills cibles ont changé" 
   → /me (modifier skills cibles)
   → /me/path → [Régénérer]
   → Modal : "Régénérer ?"
   → POST /v1/me/path/regenerate (logs dans student_path_regeneration_log)
   → Loader
   → Nouveau parcours avec nouvelles étapes
```

## Inspirations spécifiques C

| Source | Quoi piquer |
|---|---|
| [Maven catalog](https://maven.com) | Catalogue éditorial avec photos chaleureuses |
| [Reforge](https://reforge.com) | Détail program : sections claires + curriculum |
| [Polywork](https://polywork.com) | Profil utilisateur : skills tagged + parcours |
| [Khan Academy paths](https://khanacademy.org) | Parcours linéaire avec étapes débloquées |
| [Mira book-web](https://hello-mira.com) | Notre own brand : warm beige + photos nomad |
