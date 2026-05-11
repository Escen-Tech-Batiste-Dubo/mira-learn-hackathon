"""
Exemple de modèle SQLAlchemy — à dupliquer pour créer ses propres entités.

MIGRATION HINT (post-hackathon) :
    Voir `app/models/base.py` pour la transformation Base/Mixins → UnifiedModel.
    Le schéma DB de cette table est conservé tel quel post-migration.

Pour créer une nouvelle entité :
    1. Copier ce fichier en `app/models/{entity_name}.py`
    2. Renommer la classe + __tablename__
    3. Ajuster les colonnes selon le contrat (voir `hackathon/contracts/`)
    4. Créer le schéma Pydantic correspondant dans `app/schemas/`
    5. Créer le service métier dans `app/services/`
    6. Créer la route dans `app/api/v1/endpoints/`
    7. Enregistrer la route dans `app/api/v1/router.py`
    8. Créer la migration : `make migrate-create msg="add_{entity}_table"`
"""
from typing import Literal

from sqlalchemy import CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, SoftDeleteMixin, TimestampMixin

# Convention : enums stockés en VARCHAR avec CHECK constraint
# (plus portable et migrable que ENUM PostgreSQL)
ExampleStatus = Literal["draft", "active", "archived"]


class Example(Base, IDMixin, TimestampMixin, SoftDeleteMixin):
    """Exemple d'entité métier.

    Cette classe sert de référence pour montrer le pattern complet :
        - héritage Base + IDMixin + TimestampMixin + SoftDeleteMixin
        - colonnes typées avec Mapped[]
        - contraintes CHECK pour enums
        - indexes nommés
    """

    __tablename__ = "example"

    # Champs métier
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="draft",
    )

    # Contraintes + indexes (partie déclarative)
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'active', 'archived')",
            name="example_status_check",
        ),
        # Index partiel : on n'index que les non-deleted (perf des listings)
        Index(
            "idx_example_status_active",
            "status",
            postgresql_where="deleted_at IS NULL",
        ),
    )
