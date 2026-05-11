"""
Génère les migrations Alembic 0001_<group>_schema.py par groupe.

Extrait les blocs ```sql ... ``` des `contracts/group-X-*/*.md` (+ contracts/shared/*.md
qui est inclus dans tous les groupes), agrège tout en un seul `op.execute(...)`
par migration.

Usage :
    python3 build_schema_migrations.py

Output (un par groupe) :
    hackathon/group-a-mentor/backend/alembic/versions/0001_group_a_schema.py
    hackathon/group-b-class/backend/alembic/versions/0001_group_b_schema.py
    hackathon/group-c-learn/backend/alembic/versions/0001_group_c_schema.py
    hackathon/group-d-mobile/backend/alembic/versions/0001_group_d_schema.py
"""
from __future__ import annotations

import re
from pathlib import Path
from textwrap import dedent

REPO = Path(__file__).resolve().parent.parent
CONTRACTS = REPO / "contracts"

# ─────────────────────────────────────────────────────────────────────────────
# Mapping groupe → dossier de contrats à inclure
# Tous les groupes incluent `contracts/shared/` (skill catalog)
# ─────────────────────────────────────────────────────────────────────────────
GROUPS = {
    "group-a-mentor":  ("group_a", "shared"),
    "group-b-class":   ("group_b", "shared"),
    "group-c-learn":   ("group_c", "shared"),
    "group-d-mobile":  ("group_d", "shared"),
}

# Pour les contracts à inclure quand on est le groupe pivot.
# Group A définit `mira_class` ; group B le référence — on l'inclut aussi en B
# pour que `mira_class_enrolment.mira_class_id` puisse pointer logiquement.
# Idem : student_profile (group C) référencé par les notes/QCM du group D.
CROSS_GROUP_TABLES = {
    "group-b-class": ["mira_class.md", "mentor_profile.md"],
    "group-c-learn": ["mira_class.md", "mentor_profile.md"],
    "group-d-mobile": [
        "mira_class.md",
        "mira_class_module.md",
        "mira_class_module_quiz.md",
        "mira_class_module_quiz_question.md",
        "mira_class_module_quiz_option.md",
        "student_profile.md",
        "student_skill.md",
    ],
}

CROSS_GROUP_DIRS = {
    "group-b-class": "group-a-mentor",
    "group-c-learn": "group-a-mentor",
    # group-d : mélange entre group-b et group-c — on liste explicitement
    "group-d-mobile-mira": "group-a-mentor",
    "group-d-mobile-class": "group-b-class",
    "group-d-mobile-student": "group-c-learn",
}


def extract_sql_blocks(md_path: Path) -> list[str]:
    """Renvoie tous les blocs ```sql ... ``` d'un contrat."""
    content = md_path.read_text()
    return re.findall(r"```sql\n(.*?)```", content, re.DOTALL)


def collect_sql_for_group(group_dir: str) -> tuple[list[str], list[str]]:
    """Renvoie (statements_sql, table_names_for_drop)."""
    statements: list[str] = []
    table_names: list[str] = []

    # 1. shared/ d'abord (skill = pré-requis pour tout le monde)
    for md in sorted((CONTRACTS / "shared").glob("*.md")):
        for sql in extract_sql_blocks(md):
            statements.append(sql.strip())
            table_names.extend(_extract_table_names(sql))

    # 2. cross-group references (groupe B, C, D)
    if group_dir == "group-b-class":
        for fname in ["mentor_profile.md", "mira_class.md"]:
            md = CONTRACTS / "group-a-mentor" / fname
            if md.exists():
                for sql in extract_sql_blocks(md):
                    statements.append(sql.strip())
                    table_names.extend(_extract_table_names(sql))
    elif group_dir == "group-c-learn":
        for fname in ["mentor_profile.md", "mira_class.md"]:
            md = CONTRACTS / "group-a-mentor" / fname
            if md.exists():
                for sql in extract_sql_blocks(md):
                    statements.append(sql.strip())
                    table_names.extend(_extract_table_names(sql))
    elif group_dir == "group-d-mobile":
        for fname in ["mentor_profile.md", "mira_class.md"]:
            md = CONTRACTS / "group-a-mentor" / fname
            if md.exists():
                for sql in extract_sql_blocks(md):
                    statements.append(sql.strip())
                    table_names.extend(_extract_table_names(sql))
        for fname in [
            "mira_class_module.md",
            "mira_class_module_quiz.md",
            "mira_class_module_quiz_question.md",
            "mira_class_module_quiz_option.md",
        ]:
            md = CONTRACTS / "group-b-class" / fname
            if md.exists():
                for sql in extract_sql_blocks(md):
                    statements.append(sql.strip())
                    table_names.extend(_extract_table_names(sql))
        for fname in ["student_profile.md", "student_skill.md"]:
            md = CONTRACTS / "group-c-learn" / fname
            if md.exists():
                for sql in extract_sql_blocks(md):
                    statements.append(sql.strip())
                    table_names.extend(_extract_table_names(sql))

    # 3. propres tables du groupe
    for md in sorted((CONTRACTS / group_dir).glob("*.md")):
        if md.name.startswith("seed-"):
            continue  # docs de vues, pas du DDL
        for sql in extract_sql_blocks(md):
            statements.append(sql.strip())
            table_names.extend(_extract_table_names(sql))

    return statements, table_names


