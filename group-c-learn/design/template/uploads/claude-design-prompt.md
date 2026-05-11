# Prompt Claude Design — Groupe C — Mira Learn (front public apprenant + parcours IA)

> Prompt complet à coller dans Claude Design pour générer la maquette du front apprenant.

---

## CONTEXTE PRODUIT

**Mira Learn** est la plateforme edtech de Hello Mira (digital nomads francophones). Les Groupes A et B livrent l'offre (mentors + classes). **Le Groupe C livre le front public apprenant** : c'est ici qu'un nomade découvre Mira Learn, comprend ce qu'il peut apprendre, déclare ses skills cibles, et **se voit générer un parcours d'apprentissage personnalisé par IA** qui croise ses objectifs avec le catalogue de Mira Class.

Tonalité : **chaleureuse, éditoriale, premium mais accessible**. C'est le visage marketing premium de Mira — chaque écran doit donner envie de prendre un café à Lisbonne avec un mentor, pas de remplir un formulaire RH. **Beaucoup d'espace blanc warm beige, photos chaleureuses de digital nomads, typo serif sur les hero.**

## DESIGN SYSTEM (REPRISE DES GROUPES A + B)

### Couleurs Mira (palette exclusive)

| Token | Hex | Usage |
|---|---|---|
| `mira-red` | `#E6332A` | CTA primary, accents éditoriaux, étape active parcours |
| `warm-beige` | `#EFEAE5` | Background page principal |
| `beige-deep` | `#E2DCD3` | Chips neutres, hover surface |
| `charcoal` | `#1D1D1B` | Texte principal |
| `muted` | `#888888` | Texte secondaire, labels |
| `muted-soft` | `#B6B0A6` | Bordures subtiles |
| `rule` | `#E5E7EB` | Bordures cards / inputs |
| `card-bg` | `#FFFFFF` | Surface cards |
| `success` | `#16A34A` | Skill validée, étape completed |
| `error` | `#EF4444` | Erreurs, étape locked si pré-requis manquant |
| `gold` | `#D4A853` | Étoiles rating, certificats, badges premium |
| `sage-soft` | `#D6E3D0` | Chips skill primaire, étape "in progress" |

### Typo + spacing

- **Manrope** (sans, 400/500/600/700) — UI par défaut
- **Playfair Display** (serif, 400/700) — hero h1 landing, titre fiche class, hero parcours
- Tailles : hero h1 48-56 px Playfair / page h1 36 px Manrope / section h2 24 / card title 16 semibold / body 14 / caption 12 muted
- Échelle 4 px, cards radius 16 sans ombre, boutons radius 12 hauteur 44

## SITEMAP

```
PUBLIC
├── /                            Landing chaleureux (hero + classes featured + how it works)
├── /classes                     Catalogue (filtres + grid)
├── /classes/{slug}              Détail class (mentor + modules + sessions)
└── /community                   Carte / annuaire des apprenants (opt-in)

AUTH (apprenant)
├── /me                          Mon profil (skills cibles, bio, country)
├── /me/path                     Mon parcours d'apprentissage
├── /me/path/generate            Génération IA du parcours (CTA)
├── /me/enrolments               Mes inscriptions actuelles
└── /classes/{slug}/apply        Form d'intention d'inscription
```

## ÉCRANS À GÉNÉRER (8 ÉCRANS)

### 1. `/` — Landing chaleureux

Header public sticky : logo Mira + nav (`Mentors`, `Catalogue`, `Communauté`) + boutons à droite (`Se connecter` ghost, `Découvrir les classes` primary).

**Hero section** :
- Titre Playfair Display 56 px : "Apprends en voyageant. Avec des mentors qui ont fait le chemin."
- Sous-titre muted (max 2 lignes) : "Mira Learn t'aide à acquérir les skills dont tu as besoin auprès de mentors validés, en présentiel ou en virtuel."
- 2 CTAs : `Découvrir les classes` (primary), `Devenir mentor` (secondary)
- Photo hero 16:9 chaleureuse (digital nomad en coworking, latte art, ou paysage Lisbonne / Bali — utiliser placeholder Unsplash)

**Section "Classes featured"** (3 cards en row) :
- Pitcher pour lever 500k € — Antoine Martin — 80 €
- UI Design pour SaaS B2B — Marie Dupont — 60 €
- Growth B2B en 8 semaines — David Cohen — 49 €

