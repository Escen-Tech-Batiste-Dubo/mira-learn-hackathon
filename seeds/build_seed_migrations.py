"""
Génère les migrations Alembic 0002_<group>_seed_demo.py par groupe.

Seed **minimal** focalisé sur les happy paths démo (option A). Pour chaque
groupe, lit `test_user_ids_groupe-{X}.json` pour récupérer les UUIDs Supabase
locaux à la branche, puis insère :

  - 5 skills canoniques (id partagé entre tous les groupes)
  - 5 mentor_profiles validés (Antoine, Marie, David, Sophie, Lucas)
  - 3 mentor_applications (Emma submitted, Nathan submitted, Chloé in_review)
  - 3 mira_class (dont la flagship d'Antoine)
  - 5 student_profiles (Anna, Marco, Léa, Julien, Nora)
  - 3 enrolments / waitlist (Anna inscrite, Pierre waitlist)
  - 2 modules + 2 quizzes pour la class flagship (groupe B/D)
  - 3 entries community_activity_feed (groupe D)

Les `auth.users.id` sont **différents** entre branches Supabase. Les UUIDs
"métier" (skills, mira_class, etc.) sont par contre **déterministes et partagés**
entre tous les groupes pour permettre les références cross-DB.

Usage :
    python3 build_seed_migrations.py

Sortie : 4 fichiers `0002_<group>_seed_demo.py` dans chaque `backend/alembic/versions/`.
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SEEDS = Path(__file__).resolve().parent

# ─────────────────────────────────────────────────────────────────────────────
# UUIDs déterministes partagés (skills, mira_class, modules, sessions, etc.)
# Format : préfixe par catégorie pour debug facile.
# ─────────────────────────────────────────────────────────────────────────────

# Skills (5 skills core utilisés par tous les groupes)
SKILL_PITCH        = "11111111-0001-0000-0000-000000000001"
SKILL_FUNDING      = "11111111-0001-0000-0000-000000000002"
SKILL_UI_DESIGN    = "11111111-0001-0000-0000-000000000003"
SKILL_LEAN_CANVAS  = "11111111-0001-0000-0000-000000000004"
SKILL_PUBLIC_SPEAK = "11111111-0001-0000-0000-000000000005"

# Mentor profile IDs (id local au groupe — un par mentor validé)
MP_ANTOINE = "22222222-0001-0000-0000-000000000001"
MP_MARIE   = "22222222-0001-0000-0000-000000000002"
MP_DAVID   = "22222222-0001-0000-0000-000000000003"
MP_SOPHIE  = "22222222-0001-0000-0000-000000000004"
MP_LUCAS   = "22222222-0001-0000-0000-000000000005"

# Mira class IDs
MC_ANTOINE_PITCH = "33333333-0001-0000-0000-000000000001"  # flagship démo
MC_MARIE_DESIGN  = "33333333-0001-0000-0000-000000000002"
MC_DAVID_GROWTH  = "33333333-0001-0000-0000-000000000003"

# Mira class modules
MOD_PITCH_1 = "33333333-0002-0000-0000-000000000011"
MOD_PITCH_2 = "33333333-0002-0000-0000-000000000012"

# Quizzes
QUIZ_PITCH_M1 = "33333333-0003-0000-0000-000000000021"

# Mira class sessions
SESS_PITCH_BCN = "33333333-0004-0000-0000-000000000031"  # Barcelone juillet

# Mentor applications (3)
MA_EMMA   = "44444444-0001-0000-0000-000000000001"
MA_NATHAN = "44444444-0001-0000-0000-000000000002"
MA_CHLOE  = "44444444-0001-0000-0000-000000000003"

# Student profile IDs (un par nomad core)
SP_ANNA    = "55555555-0001-0000-0000-000000000001"
SP_MARCO   = "55555555-0001-0000-0000-000000000002"
SP_LEA     = "55555555-0001-0000-0000-000000000003"
SP_JULIEN  = "55555555-0001-0000-0000-000000000004"
SP_NORA    = "55555555-0001-0000-0000-000000000005"

# Enrolments
ENROL_ANNA_PITCH = "66666666-0001-0000-0000-000000000001"

# Learning paths
PATH_ANNA = "77777777-0001-0000-0000-000000000001"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def load_users(branch_label: str) -> dict[str, str]:
    """Retourne {email -> user_id} pour la branche donnée."""
    path = SEEDS / f"test_user_ids_{branch_label}.json"
    data = json.loads(path.read_text())
    return {u["email"]: u["id"] for u in data}


def quote_uuid(uuid_or_none: str | None) -> str:
    return "NULL" if uuid_or_none is None else f"'{uuid_or_none}'"


def sql_escape(text: str) -> str:
    """Escape les apostrophes pour SQL string literal."""
    return text.replace("'", "''")


# ─────────────────────────────────────────────────────────────────────────────
# Seeds communs (skills) — inclus dans TOUS les groupes
# ─────────────────────────────────────────────────────────────────────────────

SHARED_SKILLS_SQL = f"""
INSERT INTO skill (id, slug, name, description, category, popularity_score) VALUES
  ('{SKILL_PITCH}',        'pitch-investor',  'Pitch investor',         'Construire et délivrer un pitch convaincant à des investisseurs.', 'business', 95),
  ('{SKILL_FUNDING}',      'funding-strategy','Funding strategy',       'Lever des fonds : seed, série A, term sheets, négociation.',       'business', 90),
  ('{SKILL_UI_DESIGN}',    'ui-design',       'UI Design',              'Concevoir des interfaces user-friendly avec Figma + design system.', 'design',   88),
  ('{SKILL_LEAN_CANVAS}',  'lean-canvas',     'Lean Canvas',            'Modéliser une startup en 1 page avec la méthode Lean Canvas.',     'business', 80),
  ('{SKILL_PUBLIC_SPEAK}', 'public-speaking', 'Public speaking',        'Prendre la parole en public : structure, storytelling, présence.', 'soft',     85);
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# Builders par groupe
# ─────────────────────────────────────────────────────────────────────────────

