# Design proposal — Groupe A — Mira Mentors

> Voir d'abord : [`hackathon/design-system.md`](../../design-system.md) pour les tokens partagés.

## Vue d'ensemble

| Audience | Surface | Auth |
|---|---|---|
| Visiteur (anonyme) | Front public mentors | Public |
| Nomade | Tunnel candidature 8 étapes + suivi | Login Supabase |
| Admin HLMR | Backoffice modération | Login + role `admin` |

## Sitemap

```
PUBLIC
├── /                            Landing (hero + 3 mentors featured)
├── /mentors                     Annuaire mentors (liste filtrée)
└── /mentors/{slug}              Fiche détail mentor

AUTH (candidat)
├── /mentors/apply               Hub tunnel (redirige vers la step en cours)
├── /mentors/apply/step-1        Identité (nom, prénom, nomadisme, masterclasses)
├── /mentors/apply/step-2        Choix méthode (LinkedIn / CV / manuel)
├── /mentors/apply/step-3        Profil pro (auto-prérempli si CV/LinkedIn)
├── /mentors/apply/step-4        Suggestions classes IA + choix
├── /mentors/apply/step-5        Format + rythme + villes de la classe
├── /mentors/apply/step-6        Simulation revenu
├── /mentors/apply/step-7        Récap + accept conditions + submit
└── /me/application              Suivi état (édition tant que !in_review)

AUTH (admin)
├── /admin/applications          Liste candidatures (filtrable par status)
└── /admin/applications/{id}     Détail + décision (refuser / examen / valider)
```

## Header de progression (présent sur toutes les /apply/step-*)

```
┌─────────────────────────────────────────────────────────┐
│ Mira LEARN                                  👤 Emma R.  │
├─────────────────────────────────────────────────────────┤
│ ●━━━━●━━━━●━━━━○────○────○────○                          │
│ 1    2    3    4    5    6    7                          │
│ Identité — Méthode — Profil — Suggestions — Format —    │
│ Tarification — Récap                                     │
└─────────────────────────────────────────────────────────┘
```

État : `●` = complétée, `○` = à venir, contour mira-red = step active. Footer permanent : `← Retour` (left) + `Continuer →` (right), `Brouillon enregistré` (centré, muted).

## Écrans clés

### Step 1 — Identité

```
┌─────────────────────────────────────────────────────────┐
│ Étape 1 / 7 — Faisons connaissance                       │
│                                                           │
│ Prénom *               [Emma_____________]                │
│ Nom *                  [Rossi____________]                │
│                                                           │
│ Tu es nomade depuis quelle année ?                       │
│                       [2021 ▼]                            │
│                                                           │
│ Combien de masterclasses as-tu déjà données ?            │
│                       [ Aucune | 1-3 | 4-10 | 10+ ]      │
│                                                           │
│ ⚠️ Une fois soumis, ces infos seront verrouillées.        │
│                                                           │
│ [Annuler]                              [Continuer →]      │
└─────────────────────────────────────────────────────────┘
```

### Step 2 — Méthode d'import

```
┌─────────────────────────────────────────────────────────┐
│ Étape 2 / 7 — Comment veux-tu te raconter ?              │
│                                                           │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ │ 🔗             │  │ 📎             │  │ ✍️             │
│ │ LinkedIn       │  │ CV PDF         │  │ Manuel         │
│ │                │  │                │  │                │
│ │ On extrait tes │  │ On upload ton  │  │ Tu remplis     │
│ │ infos en 30 s. │  │ PDF + extract. │  │ tout à la main │
│ │                │  │                │  │ (5-10 min)     │
│ │ [Coller URL]   │  │ [Choisir PDF]  │  │ [Continuer]    │
│ └────────────────┘  └────────────────┘  └────────────────┘
│                                                           │
│ Tu pourras tout éditer à la prochaine étape.             │
│                                                           │
│ [← Retour]                                                │
└─────────────────────────────────────────────────────────┘
```

### Step 3.1 — Ingestion (loading + preview)

