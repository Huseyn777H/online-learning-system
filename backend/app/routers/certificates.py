from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.certificate import CertificateGenerate, CertificateOut
from app.services.certificate_pdf import generate_and_upload_certificate, generate_certificate_code

router = APIRouter(tags=["certificates"])


@router.get("/courses/{course_id}/certificate", response_model=CertificateOut)
def get_course_certificate(
    course_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> CertificateOut:
    certificate = (
        db.query(Certificate)
        .filter(Certificate.student_id == current_user.id, Certificate.course_id == course_id)
        .first()
    )
    if certificate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    return CertificateOut.model_validate(certificate)


@router.post("/certificates/generate", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def generate_certificate(
    payload: CertificateGenerate,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> CertificateOut:
    course_id = payload.course_id

    existing = (
        db.query(Certificate)
        .filter(Certificate.student_id == current_user.id, Certificate.course_id == course_id)
        .first()
    )
    if existing is not None:
        return CertificateOut.model_validate(existing)

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    if enrollment.progress < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course must be 100% complete before a certificate can be generated",
        )

    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    teacher = db.get(User, course.teacher_id)
    teacher_name = teacher.full_name if teacher is not None else "Unknown Instructor"

    certificate_code = generate_certificate_code(course_id, current_user.id)
    completion_date = datetime.now(timezone.utc)

    certificate_url = generate_and_upload_certificate(
        student_name=current_user.full_name,
        course_title=course.title,
        teacher_name=teacher_name,
        completion_date=completion_date,
        certificate_code=certificate_code,
    )

    certificate = Certificate(
        student_id=current_user.id,
        course_id=course_id,
        certificate_url=certificate_url,
        certificate_code=certificate_code,
        issued_at=completion_date,
    )
    db.add(certificate)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already created the certificate for this student+course.
        db.rollback()
        existing = (
            db.query(Certificate)
            .filter(Certificate.student_id == current_user.id, Certificate.course_id == course_id)
            .first()
        )
        if existing is not None:
            return CertificateOut.model_validate(existing)
        raise
    db.refresh(certificate)

    return CertificateOut.model_validate(certificate)
