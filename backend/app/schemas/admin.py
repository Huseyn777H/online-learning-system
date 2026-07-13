from app.schemas.common import CamelModel


class AdminStatsOut(CamelModel):
    total_users: int
    total_students: int
    total_teachers: int
    total_courses: int
    active_enrollments: int
    assignments_submitted: int