```
┌─────────────────────────────────────────────────────────┐
│ Étape 3 / 7 — Mira lit ton profil…                      │
│                                                           │
│                  ●●●●●  (skeleton pulse)                  │
│                                                           │
│              On a extrait :                              │
│              ✓ 3 expériences                             │
│              ✓ 5 skills candidates                       │
│              ✓ Bio LinkedIn (à éditer)                   │
│                                                           │
│              [Continuer → édition →]                     │
└─────────────────────────────────────────────────────────┘
```

### Step 3.2 — Profil pro (form prérempli)

```
┌─────────────────────────────────────────────────────────┐
│ Étape 3 / 7 — Ton profil pro                             │
│                                                           │
│ ─── Expériences (3) ─── [+ Ajouter]                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ≡ Founder · Brand Studio · 2023 — now    [Édit] [×] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ≡ Brand Lead · Stripe · 2020 — 2023      [Édit] [×] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ≡ Designer · Spotify · 2018 — 2020       [Édit] [×] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ─── Skills proposées (3) ───                             │
│ [Brand design ⭐] [Content strategy] [Webflow]            │
│ [+ Ajouter une skill]                                    │
│                                                           │
│ ─── Bio courte (255c) ───                                │
│ [Designer brand + content créatrice DTC___________]      │
│                                                           │
│ ─── Bio longue ───                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ J'ai construit 3 marques DTC à 1M€+ ARR ces 5 …     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ─── Ce que tu aimerais transmettre & pourquoi ───       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Je veux partager ce qui marche réellement en DTC… │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [← Retour]                              [Continuer →]    │
└─────────────────────────────────────────────────────────┘
```

### Step 4 — Suggestions de classes par IA

```
┌─────────────────────────────────────────────────────────┐
│ Étape 4 / 7 — Choisis ta première Mira Class             │
│                                                           │
│ Mira AI t'a préparé 3 classes que tu pourrais animer.    │
│ On a croisé tes skills avec ce que nos apprenants        │
│ cherchent. Adopte, modifie, ou propose une autre.        │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Construire ta brand DTC en 30 jours                 │ │
│ │ De zéro à une identité de marque cohérente : …      │ │
│ │ [Brand design ⭐] [Content strategy]                 │ │
│ │ 🔥 31 nomades cherchent — 0 mentor enseigne          │ │
│ │ [Adopter] [Modifier] [Pas pour moi]                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Webflow pro : du landing au site converting          │ │
│ │ Construire un site Webflow qui convertit, sans dev… │ │
│ │ [Webflow ⭐] [UI Design]                              │ │
│ │ 👥 22 nomades cherchent — 4 mentors enseignent       │ │
│ │ [Adopter] [Modifier] [Pas pour moi]                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Content stratégie pour solo founders                 │ │
│ │ Définir sa ligne édito, son pipeline, ses canaux.   │ │
│ │ [Content strategy ⭐] [Brand design]                  │ │
│ │ 🌱 12 nomades cherchent — 0 mentor enseigne          │ │
│ │ [Adopter] [Modifier] [Pas pour moi]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [↻ Regénérer 3 nouvelles]   ou  [✍️ Proposer la mienne]   │
│                                                           │
│ [← Retour]                                                │
└─────────────────────────────────────────────────────────┘
```

L'option "Proposer la mienne" ouvre un mini-form inline : titre + description + skills.

### Step 5 — Format, rythme, lieux

```
┌─────────────────────────────────────────────────────────┐
│ Étape 5 / 7 — Comment veux-tu l'animer ?                 │
│                                                           │
│ Classe choisie : "Construire ta brand DTC en 30 jours"   │
│                                                           │
│ ─── Durée totale estimée ───                             │
│ Heures collectives (sessions groupe)   [12___] h         │
│ Heures individuelles (1-to-1 mentoring) [4____] h        │
│                                                           │
│ ─── Rythme ───                                           │
│ ◯ Hebdo (1 séance/sem)                                   │
│ ◉ Bi-hebdo (1 séance / 2 sem)                            │
│ ◯ Workshop mensuel (½ journée)                            │
│ ◯ Intensif week-end                                      │
│ ◯ Async / self-paced                                     │
│                                                           │
│ ─── Format ───                                           │
│ ◯ En ligne uniquement                                    │
│ ◉ En physique                                            │
│ ◯ Hybride (online + IRL)                                 │
│                                                           │
│ ─── Villes envisagées (physique) ───                     │
│ [Lisbonne 🇵🇹 ×] [Barcelone 🇪🇸 ×] [Berlin 🇩🇪 ×]          │
│ [+ Ajouter une ville]                                    │
│                                                           │
│ [← Retour]                              [Continuer →]    │
└─────────────────────────────────────────────────────────┘
```

