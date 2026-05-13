"""Schémas Pydantic — QCM module (`contracts/group-b-class/mira_class_module_quiz.md`)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

QuizStatus = Literal["draft", "published", "archived"]


class MiraClassModuleQuizGenerateRequest(BaseModel):
    question_count: int = Field(default=5, ge=3, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class MiraClassModuleQuizRead(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    pass_threshold_pct: int
    time_limit_seconds: int | None
    max_attempts: int
    shuffle_questions: bool
    shuffle_options: bool
    show_explanations_after: bool
    status: QuizStatus
    ai_generated: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizOptionRead(BaseModel):
    id: str
    position: int
    label: str
    is_correct: bool
    explanation: str | None

    model_config = ConfigDict(from_attributes=True)


class QuizQuestionRead(BaseModel):
    id: str
    position: int
    type: str
    prompt: str
    points: int
    explanation: str | None
    options: list[QuizOptionRead]

    model_config = ConfigDict(from_attributes=True)


class QuizDetailRead(BaseModel):
    quiz: MiraClassModuleQuizRead
    questions: list[QuizQuestionRead]


class _LLMOptionIn(BaseModel):
    label: str = Field(..., min_length=1, max_length=2000)
    is_correct: bool = False


class _LLMQuestionIn(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    explanation: str | None = Field(None, max_length=5000)
    options: list[_LLMOptionIn] = Field(..., min_length=2, max_length=8)


class _LLMQuizPayloadIn(BaseModel):
    questions: list[_LLMQuestionIn] = Field(..., min_length=1, max_length=15)
