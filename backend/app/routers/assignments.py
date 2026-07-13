from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_role
from app.models.assignment import Assignment
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.submission import Submission
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentOut, SubmissionCreate, SubmissionGrade, SubmissionOut
from app.services.cache import invalidate_admin_stats_cache

router = APIRouter(tags=["assignments"])


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


@router.post("/assignments", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> AssignmentOut:
    _assert_owns_course(db, payload.course_id, current_user)

    assignment = Assignment(
        course_id=payload.course_id,
        title=payload.title,
        description=payload.description,
        deadline=payload.deadline,
        max_score=payload.max_score,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return AssignmentOut.model_validate(assignment)


@router.get("/assignments/mine", response_model=list[AssignmentOut])
def list_my_assignments(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> list[AssignmentOut]:
    course_ids = [
        row[0]
        for row in db.query(Enrollment.course_id).filter(Enrollment.user_id == current_user.id).all()
    ]
    if not course_ids:
        return []

    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id.in_(course_ids))
        .order_by(Assignment.deadline)
        .all()
    )
    return [AssignmentOut.model_validate(a) for a in assignments]


@router.get("/assignments", response_model=list[AssignmentOut])
def list_assignments_for_course(
    course_id: int = Query(alias="courseId"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AssignmentOut]:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    is_owner_or_admin = current_user.role == "admin" or (
        current_user.role == "teacher" and course.teacher_id == current_user.id
    )
    is_enrolled_student = current_user.role == "student" and _is_enrolled(db, current_user.id, course_id)

    if not is_owner_or_admin and not is_enrolled_student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view these assignments")

    assignments = (
        db.query(Assignment).filter(Assignment.course_id == course_id).order_by(Assignment.deadline).all()
    )
    return [AssignmentOut.model_validate(a) for a in assignments]


@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
def submit_assignment(
    assignment_id: int,
    payload: SubmissionCreate,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> SubmissionOut:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == assignment.course_id)
        .first()
    )
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    existing = (
        db.query(Submission)
        .filter(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment already submitted")

    now = datetime.now(timezone.utc)
    deadline = assignment.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    is_late = now > deadline

    submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        answer_url=payload.answer_url,
        is_late=is_late,
        submitted_at=now,
    )
    db.add(submission)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already submitted this assignment.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assignment already submitted")
    db.refresh(submission)

    invalidate_admin_stats_cache()

    return SubmissionOut.model_validate(submission)


@router.get("/submissions/mine", response_model=list[SubmissionOut])
def list_my_submissions(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> list[SubmissionOut]:
    submissions = (
        db.query(Submission)
        .filter(Submission.student_id == current_user.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [SubmissionOut.model_validate(s) for s in submissions]


@router.get("/submissions", response_model=list[SubmissionOut])
def list_submissions_for_assignment(
    assignment_id: int = Query(alias="assignmentId"),
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> list[SubmissionOut]:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    _assert_owns_course(db, assignment.course_id, current_user)

    submissions = (
        db.query(Submission)
        .filter(Submission.assignment_id == assignment_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    return [SubmissionOut.model_validate(s) for s in submissions]


@router.patch("/submissions/{submission_id}/grade", response_model=SubmissionOut)
def grade_submission(
    submission_id: int,
    payload: SubmissionGrade,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> SubmissionOut:
    submission = db.get(Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    assignment = db.get(Assignment, submission.assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    _assert_owns_course(db, assignment.course_id, current_user)

    if payload.score > assignment.max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Score cannot exceed assignment max score of {assignment.max_score}",
        )

    submission.score = payload.score
    submission.feedback = payload.feedback
    db.add(submission)

    notification = Notification(
        user_id=submission.student_id,
        type="grade",
        message=f"Your submission for '{assignment.title}' was graded: {payload.score}/{assignment.max_score}",
    )
    db.add(notification)

    db.commit()
    db.refresh(submission)

    return SubmissionOut.model_validate(submission)