### Step 6 — Simulation revenu

```
┌─────────────────────────────────────────────────────────┐
│ Étape 6 / 7 — Combien ça peut te rapporter ?            │
│                                                           │
│ Tu nous proposes les tarifs — la plateforme retient 25 %  │
│ de marge (frais d'organisation + promotion).             │
│                                                           │
│ ─── Tarif recommandé / heure ───                         │
│ Heure collective (par apprenant)      [40___] €          │
│ Heure individuelle (1-to-1)           [80___] €          │
│ Capacité de la session                [5____] apprenants │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                                           │
│ ─── Simulation ───                                       │
│   Revenue brut session :        12 h × 40 € × 5 + 4 h × 80 €
│                                = 2 400 € + 320 €         │
│                                = **2 720 €**              │
│                                                           │
│   Frais plateforme (25 %)      = **−680 €**               │
│   Tes revenus nets             = **2 040 €**              │
│                                                           │
│   Coût par apprenant            = 544 € pour 16 h         │
│                                                           │
│ 💡 Indicatif : la rémunération réelle dépend du nombre    │
│    d'inscrits et des sessions effectivement données.     │
│                                                           │
│ [← Retour]                              [Continuer →]    │
└─────────────────────────────────────────────────────────┘
```

### Step 7 — Récap + accept + submit

```
┌─────────────────────────────────────────────────────────┐
│ Étape 7 / 7 — Récapitulatif                              │
│                                                           │
│ Vérifie tes infos avant de soumettre.                    │
│                                                           │
│ ─── Identité ───                          [Modifier]     │
│ Emma Rossi · nomade depuis 2021 · 1-3 masterclasses     │
│                                                           │
│ ─── Profil pro ───                        [Modifier]     │
│ 3 expériences · 3 skills · bio complète                  │
│                                                           │
│ ─── Première Mira Class ───               [Modifier]     │
│ "Construire ta brand DTC en 30 jours"                    │
│ Bi-hebdo physique · Lisbonne / Barcelone / Berlin        │
│ 12h collectives + 4h indiv · 5 apprenants                │
│ Tarifs : 40 €/h coll · 80 €/h indiv                       │
│ Estim. revenu net : 2 040 € / session                    │
│                                                           │
│ ─── Conditions ───                                       │
│ [✓] J'accepte la charte qualité Mira Mentor              │
│ [ ] Je certifie que les infos sont exactes               │
│                                                           │
│ [← Retour]               [Soumettre ma candidature →]    │
└─────────────────────────────────────────────────────────┘
```

### Step 8 — Suivi état candidature

```
┌─────────────────────────────────────────────────────────┐
│ Ma candidature Mira Mentor                               │
│                                                           │
│  ●━━━━━━━━●━━━━━━━━○━━━━━━━━○                            │
│  Soumis     In review   Validé    En ligne               │
│                                                           │
│ Statut actuel : ●  submitted (il y a 2 h)                │
│                                                           │
│ ─── Récap soumis ───                                     │
│ Identité, profil, première Mira Class, tarifs.           │
│ [Voir les détails ▾]                                      │
│                                                           │
│ Tu peux encore modifier ta candidature                   │
│ tant qu'un admin ne l'examine pas (statut "in review").  │
│ L'identité (nom / prénom / nomadisme) reste verrouillée. │
│                                                           │
│ [Modifier ma candidature]    [Supprimer ma candidature]  │
└─────────────────────────────────────────────────────────┘
```

