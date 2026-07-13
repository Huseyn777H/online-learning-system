from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_current_user, get_db, require_role
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuestionCreate,
    QuestionOut,
    QuizAttemptOut,
    QuizCreate,
    QuizDetailOut,
    QuizOut,
    QuizSubmit,
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _assert_owns_course(db: Session, course_id: int, current_user: User) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this course")
    return course


def _is_enrolled(db: Session, user_id: int, course_id: int) -> bool:
    return (
        db.query(Enrollment.id)
        .filter(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        .first()
        is not None
    )


def _can_view_quiz(db: Session, quiz: Quiz, current_user: User) -> tuple[bool, bool]:
    """Returns (is_allowed, is_owner_or_admin) for viewing a quiz's questions/answers."""
    course = db.get(Course, quiz.course_id)
    is_owner_or_admin = current_user.role == "admin" or (
        current_user.role == "teacher" and course is not None and course.teacher_id == current_user.id
    )
    is_enrolled_student = current_user.role == "student" and _is_enrolled(db, current_user.id, quiz.course_id)
    return (is_owner_or_admin or is_enrolled_student), is_owner_or_admin


@router.post("", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
def create_quiz(
    payload: QuizCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> QuizOut:
    _assert_owns_course(db, payload.course_id, current_user)

    quiz = Quiz(
        course_id=payload.course_id,
        title=payload.title,
        description=payload.description,
        passing_score=payload.passing_score,
        time_limit=payload.time_limit,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return QuizOut.model_validate(quiz)


@router.post("/{quiz_id}/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def add_question(
    quiz_id: int,
    payload: QuestionCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> QuestionOut:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    _assert_owns_course(db, quiz.course_id, current_user)

    if payload.correct_answer not in payload.options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="correctAnswer must match one of the provided options"
        )

    question = Question(
        quiz_id=quiz_id,
        question_text=payload.question_text,
        options=payload.options,
        correct_answer=payload.correct_answer,
        score=payload.score,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return QuestionOut.model_validate(question)


@router.get("/{quiz_id}", response_model=QuizDetailOut)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizDetailOut:
    quiz = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.id == quiz_id)
        .first()
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    is_allowed, is_owner_or_admin = _can_view_quiz(db, quiz, current_user)
    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view this quiz")

    detail = QuizDetailOut.model_validate(quiz)
    if not is_owner_or_admin:
        for question in detail.questions:
            question.correct_answer = None

    return detail


@router.get("", response_model=list[QuizDetailOut])
def list_quizzes_for_course(
    course_id: int = Query(alias="courseId"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[QuizDetailOut]:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    is_owner_or_admin = current_user.role == "admin" or (
        current_user.role == "teacher" and course.teacher_id == current_user.id
    )
    is_enrolled_student = current_user.role == "student" and _is_enrolled(db, current_user.id, course_id)

    if not is_owner_or_admin and not is_enrolled_student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view these quizzes")

    quizzes = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.course_id == course_id)
        .all()
    )

    results = []
    for quiz in quizzes:
        detail = QuizDetailOut.model_validate(quiz)
        if not is_owner_or_admin:
            for question in detail.questions:
                question.correct_answer = None
        results.append(detail)

    return results


@router.post("/{quiz_id}/submit", response_model=QuizAttemptOut, status_code=status.HTTP_201_CREATED)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmit,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> QuizAttemptOut:
    quiz = (
        db.query(Quiz)
        .options(selectinload(Quiz.questions))
        .filter(Quiz.id == quiz_id)
        .first()
    )
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if not _is_enrolled(db, current_user.id, quiz.course_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    answers_by_question = {answer.question_id: answer.answer for answer in payload.answers}

    total_score = 0
    for question in quiz.questions:
        submitted_answer = answers_by_question.get(question.id)
        if submitted_answer is not None and submitted_answer == question.correct_answer:
            total_score += question.score

    passed = total_score >= quiz.passing_score

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        score=total_score,
        passed=passed,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizAttemptOut.model_validate(attempt)