Chaque card : photo 16:9, titre Manrope 18 semibold, ligne mentor (avatar mini + nom), prix mira-red, chips skills (2-3), bouton ghost `Découvrir →`.

**Section "Comment ça marche"** (4 étapes numérotées) :
1. Définis ta skill cible
2. L'IA te crée un parcours sur mesure
3. Tu suis les classes recommandées
4. Tu valides la skill, tu rejoins une communauté

**Section "Témoignages"** (optionnel, 2-3 quotes apprenants chaleureuses)

**Footer** : links Hello Mira, contact, mentions légales.

### 2. `/classes` — Catalogue

Header public + breadcrumb invisible.

Titre Playfair 36 px "Catalogue" + sous-titre muted "3 Mira Classes published — toutes animées par des mentors validés."

**Filtres en row chips** :
- Skill (multi-select chips déroulants)
- Catégorie (Business / Design / Tech / Soft / Lifestyle)
- Format (Physique / Virtuel / Hybride)
- Prix max (slider 0-200 €)
- Reset filters

**Grid 2 colonnes** (responsive 1 col mobile) de **class cards** :

```
┌────────────────────────────────────────┐
│ [photo 16:9 placeholder Unsplash]      │
│                                          │
│ Pitcher pour lever 500k €               │
│ Construis ton deck investor + délivre   │
│                                          │
│ ◯ Antoine Martin · ★ 4.8 (47)            │
│ live hybride · 6 semaines · max 8        │
│ [Pitch investor] [Funding]              │
│                                          │
│ 80 €                  [Découvrir →]      │
└────────────────────────────────────────┘
```

### 3. `/classes/{slug}` — Détail class

Header public + breadcrumb `← Catalogue`.

**Hero class** (grid 2 colonnes desktop) :
- Gauche : photo 16:9 + chips skills + format/durée badge
- Droite : titre Playfair 36, subtitle, prix mira-red 32px, bouton primary `Postuler à une session →`

**Section mentor** (1 card en row) :
- Avatar large + nom + headline + rating + lien `Voir tous ses cours →`

**Section "À propos"** : markdown description (3-4 paragraphes)

**Section "Modules"** (timeline verticale) :
```
1. Construire le narratif investor (3 h)
   Storytelling + problème + solution

2. Design + délivery du deck (4 h)
   Deck visuel + pitch oral
```

**Section "Sessions disponibles"** (cards row) :
```
┌──────────────────────────────────────────────┐
│ 📍 Barcelone, Espagne                         │
│ 5-26 juillet 2026                             │
│ Hybride · 8 places · 3 inscrits · 1 waitlist │
│                              [Postuler →]    │
├──────────────────────────────────────────────┤
│ 🌐 Virtuel — sessions live + replays          │
│ Démarre 1er sept · 10 places · 0 inscrit      │
│                              [Postuler →]    │
└──────────────────────────────────────────────┘
```

### 4. `/me` — Mon profil apprenant

Header auth + sidebar légère gauche (160 px) : `Mon profil`, `Mon parcours`, `Mes inscriptions`, `Paramètres`.

**Header de page** :
- Avatar 96 px + nom Playfair 28 + headline éditable
- 📍 Country picker (icône drapeau + ville)
- Bouton secondary `Modifier`

**Section "Mes skills cibles"** :
- Chips éditables (clic = remove, `+ Ajouter` ouvre autocomplete depuis catalogue)
- Empty state : "Définis tes skills cibles pour qu'on te génère ton parcours d'apprentissage."

**Section "Mes skills validées"** :
- Chips success-colored avec icône check
- Empty state encourageant : "Passe des QCM pour valider tes skills sur l'app mobile."

**Section "Visibilité"** :
- Radio `Public` (visible carte communauté) / `Privé` (default)
- Texte explicatif muted

**Section "Mon parcours"** :
- Si parcours actif : card preview avec progression bar + bouton primary `Voir mon parcours →`
- Sinon : empty state avec CTA `✨ Génère ton parcours sur mesure →`

**Section "Mes inscriptions"** (liste simple) :
- Pitcher pour lever 500k € — applied il y a 2 j
- (autre class…)

### 5. `/me/path/generate` — Génération parcours

Page focus centrée (max-w-xl mx-auto), pas de sidebar.

