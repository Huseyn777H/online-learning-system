from datetime import datetime

from app.schemas.common import CamelModel


class CertificateGenerate(CamelModel):
    course_id: int


class CertificateOut(CamelModel):
    id: int
    student_id: int
    course_id: int
    certificate_url: str
    issued_at: datetime
    certificate_code: str
