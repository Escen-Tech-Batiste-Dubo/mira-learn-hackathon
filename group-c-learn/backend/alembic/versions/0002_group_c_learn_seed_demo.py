"""0002 — group-c-learn seed demo data (happy paths)

Produit par hackathon/seeds/build_seed_migrations.py.
NE PAS éditer à la main — régénérer le script.

Revision ID: 0002c
Revises: 0001c
Create Date: 2026-05-11
"""
from alembic import op

revision = "0002c"
down_revision = "0001c"
branch_labels = None
depends_on = None


SEED_SQL = r"""
INSERT INTO skill (id, slug, name, description, category, popularity_score) VALUES
  ('11111111-0001-0000-0000-000000000001',        'pitch-investor',  'Pitch investor',         'Construire et délivrer un pitch convaincant à des investisseurs.', 'business', 95),
  ('11111111-0001-0000-0000-000000000002',      'funding-strategy','Funding strategy',       'Lever des fonds : seed, série A, term sheets, négociation.',       'business', 90),
  ('11111111-0001-0000-0000-000000000003',    'ui-design',       'UI Design',              'Concevoir des interfaces user-friendly avec Figma + design system.', 'design',   88),
  ('11111111-0001-0000-0000-000000000004',  'lean-canvas',     'Lean Canvas',            'Modéliser une startup en 1 page avec la méthode Lean Canvas.',     'business', 80),
  ('11111111-0001-0000-0000-000000000005', 'public-speaking', 'Public speaking',        'Prendre la parole en public : structure, storytelling, présence.', 'soft',     85);

-- 5 student_profiles (colonnes minimales — display_name uniquement, le reste DEFAULT)
INSERT INTO student_profile (id, user_id, display_name) VALUES
  ('55555555-0001-0000-0000-000000000001',   'b4278adc-15cc-4585-a6fa-4ddb262c24e8',   'Anna Lopez'),
  ('55555555-0001-0000-0000-000000000002',  'b00ca0d7-700e-475b-b735-617ca2e2d218',  'Marco Silva'),
  ('55555555-0001-0000-0000-000000000003',    '58ee2ed6-a73f-4672-a8b6-cf680bc2d29c',    'Léa Bauer'),
  ('55555555-0001-0000-0000-000000000004', '0fd389a0-e4ef-4c59-badb-fdd92120476d', 'Julien Morel'),
  ('55555555-0001-0000-0000-000000000005',   'f7c2ccbc-4b4e-4048-a399-8814610cf761',   'Nora Ahmed');
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