Titre Playfair 42 "Génère ton parcours sur mesure"
Sous-titre muted "On va te proposer un parcours d'apprentissage à partir de tes objectifs."

**Section "Tes skills cibles"** :
- Chips déjà déclarées + `+ Ajouter`
- Min 1 skill requise

**Section "Ton horizon"** : radio 3 options
- ◯ 3 mois — Sprint focus
- ◉ 6 mois — Rythme soutenable
- ◯ 1 an — Approfondi

**Section "Ton budget total"** : input numérique € + slider
- Range 0 € → 500 €
- Tooltip "Tu peux toujours t'inscrire à plus de classes ensuite."

**Section "Ton CV (optionnel)"** :
- Drop zone PDF
- Texte muted : "On identifiera tes skills déjà acquises pour ne pas te les reproposer."

**Bouton primary large** centré : `✨ Générer mon parcours`

État loading : page entière avec animation chaleureuse + texte rotatif "Mira analyse tes objectifs…" → "On croise avec le catalogue…" → "Construction du parcours…"

### 6. `/me/path` — Mon parcours

Header auth + sidebar légère.

**Header de page** :
- Titre Playfair 36 "Mon parcours"
- Sous-titre muted : "Pitch + Funding · estimé 6 mois · ~80 € total"
- Bouton ghost à droite `↻ Régénérer`

**Timeline verticale** des étapes :

