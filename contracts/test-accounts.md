# Comptes de test — Hackathon Mira Learn

Liste canonique des **22 comptes utilisateurs** seedés dans le projet Supabase `hackathon`.

⚠️ **Auth NOT shared across branches** — Supabase Auth est isolé par branche. Les 4 preview branches (`groupe-a`, `groupe-b`, `groupe-c`, `groupe-d`) ont chacune leur propre table `auth.users`. → Le seed est exécuté **une fois par branche**, donc les `user_id` Supabase sont différents entre branches (mais les emails / metadata sont identiques).

Voir `hackathon/seeds/README.md` pour la procédure de seed par branche.

Tous les comptes ont le **même password** : `Hackathon2026!`

---

## Conventions

- **Domaine email** : `@hackathon.test` (pas un vrai TLD — pas d'emails envoyés, mais Supabase accepte tout)
- **Password** : `Hackathon2026!` (identique pour tous, simplicité hackathon)
- **`user_metadata.role`** : `mentor` / `nomad` / `admin` (utilisé par `app/core/auth.py` pour les checks)
- **`user_metadata.display_name`** : prénom + nom (pour affichage UI)
- **UUIDs** : générés à la création — listés ci-dessous après seed

---

## Mira Mentors (9 comptes)

### Mentors validés (5) — visibles dans l'annuaire Group A + ont des classes Group B

| Email | Display name | Role | Expertise dominante | Note moyenne | Classes données | Scénarios démo |
|---|---|---|---|---|---|---|
| `antoine.martin@hackathon.test` | Antoine Martin | mentor | Pitch investor + Funding strategy | 4.8 | 12 | **Star mentor démo** — annuaire featured, sa class "Pitcher pour lever 500k" est la flagship pour le storytelling end-to-end |
| `marie.dupont@hackathon.test` | Marie Dupont | mentor | UI Design + Webflow mastery | 4.7 | 9 | Mentor design, top rated |
| `david.cohen@hackathon.test` | David Cohen | mentor | Growth Marketing B2B + Go-to-market | 4.6 | 15 | Mentor avec le plus de classes (annuaire tri "classes_given_count") |
| `sophie.bernard@hackathon.test` | Sophie Bernard | mentor | Lean Startup + Business Model Canvas | 4.5 | 7 | Mentor business |
| `lucas.garcia@hackathon.test` | Lucas Garcia | mentor | Product Management + UX research | 4.3 | 3 | Mentor récemment validé, peu de classes encore |

### Mentors candidats en cours (3) — pour démo Group A workflow candidature

| Email | Display name | Application status | Scénario démo |
|---|---|---|---|
| `emma.rossi@hackathon.test` | Emma Rossi | `submitted` | Candidate fraîche, à valider en live pendant la démo |
| `nathan.kim@hackathon.test` | Nathan Kim | `submitted` | Candidat avec CV importé + skills extraites par IA |
| `chloe.dubois@hackathon.test` | Chloé Dubois | `in_review` | Candidate dont l'admin a commencé l'examen |

### Mentor rejeté (1) — pour démo flow rejection

| Email | Display name | Application status | Scénario démo |
|---|---|---|---|
| `paul.weiss@hackathon.test` | Paul Weiss | `rejected` | Démontrer le flow `decision_reason` rempli — refus pour "expertise insuffisamment documentée" |

---

## Mira Nomads (10 comptes)

| Email | Display name | Role | Skills cibles | Statut | Scénarios démo |
|---|---|---|---|---|---|
| `anna.lopez@hackathon.test` | Anna Lopez | nomad | Pitch investor, Funding | Inscrite class Antoine | **Star nomad démo** — protagoniste du storytelling end-to-end (s'inscrit à la class d'Antoine, suit le programme, fait QCM, valide skill) |
| `marco.silva@hackathon.test` | Marco Silva | nomad | UI Design, Figma mastery | Parcours actif Group C | Démo génération parcours apprenant : 4 skills cibles → 5 classes recommandées |
| `lea.bauer@hackathon.test` | Léa Bauer | nomad | Aucune cible définie | Profil vide | Démo "Définis tes objectifs" — point d'entrée Group C parcours |
| `julien.morel@hackathon.test` | Julien Morel | nomad | Lean Canvas, Growth | Plusieurs classes complétées | Profil mature, multi-skills validées |
| `nora.ahmed@hackathon.test` | Nora Ahmed | nomad | Pitch investor | Inscrite + active sur QCM | Démo Group D : prend des QCM, tentatives multiples |
| `pierre.lambert@hackathon.test` | Pierre Lambert | nomad | Pitch investor | En **waitlist** session Antoine | Démo Group B : capacité atteinte, gestion waitlist |
| `clara.kovac@hackathon.test` | Clara Kovač | nomad | Aucune | Compte fraîchement créé | Démo onboarding nomad (Group C) |
| `tom.evans@hackathon.test` | Tom Evans | nomad | Public speaking, Storytelling | Parcours `completed` | Démo Group C : parcours achevé, certificats |
| `eva.fischer@hackathon.test` | Eva Fischer | nomad | Pitch investor | Inscrite + prend beaucoup de notes | Démo Group D : notes personnelles + organisation IA |
| `samuel.nguyen@hackathon.test` | Samuel Nguyen | nomad | UI Design | A annulé une inscription | Démo Group B : cancellation flow |

---

## Admins HLMR (3 comptes)

| Email | Display name | Role | Scénarios démo |
|---|---|---|---|
| `admin@hackathon.test` | Admin HLMR | admin | Compte admin principal — valide les candidatures mentors (Group A) + classes (Group B) |
| `reviewer@hackathon.test` | Reviewer Mira | admin | Compte secondaire pour démontrer le multi-admin |
| `cedric@hackathon.test` | Cédric Tumminello | admin | Compte CEO pour scénarios de démo "vue dirigeante" |

---

## Storytelling end-to-end (démo jury J+3)

Le scénario tournant autour de **Antoine** (mentor) et **Anna** (nomad) :

1. **Group A — Front public mentor** : 
   - Le visiteur consulte l'annuaire → voit `antoine.martin` en top de la liste (rating 4.8, 12 classes données)
   - Visite la fiche d'Antoine, voit ses skills (Pitch investor, Funding strategy)
   - Antoine (déjà validé) ne re-candidate pas. Démo candidature : on prend **`emma.rossi`** qui est en `submitted` et l'admin la valide en live

2. **Group A → Group B** :
   - L'admin (compte `admin`) valide la candidature d'Emma + ses 2 classes proposées
   - Mais pour la démo opérationnelle, on bascule sur **`antoine.martin`** déjà validé qui se connecte au backoffice

3. **Group B — Backoffice mentor** :
   - Antoine se connecte → voit ses classes (dont "Pitcher pour lever 500k" validated_draft)
   - Il enrichit module 1 avec matériel + QCM (généré par IA OpenRouter)
   - Il publie la class + programme une session à Barcelone (5-26 juillet 2026, capacité 8)

4. **Group C — Front public Mira Learn** :
   - **`anna.lopez`** se connecte (avec ses target_skills : Pitch investor + Funding)
   - L'IA lui génère un parcours : 4 étapes, dont étape 1 = skill "Pitch investor"
   - Anna voit la class d'Antoine recommandée → click → détail → remplit form validation → s'inscrit
   - Antoine accepte sa candidature

5. **Group D — Mobile Flutter** :
   - Anna ouvre l'app `mira_learn` → onglet Programmes → voit sa class
   - Carte mondiale : 15 sessions actives globe → click Barcelone → voit la class d'Antoine
   - Module 1 débloqué : Anna lit les docs, prend des notes → IA organise par concept
   - Fait le QCM : score 85% → skill "Pitch investor" validée
   - Feed communauté : "Une nomade vient de valider la skill 'Pitch investor'" (anonymisé, c'est elle)

---

## Distribution par branche Supabase

Auth est **isolée par branche** Supabase. Le seed est donc exécuté **une fois par branche** :

| Branche | Host Supabase | Output JSON |
|---|---|---|
| `main` | `REPLACE_WITH_SUPABASE_MAIN_URL.supabase.co` | `test_user_ids_main.json` |
| `groupe-a` | `REPLACE_WITH_SUPABASE_GROUPE_A_URL.supabase.co` | `test_user_ids_groupe-a.json` |
| `groupe-b` | `REPLACE_WITH_SUPABASE_GROUPE_B_URL.supabase.co` | `test_user_ids_groupe-b.json` |
| `groupe-c` | `REPLACE_WITH_SUPABASE_GROUPE_C_URL.supabase.co` | `test_user_ids_groupe-c.json` |
| `groupe-d` | `REPLACE_WITH_SUPABASE_GROUPE_D_URL.supabase.co` | `test_user_ids_groupe-d.json` |

Les **emails et métadonnées** sont identiques entre branches (même liste canonique), mais les `user_id` Supabase **diffèrent** car chaque branche a son propre Auth.

Les **données métier** (profils, classes, inscriptions, etc.) sont propres à chaque branche et référencent le `user_id` local de cette branche.

---

## Comment seed les comptes

Voir `hackathon/seeds/README.md` pour la procédure complète (4 exécutions, 1 par branche, avec variables d'env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BRANCH_LABEL`).

---

## Reprenabilité post-hackathon

Ces comptes test sont **fictifs et hackathon-only**. Post-hackathon :
- Suppression de la branche `main` du projet → tous les comptes Auth disparaissent
- Création d'un projet Supabase prod dédié à Mira Learn V1 (avec vrais comptes mentors/nomads)
- Pas de migration auth → tout est rebuild from scratch