def _extract_table_names(sql: str) -> list[str]:
    """Détecte les `CREATE TABLE x (` et renvoie les noms uniques."""
    return re.findall(
        r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z_0-9]*)\s*\(",
        sql,
        re.IGNORECASE,
    )


REV_BY_GROUP = {
    "group-a-mentor": "0001a",
    "group-b-class":  "0001b",
    "group-c-learn":  "0001c",
    "group-d-mobile": "0001d",
}


def render_migration(group_dir: str, revision: str, statements: list[str], tables: list[str]) -> str:
    """Génère le code Python du fichier Alembic."""
    # On combine tout le SQL dans une seule chaîne raw qu'on passe à op.execute.
    # Postgres accepte les multi-statements via SQL string parsing par psycopg.
    combined = "\n\n".join(statements)
    # Pour drop : ordre inverse + DROP TABLE IF EXISTS x CASCADE
    drops_list = list(reversed(_dedupe(tables)))
    drops = "\n".join(
        f"    op.execute('DROP TABLE IF EXISTS {t} CASCADE;')"
        for t in drops_list
    )
    if not drops:
        drops = "    pass"

    return (
        f'"""0001 — {group_dir} schema (auto-généré depuis contracts/)\n'
        f"\n"
        f"Migration produite par hackathon/seeds/build_schema_migrations.py.\n"
        f"NE PAS éditer à la main : régénérer le script et re-runner.\n"
        f"\n"
        f"Inclut :\n"
        f"  - shared/ (skill)\n"
        f"  - contracts/{group_dir}/ (tables propres au groupe)\n"
        f"  - tables cross-groupe référencées (sans FK enforced)\n"
        f"\n"
        f"Revision ID: {revision}\n"
        f"Revises:\n"
        f"Create Date: 2026-05-11\n"
        f'"""\n'
        f"from alembic import op\n"
        f"\n"
        f'revision = "{revision}"\n'
        f"down_revision = None\n"
        f"branch_labels = None\n"
        f"depends_on = None\n"
        f"\n"
        f"\n"
        f'SCHEMA_SQL = r"""\n'
        f'-- Extensions Postgres requises par les contracts\n'
        f'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n'
        f'CREATE EXTENSION IF NOT EXISTS pg_trgm;\n'
        f'CREATE EXTENSION IF NOT EXISTS pgcrypto;\n'
        f"\n"
        f"{combined}\n"
        f'"""\n'
        f"\n"
        f"\n"
        f"def _split_statements(sql: str) -> list[str]:\n"
        f"    # asyncpg refuse les multi-statements en un prepare. On retire les\n"
        f"    # commentaires `--` puis on split sur `;`.\n"
        f"    import re\n"
        f"    sql = re.sub(r'--[^\\n]*', '', sql)  # strip line comments\n"
        f"    return [p.strip() for p in sql.split(';') if p.strip()]\n"
        f"\n"
        f"\n"
        f"def upgrade() -> None:\n"
        f"    for stmt in _split_statements(SCHEMA_SQL):\n"
        f"        op.execute(stmt)\n"
        f"\n"
        f"\n"
        f"def downgrade() -> None:\n"
        f"{drops}\n"
    )


def _dedupe(seq: list[str]) -> list[str]:
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def main() -> None:
    for group_dir, _ in GROUPS.items():
        statements, tables = collect_sql_for_group(group_dir)
        revision = REV_BY_GROUP[group_dir]
        content = render_migration(group_dir, revision, statements, tables)

        out_dir = REPO / group_dir / "backend" / "alembic" / "versions"
        out_dir.mkdir(parents=True, exist_ok=True)
        # Préfixe `0001` pour ordering lexico + suffixe groupe
        suffix = group_dir.replace("-", "_")
        out_path = out_dir / f"0001_{suffix}_schema.py"
        out_path.write_text(content)

        print(f"✓ {group_dir} → {out_path.relative_to(REPO)}")
        print(f"    {len(statements)} SQL blocks, {len(_dedupe(tables))} tables")
        print(f"    tables: {', '.join(_dedupe(tables))}")
        print()


if __name__ == "__main__":
    main()
