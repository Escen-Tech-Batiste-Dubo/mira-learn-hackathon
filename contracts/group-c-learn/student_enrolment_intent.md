# student_enrolment_intent

**Possédé par** : Group C (write)
**Reprenabilité post-hackathon** : à fusionner avec `mira_class_enrolment` (Group B) dans `classes-api.mira_class_enrolment`

## Description fonctionnelle

L'**intention d'inscription** d'un étudiant à une session, créée côté Group C avant d'être confirmée par Group B en `mira_class_enrolment`. Permet de tracer la phase pré-enrolment (visite catalogue → form de validation → submission).

En V1 prod, ce concept disparaît : l'inscription est créée directement dans `classes-api.mira_class_enrolment` avec status `applied`. Pendant le hackathon, on a 2 tables séparées (Group C propre Supabase, Group B propre Supabase) qui seront mergées post-hackathon.

## Schéma SQL

```sql
CREATE TABLE student_enrolment_intent (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,                              -- ref mira_class_session.id (read seed)
    class_id UUID NOT NULL,                                -- ref mira_class.id (denorm pour filtrage)

    -- Réponses au form de validation participation
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- Schéma libre : { "motivation": "...", "experience_in_topic": "...", "specific_questions": "..." }

    -- Status local (avant transmission à Group B)
    status VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'transmitted_to_mentor'
    )),

    -- Source du parcours (si arrive depuis student_learning_path)
    source_learning_path_id UUID NULL,
    source_learning_path_step_id UUID NULL,

    submitted_at TIMESTAMP WITH TIME ZONE NULL,
    transmitted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (profile_id, session_id) WHERE status != 'draft'
);

CREATE INDEX idx_student_enrolment_intent_profile_id ON student_enrolment_intent (profile_id, status);
CREATE INDEX idx_student_enrolment_intent_session_id ON student_enrolment_intent (session_id);
```

## Schéma Pydantic

```python
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict

IntentStatus = Literal["draft", "submitted", "transmitted_to_mentor"]


class StudentEnrolmentIntentBase(BaseModel):
    session_id: str
    class_id: str
    application_data: dict[str, Any] = {}
    source_learning_path_id: Optional[str] = None
    source_learning_path_step_id: Optional[str] = None


class StudentEnrolmentIntentCreate(StudentEnrolmentIntentBase):
    pass


class StudentEnrolmentIntentUpdate(BaseModel):
    application_data: Optional[dict[str, Any]] = None


class StudentEnrolmentIntentSubmit(BaseModel):
    """Confirmation de la postulation."""
    pass


class StudentEnrolmentIntentRead(StudentEnrolmentIntentBase):
    id: str
    profile_id: str
    status: IntentStatus
    submitted_at: Optional[datetime]
    transmitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Contraintes métier

- **Hackathon-only entity** : sert d'interface entre Group C (UI inscription) et Group B (gestion candidatures). En V1 prod, elle disparaît.
- État `transmitted_to_mentor` : déclenché côté hackathon par un appel mock (les groupes ne communiquent pas en vrai cross-Supabase) — Group C bascule l'intent en `transmitted` et c'est tout. La démo prétend que Group B le voit.
- `source_learning_path_step_id` permet de tracer si l'inscription vient d'une recommandation de parcours.

## Relations

- **Référence** :
  - `profile_id` → `student_profile.id` (CASCADE)
  - `session_id` → `mira_class_session.id` (référence logique cross-groupe)
  - `class_id` → `mira_class.id` (référence logique cross-groupe)
  - `source_learning_path_step_id` → `student_learning_path_step.id`

## Routes API

```
POST   /v1/students/me/enrolment-intents                   — créer (status='draft')
GET    /v1/students/me/enrolment-intents                   — list
PATCH  /v1/students/me/enrolment-intents/{id}              — update (uniquement si draft)
POST   /v1/students/me/enrolment-intents/{id}/submit       — soumettre (draft → submitted)
DELETE /v1/students/me/enrolment-intents/{id}              — annuler (avant submit)
```

## Seed attendu

Pour 3-5 nomads seedés : 1-2 intents `submitted` chacun (correspondant à des sessions seedées Group B).

## Reprenabilité

**Mapping** : la table disparaît post-hackathon. Migration des données :
1. Pour chaque `student_enrolment_intent` status='submitted' : créer un `mira_class_enrolment` status='applied' dans `classes-api`
2. Copier `application_data` → `mira_class_enrolment.application_data`
3. Dropper la table `student_enrolment_intent`

**Effort** : ~1h Claude Code.
