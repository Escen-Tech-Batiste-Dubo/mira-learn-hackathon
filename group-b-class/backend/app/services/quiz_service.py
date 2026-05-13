"""Service métier — QCM par module (génération IA via OpenRouter)."""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Literal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.integrations.openrouter import llm_client
from app.models.mira_class import MiraClass
from app.models.module import MiraClassModule
from app.models.quiz import (
    MiraClassModuleQuiz,
    MiraClassModuleQuizOption,
    MiraClassModuleQuizQuestion,
)
from app.schemas.quiz import (
    MiraClassModuleQuizGenerateRequest,
    MiraClassModuleQuizRead,
    QuizDetailRead,
    QuizOptionRead,
    QuizQuestionMentorPatch,
    QuizQuestionRead,
    _LLMQuizPayloadIn,
)

logger = logging.getLogger(__name__)


async def _get_module_owned_by_mentor(
    db: AsyncSession,
    module_id: str,
    mentor_user_id: str,
) -> tuple[MiraClassModule, MiraClass]:
    stmt = (
        select(MiraClassModule, MiraClass)
        .join(MiraClass, MiraClassModule.class_id == MiraClass.id)
        .where(
            MiraClassModule.id == module_id,
            MiraClassModule.deleted_at.is_(None),
            MiraClass.deleted_at.is_(None),
            MiraClass.mentor_user_id == mentor_user_id,
        )
    )
    row = (await db.execute(stmt)).one_or_none()
    if not row:
        raise NotFoundError(resource="MiraClassModule", identifier=module_id)
    return row[0], row[1]


async def _get_quiz_owned_by_mentor(
    db: AsyncSession,
    quiz_id: str,
    mentor_user_id: str,
) -> MiraClassModuleQuiz:
    stmt = (
        select(MiraClassModuleQuiz)
        .join(MiraClassModule, MiraClassModuleQuiz.module_id == MiraClassModule.id)
        .join(MiraClass, MiraClassModule.class_id == MiraClass.id)
        .where(
            MiraClassModuleQuiz.id == quiz_id,
            MiraClassModuleQuiz.deleted_at.is_(None),
            MiraClassModule.deleted_at.is_(None),
            MiraClass.deleted_at.is_(None),
            MiraClass.mentor_user_id == mentor_user_id,
        )
    )
    quiz = (await db.execute(stmt)).scalar_one_or_none()
    if not quiz:
        raise NotFoundError(resource="MiraClassModuleQuiz", identifier=quiz_id)
    return quiz


async def _load_quiz_detail(db: AsyncSession, quiz_id: str) -> QuizDetailRead:
    q_stmt = select(MiraClassModuleQuiz).where(
        MiraClassModuleQuiz.id == quiz_id,
        MiraClassModuleQuiz.deleted_at.is_(None),
    )
    quiz = (await db.execute(q_stmt)).scalar_one_or_none()
    if not quiz:
        raise NotFoundError(resource="MiraClassModuleQuiz", identifier=quiz_id)

    questions = (
        (
            await db.execute(
                select(MiraClassModuleQuizQuestion).where(MiraClassModuleQuizQuestion.quiz_id == quiz_id),
            )
        )
        .scalars()
        .all()
    )
    questions_sorted = sorted(questions, key=lambda x: x.position)

    out_questions: list[QuizQuestionRead] = []
    for qq in questions_sorted:
        opts = (
            (
                await db.execute(
                    select(MiraClassModuleQuizOption)
                    .where(MiraClassModuleQuizOption.question_id == qq.id)
                    .order_by(MiraClassModuleQuizOption.position)
                )
            )
            .scalars()
            .all()
        )
        out_questions.append(
            QuizQuestionRead(
                id=qq.id,
                position=qq.position,
                type=qq.type,
                prompt=qq.prompt,
                points=qq.points,
                explanation=qq.explanation,
                options=[
                    QuizOptionRead(
                        id=o.id,
                        position=o.position,
                        label=o.label,
                        is_correct=o.is_correct,
                        explanation=o.explanation,
                    )
                    for o in opts
                ],
            )
        )

    return QuizDetailRead(
        quiz=MiraClassModuleQuizRead.model_validate(quiz),
        questions=out_questions,
    )


