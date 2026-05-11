"""0002 — group-b-class seed demo data (happy paths)

Produit par hackathon/seeds/build_seed_migrations.py.
NE PAS éditer à la main — régénérer le script.

Revision ID: 0002b
Revises: 0001b
Create Date: 2026-05-11
"""
from alembic import op

revision = "0002b"
down_revision = "0001b"
branch_labels = None
depends_on = None


SEED_SQL = r"""
INSERT INTO skill (id, slug, name, description, category, popularity_score) VALUES
  ('11111111-0001-0000-0000-000000000001',        'pitch-investor',  'Pitch investor',         'Construire et délivrer un pitch convaincant à des investisseurs.', 'business', 95),
  ('11111111-0001-0000-0000-000000000002',      'funding-strategy','Funding strategy',       'Lever des fonds : seed, série A, term sheets, négociation.',       'business', 90),
  ('11111111-0001-0000-0000-000000000003',    'ui-design',       'UI Design',              'Concevoir des interfaces user-friendly avec Figma + design system.', 'design',   88),
  ('11111111-0001-0000-0000-000000000004',  'lean-canvas',     'Lean Canvas',            'Modéliser une startup en 1 page avec la méthode Lean Canvas.',     'business', 80),
  ('11111111-0001-0000-0000-000000000005', 'public-speaking', 'Public speaking',        'Prendre la parole en public : structure, storytelling, présence.', 'soft',     85);

-- 5 mentor_profiles (cross-group ref non-enforced — mêmes UUIDs que groupe A)
INSERT INTO mentor_profile (id, user_id, slug, display_name, aggregate_rating, rating_count, classes_given_count) VALUES
  ('22222222-0001-0000-0000-000000000001', 'b7246959-6255-4197-b140-cb4f1a290138', 'antoine-martin', 'Antoine Martin', 4.8, 47, 12),
  ('22222222-0001-0000-0000-000000000002',   '2034e1db-7572-4b3b-a8c6-87d7462fb896',   'marie-dupont',   'Marie Dupont',   4.7, 38, 9),
  ('22222222-0001-0000-0000-000000000003',   'b7cd0e3d-3576-4ae0-a646-56a5dbbb2df3',   'david-cohen',    'David Cohen',    4.6, 52, 15),
  ('22222222-0001-0000-0000-000000000004',  'd1667830-2277-4d36-9c84-dfacee43f6b5',  'sophie-bernard', 'Sophie Bernard', 4.5, 29, 7),
  ('22222222-0001-0000-0000-000000000005',   '2a303a02-780f-49af-a2d9-aad9f574297d',   'lucas-garcia',   'Lucas Garcia',   4.3, 11, 3);
"""


def _split_statements(sql: str) -> list[str]:
    import re
    sql = re.sub(r'--[^\n]*', '', sql)
    return [p.strip() for p in sql.split(';') if p.strip()]


def upgrade() -> None:
    for stmt in _split_statements(SEED_SQL):
        op.execute(stmt)


def downgrade() -> None:
    op.execute('TRUNCATE skill, mentor_profile, mira_class CASCADE;')
