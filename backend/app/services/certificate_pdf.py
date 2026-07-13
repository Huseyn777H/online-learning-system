import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.storage import upload_bytes


def _generate_pdf_bytes(
    student_name: str,
    course_title: str,
    teacher_name: str,
    completion_date: datetime,
    certificate_code: str,
) -> bytes:
    buffer = io.BytesIO()
    page_size = landscape(letter)
    c = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    c.setStrokeColor(colors.HexColor("#2C3E50"))
    c.setLineWidth(4)
    c.rect(0.4 * inch, 0.4 * inch, width - 0.8 * inch, height - 0.8 * inch)

    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(colors.HexColor("#2C3E50"))
    c.drawCentredString(width / 2, height - 1.6 * inch, "Certificate of Completion")

    c.setFont("Helvetica", 16)
    c.setFillColor(colors.black)
    c.drawCentredString(width / 2, height - 2.3 * inch, "This certifies that")

    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 3.0 * inch, student_name)

    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2, height - 3.6 * inch, "has successfully completed the course")

    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 4.3 * inch, course_title)

    c.setFont("Helvetica", 14)
    c.drawCentredString(
        width / 2, height - 5.0 * inch, f"Instructor: {teacher_name}"
    )
    c.drawCentredString(
        width / 2, height - 5.4 * inch, f"Completion date: {completion_date.strftime('%Y-%m-%d')}"
    )

    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(width / 2, 0.8 * inch, f"Certificate Code: {certificate_code}")

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.read()


def generate_certificate_code(course_id: int, student_id: int) -> str:
    year = datetime.now(timezone.utc).year
    unique_suffix = f"{course_id:03d}{student_id:03d}"
    return f"CERT-{year}-{unique_suffix.zfill(6)}"


def generate_and_upload_certificate(
    student_name: str,
    course_title: str,
    teacher_name: str,
    completion_date: datetime,
    certificate_code: str,
) -> str:
    """Generates a certificate PDF and uploads it via storage.py. Returns the resulting URL."""
    pdf_bytes = _generate_pdf_bytes(student_name, course_title, teacher_name, completion_date, certificate_code)
    filename = f"{certificate_code}.pdf"
    return upload_bytes(pdf_bytes, filename, folder="certificates")