def _build_llm_prompt(
    module: MiraClassModule,
    mclass: MiraClass,
    body: MiraClassModuleQuizGenerateRequest,
) -> str:
    diff: Literal["easy", "medium", "hard"] = body.difficulty
    return (
        f"Tu es expert pédagogique Mira Learn (FR). Génère exactement {body.question_count} questions QCM "
        f"de difficulté « {diff} » pour valider la compréhension du module suivant.\n\n"
        f"## Class\n{mclass.title}\n\n"
        f"## Module\n**Titre** : {module.title}\n\n**Description (markdown autorisé)** :\n{module.description}\n\n"
        "## Format de sortie (JSON strict, une seule racine)\n"
        '{"questions":[{"prompt":"énoncé","explanation":"texte court ou null",'
        '"options":[{"label":"texte","is_correct":false},...]}]}\n\n'
        "Règles : chaque question a type implicite `single_choice` : exactement **une** option avec "
        "`is_correct: true`. Au moins 4 options par question. Texte en français. "
        "Pas de markdown dans les labels d’options. Réponds **uniquement** avec le JSON, sans préambule."
    )


async def generate_quiz_for_module(
    db: AsyncSession,
    module_id: str,
    mentor_user_id: str,
    body: MiraClassModuleQuizGenerateRequest,
) -> QuizDetailRead:
    module, mclass = await _get_module_owned_by_mentor(db, module_id, mentor_user_id)

    q_stmt = select(MiraClassModuleQuiz).where(
        MiraClassModuleQuiz.module_id == module.id,
        MiraClassModuleQuiz.deleted_at.is_(None),
    )
    existing = (await db.execute(q_stmt)).scalar_one_or_none()

    if existing and existing.status == "published":
        raise ConflictError("Un quiz publié existe déjà pour ce module.")
    if existing and existing.status == "archived":
        raise ConflictError(
            "Un quiz archivé existe pour ce module ; création d’un nouveau brouillon non gérée ici.",
        )

    prompt = _build_llm_prompt(module, mclass, body)
    prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:64]

    messages = [
        {"role": "system", "content": "Tu réponds uniquement en JSON valide respectant le schéma demandé."},
        {"role": "user", "content": prompt},
    ]
    raw = await llm_client.complete(
        messages=messages,
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    content = (raw.get("content") or "").strip()
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        logger.warning("Quiz IA : JSON invalide — %s", content[:500])
        raise ValidationError("Réponse LLM non JSON valide.", field="llm_output") from exc

    try:
        payload = _LLMQuizPayloadIn.model_validate(parsed)
    except Exception as exc:
        raise ValidationError("Structure JSON LLM invalide.", field="llm_payload") from exc

    if len(payload.questions) != body.question_count:
        raise ValidationError(
            f"L’IA a renvoyé {len(payload.questions)} questions au lieu de {body.question_count}.",
            field="questions",
        )

    for i, q in enumerate(payload.questions, start=1):
        correct = sum(1 for o in q.options if o.is_correct)
        if correct != 1:
            raise ValidationError(
                f"Question {i} : exactement une bonne réponse requise (trouvé {correct}).",
                field=f"questions[{i}]",
            )
        if len(q.options) < 4:
            raise ValidationError(
                f"Question {i} : au moins 4 options requises.",
                field=f"questions[{i}].options",
            )

    if existing:
        await db.execute(
            delete(MiraClassModuleQuizQuestion).where(MiraClassModuleQuizQuestion.quiz_id == existing.id),
        )
        quiz = existing
        quiz.title = f"QCM - {module.title}"[:200]
        quiz.description = "Généré par IA — à relire avant publication."
        quiz.ai_generated = True
        quiz.ai_generation_prompt_hash = prompt_hash
        quiz.status = "draft"
    else:
        quiz = MiraClassModuleQuiz(
            module_id=module.id,
            title=f"QCM - {module.title}"[:200],
            description="Généré par IA — à relire avant publication.",
            pass_threshold_pct=70,
            time_limit_seconds=None,
            max_attempts=3,
            shuffle_questions=False,
            shuffle_options=False,
            show_explanations_after=True,
            status="draft",
            ai_generated=True,
            ai_generation_prompt_hash=prompt_hash,
        )
        db.add(quiz)

    await db.flush()

    for i, q in enumerate(payload.questions, start=1):
        qrow = MiraClassModuleQuizQuestion(
            quiz_id=quiz.id,
            position=i,
            type="single_choice",
            prompt=q.prompt,
            points=1,
            explanation=q.explanation,
            image_url=None,
        )
        db.add(qrow)
        await db.flush()
        for j, opt in enumerate(q.options, start=1):
            db.add(
                MiraClassModuleQuizOption(
                    question_id=qrow.id,
                    position=j,
                    label=opt.label,
                    is_correct=opt.is_correct,
                    explanation=None,
                ),
            )

    await db.flush()
    return await _load_quiz_detail(db, quiz.id)


def _validate_correct_options(question_type: str, correct_count: int) -> None:
    if question_type == "single_choice" and correct_count != 1:
        raise ValidationError(
            f"Type single_choice : exactement une option correcte requise (actuellement {correct_count}).",
            field="options",
        )
    if question_type == "multi_choice" and correct_count < 1:
        raise ValidationError(
            "Type multi_choice : au moins une option correcte requise.",
            field="options",
        )


async def update_quiz_question(
    db: AsyncSession,
    quiz_id: str,
    question_id: str,
    mentor_user_id: str,
    body: QuizQuestionMentorPatch,
) -> QuizDetailRead:
    payload = body.model_dump(exclude_unset=True)
    if not payload:
        raise ValidationError("Aucun champ à mettre à jour.", field="body")

    quiz = await _get_quiz_owned_by_mentor(db, quiz_id, mentor_user_id)
    if quiz.status != "draft":
        raise ConflictError("Seuls les quizzes en brouillon peuvent être modifiés.")

    q_stmt = select(MiraClassModuleQuizQuestion).where(
        MiraClassModuleQuizQuestion.id == question_id,
        MiraClassModuleQuizQuestion.quiz_id == quiz_id,
    )
    question = (await db.execute(q_stmt)).scalar_one_or_none()
    if not question:
        raise NotFoundError(resource="MiraClassModuleQuizQuestion", identifier=question_id)

    if "prompt" in payload:
        p = payload["prompt"]
        if p is None or (isinstance(p, str) and not p.strip()):
            raise ValidationError("Le prompt ne peut pas être vide.", field="prompt")
        question.prompt = p

    if "explanation" in payload:
        ex = payload["explanation"]
        question.explanation = None if ex is None or (isinstance(ex, str) and ex == "") else ex

    if "points" in payload and payload["points"] is not None:
        question.points = payload["points"]

    if "options" in payload and body.options is not None:
        opt_rows = (
            (
                await db.execute(
                    select(MiraClassModuleQuizOption).where(
                        MiraClassModuleQuizOption.question_id == question.id,
                    ),
                )
            )
            .scalars()
            .all()
        )
        by_id = {o.id: o for o in opt_rows}
        for patch in body.options:
            oid = patch.id
            if oid not in by_id:
                raise ValidationError(
                    f"L’option {oid} n’appartient pas à cette question.",
                    field="options",
                )
            row = by_id[oid]
            item = patch.model_dump(exclude_unset=True)
            if "label" in item:
                row.label = item["label"]
            if "is_correct" in item:
                row.is_correct = bool(item["is_correct"])

        correct_count = sum(1 for o in by_id.values() if o.is_correct)
        _validate_correct_options(question.type, correct_count)

    await db.flush()
    return await _load_quiz_detail(db, quiz.id)


async def get_quiz_for_module(
    db: AsyncSession,
    module_id: str,
    mentor_user_id: str,
) -> QuizDetailRead | None:
    await _get_module_owned_by_mentor(db, module_id, mentor_user_id)
    q_stmt = select(MiraClassModuleQuiz).where(
        MiraClassModuleQuiz.module_id == module_id,
        MiraClassModuleQuiz.deleted_at.is_(None),
    )
    quiz = (await db.execute(q_stmt)).scalar_one_or_none()
    if not quiz:
        return None
    return await _load_quiz_detail(db, quiz.id)