```
●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Étape 1 (in_progress)
Maîtriser : Pitch investor

Class recommandée :
┌──────────────────────────────────────┐
│ Pitcher pour lever 500k €            │
│ Antoine Martin · 80 €                 │
│ [Voir cette class →]                  │
└──────────────────────────────────────┘

« Class flagship d'Antoine pour valider la skill pitch. »

●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⌛ Étape 2 (locked)
Maîtriser : Funding strategy

« La même class couvre aussi funding strategy.
  Étape débloquée quand l'étape 1 est validée. »

●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

États visuels :
- `in_progress` : dot mira-red + ring sage-soft + titre charcoal + card class active
- `locked` : dot muted + titre muted + class grisée
- `completed` : dot success + titre success + check mark + lien `→ Voir certificat`

**Footer du parcours** : "Cette recommandation est issue de Mira AI · dernière mise à jour il y a 2 j."

### 7. `/classes/{slug}/apply` — Form intent inscription

Centré max-w-2xl, sobre.

Header :
- Breadcrumb `← Class : Pitcher pour lever 500k €`
- Titre Playfair "Postuler à cette Mira Class"
- Sous-titre muted "Antoine examinera ta candidature et te répondra sous 48 h."

**Form** :

**Section "Session souhaitée"** : radio cards
- 📍 Barcelone — 5-26 juillet
- 🌐 Virtuel — démarre 1er sept

**Section "Ton niveau actuel"** : radio (5 options)
- Débutant complet
- Quelques bases
- Intermédiaire
- Avancé
- Expert (je veux peaufiner)

**Section "Ton objectif concret"** : textarea (200-500c)
Placeholder : "Décris en 2-3 phrases ce que tu veux concrètement obtenir à la fin de cette class. Ex : 'lever ma première seed de 500k en automne 2026'."

**Section "Disponibilité"** : checkboxes (Soir / Weekend / Journée semaine)

**Footer** : `← Annuler` (ghost) + `Soumettre ma candidature →` (primary)

### 8. `/community` — Carte communauté

Header public.

Titre Playfair 36 "La communauté Mira" + sous-titre "Les apprenants qui acceptent d'être visibles partagent leurs skills cibles + leur ville."

**Vue par défaut** : grid de **profil cards** (mode liste, pas vraie carte interactive — out of scope MVP).

```
┌────────────────────────────────────────┐
│ ◯ Anna Lopez                            │
│ 📍 Lisbonne, PT · nomade depuis 2021    │
│ Cible : Pitch investor, Funding         │
│ ★ Skill validée : Public speaking       │
└────────────────────────────────────────┘
```

**Filtres** : par ville (chips), par skill cible (chips), par skill validée.

**Variante optionnelle** : un placeholder de carte mondiale style Polywork avec markers pulsants → "15 nomades visibles dans ta région". Si Claude Design sait le faire, oui ; sinon, mode liste suffit.

## VOICE & TONE (UX WRITING)

- **Tutoiement FR** partout
- **Vocabulaire** : Mira Mentor (pas "coach"), Mira Class (pas "cours"), apprenant ou nomade (pas "étudiant"), skill (pas "compétence" dans les chips), parcours (pas "learning path")
- **Ton chaleureux + concret** : "Apprends auprès de mentors qui ont fait le chemin", pas "Maximisez votre potentiel"
- **CTAs concrets** : "Découvrir les classes", "Génère ton parcours", "Postuler à cette session"
- **Empty states** : encourageants, pas culpabilisants
  - Skills vides : "Définis tes skills cibles pour qu'on te génère ton parcours d'apprentissage."
  - Parcours non créé : "On t'aide à passer du point A au point B en 4 étapes max. Démarre quand tu veux."

## PERSONAS RÉALISTES

Le user connecté pour la démo est **Anna Lopez** (avatar AL, gradient warm) :
- Bio : "Nomad designer en transition vers le SaaS"
- 📍 Lisbonne, PT
- Skills cibles : `Pitch investor` (primaire) + `Funding strategy`
- Skills validées : aucune au début (validera Pitch via QCM mobile groupe D)
- Visibilité : public

Mentors / classes proposées dans le catalogue :
- **Antoine Martin** — "Pitcher pour lever 500k €" — 80 € (flagship démo, recommandée à Anna par l'IA)
- **Marie Dupont** — "UI Design pour SaaS B2B" — 60 €
- **David Cohen** — "Growth B2B en 8 semaines" — 49 €

Autres apprenants visibles dans /community :
- **Marco Silva** (BR, UI Design cible)
- **Léa Bauer** (DE, profil vide)
- **Tom Evans** (parcours completed — démo certificats)

## INSPIRATIONS SPÉCIFIQUES C

| Source | Quoi piquer |
|---|---|
| **Maven** (`maven.com`) | Catalogue éditorial avec photos chaleureuses, fiche cohort détaillée |
| **Reforge** (`reforge.com`) | Détail program : sections claires + curriculum + témoignages |
| **Polywork** (`polywork.com`) | Profil utilisateur : skills tagged + parcours partagé |
| **Khan Academy paths** | Parcours linéaire avec étapes verrouillées + débloquées |
| **Section 4 / On Deck** | Landing premium + témoignages chaleureux |
| **Notion home page** | Mix Playfair titres + Manrope body + warm photos |

## CONTRAINTES TECH

- Le code sera intégré en **Next.js 16 + Tailwind v4 + shadcn/ui** (Button, Input, Card, Badge, Avatar, Tabs, RadioGroup, Slider, Sheet)
- **Catalogue SSR** : `/classes` fetch côté server pour SEO (Server Component)
- `/me/*` : Client Components (form interactif)
- Génération parcours : `POST /v1/me/path/generate` → loader inline avec animation rotative
- **Mobile responsive** indispensable (le catalogue est consulté beaucoup au téléphone)
- **FR uniquement**, photos via placeholder Unsplash (URLs `https://images.unsplash.com/...`)

## DEMANDE FINALE

Génère **les 8 écrans listés** avec :

- **Cohérence forte avec Groupes A + B** : mêmes tokens, mêmes atoms (Avatar, Logo, StatusBadge, Chip) — au pixel près
- **Densité chaleureuse** : plus d'espace blanc que le backoffice B, photos hero généreuses, typo serif assumée sur les titres éditoriaux
- **Loading state** explicite pour la génération du parcours (~10-15 s annoncés à l'utilisateur)
- **Empty states** soignés (point clé du Groupe C : on a 5 personas avec différents états de complétude)
- **Mobile-first** sur landing + catalogue + détail class (responsive serré)
- **Photos placeholder Unsplash** chaleureuses : digital nomades, coworking, Lisbonne, Bali, latte art, paysages

Une fois la maquette générée :
1. Montre-moi un récap des 8 écrans côte à côte
2. Indique quels composants (notamment `<ClassCard>`, `<MentorMini>`, `<SkillChip>`, `<SessionCard>`) sont réutilisables tel quel par les Groupes A et B
3. Précise quels écrans seraient adaptables mobile pour le Groupe D (l'app Flutter consomme la même API que C — certains écrans détaillés class / profil peuvent inspirer la version mobile)
