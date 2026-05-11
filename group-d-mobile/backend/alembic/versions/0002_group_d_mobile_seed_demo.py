"""0002 — group-d-mobile seed demo data (happy paths)

Produit par hackathon/seeds/build_seed_migrations.py.
NE PAS éditer à la main — régénérer le script.

Revision ID: 0002d
Revises: 0001d
Create Date: 2026-05-11
"""
from alembic import op

revision = "0002d"
down_revision = "0001d"
branch_labels = None
depends_on = None


SEED_SQL = r"""
INSERT INTO skill (id, slug, name, description, category, popularity_score) VALUES
  ('11111111-0001-0000-0000-000000000001',        'pitch-investor',  'Pitch investor',         'Construire et délivrer un pitch convaincant à des investisseurs.', 'business', 95),
  ('11111111-0001-0000-0000-000000000002',      'funding-strategy','Funding strategy',       'Lever des fonds : seed, série A, term sheets, négociation.',       'business', 90),
  ('11111111-0001-0000-0000-000000000003',    'ui-design',       'UI Design',              'Concevoir des interfaces user-friendly avec Figma + design system.', 'design',   88),
  ('11111111-0001-0000-0000-000000000004',  'lean-canvas',     'Lean Canvas',            'Modéliser une startup en 1 page avec la méthode Lean Canvas.',     'business', 80),
  ('11111111-0001-0000-0000-000000000005', 'public-speaking', 'Public speaking',        'Prendre la parole en public : structure, storytelling, présence.', 'soft',     85);

-- 3 student_profiles (colonnes minimales)
INSERT INTO student_profile (id, user_id, display_name) VALUES
  ('55555555-0001-0000-0000-000000000001', '33e25231-0fb2-4c35-82f4-2169dc769d4d', 'Anna Lopez'),
  ('55555555-0001-0000-0000-000000000005', '75a50650-5695-4702-a095-02a2da6a7c27', 'Nora Ahmed'),
  ('55555555-0001-0000-0000-000000000010', '4a244934-9147-429a-a070-dfa4fcb3f09c', 'Eva Fischer');
"""


def _split_statements(sql: str) -> list[str]:
    import re
    sql = re.sub(r'--[^\n]*', '', sql)
    return [p.strip() for p in sql.split(';') if p.strip()]


def upgrade() -> None:
    for stmt in _split_statements(SEED_SQL):
        op.execute(stmt)


def downgrade() -> None:
    op.execute('TRUNCATE skill, mentor_profile, mentor_application, mentor_profile_skill, mira_class CASCADE;')
