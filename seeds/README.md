# Seeds Supabase — Hackathon Mira Learn

Scripts de seeding des données test pour les 4 branches Supabase.

## ⚠️ Auth NOT shared across branches

Supabase Auth est **isolé par branche** — la branche `main` et les 4 preview branches (`groupe-a`, `groupe-b`, `groupe-c`, `groupe-d`) ont chacune **leur propre table `auth.users`**.

→ Conséquence : `seed_users.py` doit être exécuté **une fois par branche** (avec son URL + service_role).

→ Les `user_id` Supabase sont **différents** entre branches (mais les emails et metadata sont identiques, donc 4 fichiers JSON différents : `test_user_ids_{branch}.json`).

## Scripts disponibles

| Script | Quoi | Cible |
|---|---|---|
| `seed_users.py` | 22 comptes test Auth (mentors, nomads, admins) | Chaque branche séparément |
| (à venir) `seed_skills_per_branch.py` | 50 skills + 20-30 skill_relations | Chacune des 4 branches groupe-* |
| (à venir) `seed_mentors_data.py` | mentor_profiles + applications + classes seed | Branche `groupe-a` + `groupe-b` |
| (à venir) `seed_classes_data.py` | mira_class + modules + sessions + enrolments seed | Branche `groupe-b` |
| (à venir) `seed_students_data.py` | student_profiles + learning_paths | Branche `groupe-c` |
| (à venir) `seed_community_data.py` | activity_feed + map_active_sessions | Branche `groupe-d` |

## Prérequis

```bash
pip install httpx
```

## Variables d'env

| Variable | Description |
|---|---|
| `SUPABASE_URL` | URL de la branche à seeder (ex. `https://qkrmbzbeshdgyyhsktpx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret de la branche (Settings → API → Secret keys → eye icon) |
| `SUPABASE_BRANCH_LABEL` | Label utilisé pour nommer le JSON de sortie (`main`, `groupe-a`, `groupe-b`, ...) |

## Seed des 4 branches en boucle

```bash
cd hackathon/seeds

# main (référence)
export SUPABASE_URL=https://REPLACE_WITH_SUPABASE_MAIN_URL.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_main_xxx
export SUPABASE_BRANCH_LABEL=main
python seed_users.py

# groupe-a
export SUPABASE_URL=https://REPLACE_WITH_SUPABASE_GROUPE_A_URL.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_groupe_a_xxx
export SUPABASE_BRANCH_LABEL=groupe-a
python seed_users.py

# groupe-b
export SUPABASE_URL=https://REPLACE_WITH_SUPABASE_GROUPE_B_URL.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_groupe_b_xxx
export SUPABASE_BRANCH_LABEL=groupe-b
python seed_users.py

# groupe-c
export SUPABASE_URL=https://REPLACE_WITH_SUPABASE_GROUPE_C_URL.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_groupe_c_xxx
export SUPABASE_BRANCH_LABEL=groupe-c
python seed_users.py

# groupe-d
export SUPABASE_URL=https://REPLACE_WITH_SUPABASE_GROUPE_D_URL.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_groupe_d_xxx
export SUPABASE_BRANCH_LABEL=groupe-d
python seed_users.py
```

**Re-seed idempotent** : ajouter `--delete-existing` pour supprimer les `@hackathon.test` existants avant de recréer.

**Dry-run** : `python seed_users.py --dry-run` (ne fait pas d'appel API).

## Output

Pour chaque branche seedée, un fichier `test_user_ids_{label}.json` est créé avec la liste des `user_id` Supabase de cette branche, utilisable par les scripts de seed data downstream.

## Liste canonique des comptes

Voir `hackathon/contracts/test-accounts.md`.

Tous les comptes ont le **même password** : `Hackathon2026!`