Variantes selon status :
- `in_review` → bandeau gold "Un admin examine ta candidature, plus de modifs possibles."
- `validated` → bandeau success "🎉 Tu es Mira Mentor ! Accès au dashboard…"
- `rejected` → bandeau error + decision_reason de l'admin + bouton "Re-postuler dans 30 j"

### Backoffice — `/admin/applications` + `/admin/applications/{id}`

Inchangés par rapport à la première version (liste + détail avec décision admin), mais la **fiche détail admin** affiche désormais :
- Identité + nomadisme + prior_masterclasses
- Profil pro complet
- Bouton "Voir CV importé" (si applicable)
- **Section Mira Class proposée** : titre + description + skills + format/rythme/villes + simulation revenu
- Section décision (textarea + 3 boutons)

## Composants à créer

| Composant | Réutilisation | Note |
|---|---|---|
| `<ApplyHeader>` | Toutes les pages /apply/* | Progress dots + breadcrumb + bouton "← Retour" |
| `<ApplyFooter>` | Toutes les pages /apply/* | "Brouillon enregistré" + boutons retour / continuer |
| `<MethodCard>` | Step 2 | Card avec icône + titre + sous-titre + CTA |
| `<ExperienceItem>` | Step 3.2 | Drag handle + role/company/dates + actions édit / delete |
| `<SkillChipEditable>` | Steps 3.2, 4 | Chip avec étoile primaire toggle + bouton × |
| `<ClassSuggestionCard>` | Step 4 | Titre + description + skills + demand signal + 3 actions |
| `<RythmRadioGroup>` | Step 5 | 5 options radio avec exemples concrets |
| `<CityChip>` | Step 5 | Chip avec drapeau + nom + × |
| `<RevenueSimulator>` | Step 6 | Inputs + bloc calculé en live (vert) |
| `<ApplicationStatusTracker>` | Step 8 + admin | Progress dots + status badge + actions contextuelles |
| `<MentorCard>` | Annuaire | Identique au design v1 |
| `<JourneyItem>` | Fiche mentor | Identique au design v1 |
| `<ClassCardCompact>` | Fiche mentor | Identique au design v1 |
| `<StatusBadge>` | Partout | submitted/in_review/validated/rejected |

## User flow démo end-to-end

```
Login Emma → /mentors/apply (auto-redirige sur step où elle s'est arrêtée)
    Step 1  → first_name=Emma, last_name=Rossi, nomad_since=2021, prior=1-3
    Step 2  → choisit LinkedIn → coller https://linkedin.com/in/emma-rossi
    Step 3.1 → loader 5 s → preview 3 expériences + 5 skills candidates
    Step 3.2 → edit/confirme expériences, garde 3 skills, ajoute bio + transmission_pitch
    Step 4  → 3 suggestions Mira → adopte "Construire ta brand DTC en 30 jours"
    Step 5  → 12 h coll + 4 h indiv, bi-hebdo, physique, [Lisbonne, Barcelone, Berlin]
    Step 6  → 40 €/h coll + 80 €/h indiv → simu 2 040 € net / session
    Step 7  → check conditions → SUBMIT → toast "Candidature reçue"
    /me/application → status submitted (il y a quelques sec)

Login admin → /admin/applications → voit Emma submitted → click
    /admin/applications/{id} → lit profil + classe proposée → comment "Excellent, on prend"
    → click VALIDER → backend crée mentor_profile + slug + passe la mira_class en validated_draft
    → toast "Emma est maintenant Mira Mentor"

Visiteur (anonyme) → /mentors → voit Emma en bas (rating 0, 1 classe proposée)
```

## Inspirations spécifiques A

| Source | Quoi piquer |
|---|---|
| Typeform multi-step | 1 question / écran, progression visible, sobre |
| Stripe Atlas onboarding | Ingestion async + preview avant validation |
| AngelList apply | Ingestion CV/LinkedIn → form prérempli |
| Notion AI generate | Suggestions IA inline : adopt / modify / reject |
| Stripe Atlas pricing simulator | Inputs + simu live en bas, claire et chiffrée |
| YC application | Récap final clair + bouton submit unique |
| Linear settings | Backoffice sobre clavier-friendly |