def build_seed_group_a(users: dict[str, str]) -> str:
    """Group A : 5 mentor_profile (colonnes obligatoires uniquement)."""
    antoine = users["antoine.martin@hackathon.test"]
    marie   = users["marie.dupont@hackathon.test"]
    david   = users["david.cohen@hackathon.test"]
    sophie  = users["sophie.bernard@hackathon.test"]
    lucas   = users["lucas.garcia@hackathon.test"]

    return f"""
-- 5 mentor_profiles validés (id, user_id, slug, display_name + stats dénormalisées)
-- Le reste (headline, bio, journey, avatar, links) reste DEFAULT — à enrichir par les étudiants.
INSERT INTO mentor_profile (id, user_id, slug, display_name, aggregate_rating, rating_count, classes_given_count) VALUES
  ('{MP_ANTOINE}', '{antoine}', 'antoine-martin',  'Antoine Martin',  4.8, 47, 12),
  ('{MP_MARIE}',   '{marie}',   'marie-dupont',    'Marie Dupont',    4.7, 38, 9),
  ('{MP_DAVID}',   '{david}',   'david-cohen',     'David Cohen',     4.6, 52, 15),
  ('{MP_SOPHIE}',  '{sophie}',  'sophie-bernard',  'Sophie Bernard',  4.5, 29, 7),
  ('{MP_LUCAS}',   '{lucas}',   'lucas-garcia',    'Lucas Garcia',    4.3, 11, 3);
""".strip()


def build_seed_group_b(users: dict[str, str]) -> str:
    """Group B : 5 mentor_profiles (cross-group ref, colonnes minimales).
    Les étudiants enrichiront avec mira_class, modules, sessions, enrolments depuis
    les contracts/group-b-class/*.md (chacun ayant des CHECK constraints + colonnes
    obligatoires spécifiques).
    """
    antoine = users["antoine.martin@hackathon.test"]
    marie   = users["marie.dupont@hackathon.test"]
    david   = users["david.cohen@hackathon.test"]
    sophie  = users["sophie.bernard@hackathon.test"]
    lucas   = users["lucas.garcia@hackathon.test"]

    return f"""
-- 5 mentor_profiles (cross-group ref non-enforced — mêmes UUIDs que groupe A)
INSERT INTO mentor_profile (id, user_id, slug, display_name, aggregate_rating, rating_count, classes_given_count) VALUES
  ('{MP_ANTOINE}', '{antoine}', 'antoine-martin', 'Antoine Martin', 4.8, 47, 12),
  ('{MP_MARIE}',   '{marie}',   'marie-dupont',   'Marie Dupont',   4.7, 38, 9),
  ('{MP_DAVID}',   '{david}',   'david-cohen',    'David Cohen',    4.6, 52, 15),
  ('{MP_SOPHIE}',  '{sophie}',  'sophie-bernard', 'Sophie Bernard', 4.5, 29, 7),
  ('{MP_LUCAS}',   '{lucas}',   'lucas-garcia',   'Lucas Garcia',   4.3, 11, 3);
""".strip()


