"""0002 — group-a-mentor seed demo data (happy paths)

Produit par hackathon/seeds/build_seed_migrations.py.
NE PAS éditer à la main — régénérer le script.

Revision ID: 0002a
Revises: 0001a
Create Date: 2026-05-11
"""
from alembic import op

revision = "0002a"
down_revision = "0001a"
branch_labels = None
depends_on = None


SEED_SQL = r"""
INSERT INTO skill (id, slug, name, description, category, popularity_score) VALUES
  ('11111111-0001-0000-0000-000000000001',        'pitch-investor',  'Pitch investor',         'Construire et délivrer un pitch convaincant à des investisseurs.', 'business', 95),
  ('11111111-0001-0000-0000-000000000002',      'funding-strategy','Funding strategy',       'Lever des fonds : seed, série A, term sheets, négociation.',       'business', 90),
  ('11111111-0001-0000-0000-000000000003',    'ui-design',       'UI Design',              'Concevoir des interfaces user-friendly avec Figma + design system.', 'design',   88),
  ('11111111-0001-0000-0000-000000000004',  'lean-canvas',     'Lean Canvas',            'Modéliser une startup en 1 page avec la méthode Lean Canvas.',     'business', 80),
  ('11111111-0001-0000-0000-000000000005', 'public-speaking', 'Public speaking',        'Prendre la parole en public : structure, storytelling, présence.', 'soft',     85);

-- 5 mentor_profiles validés (id, user_id, slug, display_name + stats dénormalisées)
-- Le reste (headline, bio, journey, avatar, links) reste DEFAULT — à enrichir par les étudiants.
INSERT INTO mentor_profile (id, user_id, slug, display_name, aggregate_rating, rating_count, classes_given_count) VALUES
  ('22222222-0001-0000-0000-000000000001', '66fddf14-f5c3-4666-a8c2-48835fc953f0', 'antoine-martin',  'Antoine Martin',  4.8, 47, 12),
  ('22222222-0001-0000-0000-000000000002',   '84a952f3-3f64-4111-a141-586defeea1e6',   'marie-dupont',    'Marie Dupont',    4.7, 38, 9),
  ('22222222-0001-0000-0000-000000000003',   'b5149556-f5f9-41af-aa3f-39c3b88546ad',   'david-cohen',     'David Cohen',     4.6, 52, 15),
  ('22222222-0001-0000-0000-000000000004',  'd2a08020-175a-4dfe-a03c-77ba5d1b1adb',  'sophie-bernard',  'Sophie Bernard',  4.5, 29, 7),
  ('22222222-0001-0000-0000-000000000005',   'd43c5dcc-3090-46fa-bf8e-e975530e73ee',   'lucas-garcia',    'Lucas Garcia',    4.3, 11, 3);
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
