from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class SubmissionResponse(BaseModel):
    submission_id: str


class TestQuestion(BaseModel):
    id: str
    prompt: str
    options: List[str]


class TestStartResponse(BaseModel):
    test_id: str
    questions: List[TestQuestion]


class TestAnswer(BaseModel):
    question_id: str
    answer_index: int = Field(..., ge=0)


class TestSubmitPayload(BaseModel):
    test_id: str
    answers: List[TestAnswer]


class TestSubmitResponse(BaseModel):
    attempt_id: str
    score: int
    percent: int
    passed: bool
    module_validated: bool


class TestTemplate(BaseModel):
    id: str
    topic: Literal["python", "pandas", "sql", "viz"]
    concept: str
    question: str
    correct: str
    distractors: List[str]
    difficulty: Literal["easy", "medium", "hard"]
    tags: List[str]