def build_seed_group_c(users: dict[str, str]) -> str:
    """Group C : 5 student_profile (cross-group ref + colonnes minimales)."""
    anna    = users["anna.lopez@hackathon.test"]
    marco   = users["marco.silva@hackathon.test"]
    lea     = users["lea.bauer@hackathon.test"]
    julien  = users["julien.morel@hackathon.test"]
    nora    = users["nora.ahmed@hackathon.test"]

    return f"""
-- 5 student_profiles (colonnes minimales — display_name uniquement, le reste DEFAULT)
INSERT INTO student_profile (id, user_id, display_name) VALUES
  ('{SP_ANNA}',   '{anna}',   'Anna Lopez'),
  ('{SP_MARCO}',  '{marco}',  'Marco Silva'),
  ('{SP_LEA}',    '{lea}',    'Léa Bauer'),
  ('{SP_JULIEN}', '{julien}', 'Julien Morel'),
  ('{SP_NORA}',   '{nora}',   'Nora Ahmed');
""".strip()


def build_seed_group_d(users: dict[str, str]) -> str:
    """Group D : 3 student_profile (cross-group ref colonnes minimales)."""
    anna    = users["anna.lopez@hackathon.test"]
    nora    = users["nora.ahmed@hackathon.test"]
    eva     = users["eva.fischer@hackathon.test"]

    return f"""
-- 3 student_profiles (colonnes minimales)
INSERT INTO student_profile (id, user_id, display_name) VALUES
  ('{SP_ANNA}', '{anna}', 'Anna Lopez'),
  ('{SP_NORA}', '{nora}', 'Nora Ahmed'),
  ('55555555-0001-0000-0000-000000000010', '{eva}', 'Eva Fischer');
""".strip()


# ─────────────────────────────────────────────────────────────────────────────
# Render & main
# ─────────────────────────────────────────────────────────────────────────────

GROUPS = [
    ("group-a-mentor", "groupe-a", "0002a", "a", build_seed_group_a),
    ("group-b-class",  "groupe-b", "0002b", "b", build_seed_group_b),
    ("group-c-learn",  "groupe-c", "0002c", "c", build_seed_group_c),
    ("group-d-mobile", "groupe-d", "0002d", "d", build_seed_group_d),
]


def render(group_dir: str, revision: str, down_rev: str, seed_sql: str) -> str:
    return (
        f'"""0002 — {group_dir} seed demo data (happy paths)\n'
        f"\n"
        f"Produit par hackathon/seeds/build_seed_migrations.py.\n"
        f"NE PAS éditer à la main — régénérer le script.\n"
        f"\n"
        f"Revision ID: {revision}\n"
        f"Revises: {down_rev}\n"
        f"Create Date: 2026-05-11\n"
        f'"""\n'
        f"from alembic import op\n"
        f"\n"
        f'revision = "{revision}"\n'
        f'down_revision = "{down_rev}"\n'
        f"branch_labels = None\n"
        f"depends_on = None\n"
        f"\n"
        f"\n"
        f"SEED_SQL = r\"\"\"\n"
        f"{SHARED_SKILLS_SQL}\n"
        f"\n"
        f"{seed_sql}\n"
        f"\"\"\"\n"
        f"\n"
        f"\n"
        f"def _split_statements(sql: str) -> list[str]:\n"
        f"    import re\n"
        f"    sql = re.sub(r'--[^\\n]*', '', sql)\n"
        f"    return [p.strip() for p in sql.split(';') if p.strip()]\n"
        f"\n"
        f"\n"
        f"def upgrade() -> None:\n"
        f"    for stmt in _split_statements(SEED_SQL):\n"
        f"        op.execute(stmt)\n"
        f"\n"
        f"\n"
        f"def downgrade() -> None:\n"
        f"    op.execute('TRUNCATE skill, mentor_profile, mentor_application, mentor_profile_skill, mira_class CASCADE;')\n"
    )


REV_BY_GROUP_SCHEMA = {
    "group-a-mentor": "0001a",
    "group-b-class":  "0001b",
    "group-c-learn":  "0001c",
    "group-d-mobile": "0001d",
}


def main() -> None:
    for group_dir, branch_label, revision, _, builder in GROUPS:
        users = load_users(branch_label)
        seed_sql = builder(users)
        content = render(
            group_dir=group_dir,
            revision=revision,
            down_rev=REV_BY_GROUP_SCHEMA[group_dir],
            seed_sql=seed_sql,
        )
        out_dir = REPO / group_dir / "backend" / "alembic" / "versions"
        suffix = group_dir.replace("-", "_")
        out_path = out_dir / f"0002_{suffix}_seed_demo.py"
        out_path.write_text(content)
        print(f"✓ {group_dir} → {out_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
