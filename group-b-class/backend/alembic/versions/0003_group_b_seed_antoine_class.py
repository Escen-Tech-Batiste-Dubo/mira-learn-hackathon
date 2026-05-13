"""0003 - seed Antoine flagship Mira Class

Revision ID: 0003b
Revises: 0002b
Create Date: 2026-05-11
"""
from alembic import op

revision = "0003b"
down_revision = "0002b"
branch_labels = None
depends_on = None


ANTOINE_CLASS_ID = "33333333-0001-0000-0000-000000000001"


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO mira_class (
            id,
            mentor_user_id,
            title,
            description,
            skills_taught,
            total_hours_collective,
            total_hours_individual,
            total_hours,
            format_envisaged,
            rythm_pattern,
            target_cities,
            status,
            validated_at
        ) VALUES (
            '33333333-0001-0000-0000-000000000001',
            'b7246959-6255-4197-b140-cb4f1a290138',
            'Pitcher pour lever 500k',
            'Un parcours concret pour aider les nomades fondateurs à structurer un pitch investisseur clair, crédible et prêt pour une levée seed.',
            '["11111111-0001-0000-0000-000000000001", "11111111-0001-0000-0000-000000000002"]'::jsonb,
            8,
            2,
            10,
            'both',
            'weekly_session',
            '[{"name": "Barcelone", "country_code": "ES"}]'::jsonb,
            'validated_draft',
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DELETE FROM mira_class
        WHERE id = '{ANTOINE_CLASS_ID}';
        """
    )
