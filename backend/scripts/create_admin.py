"""Bootstrap a single admin user.

Public registration (POST /api/auth/register) only accepts role=student|teacher, so the
first admin account must be created out-of-band via this script. It is idempotent: running
it again with the same email is a clear no-op rather than a duplicate/error.

Usage (from the backend/ directory, with the venv active or inside the container):

    python -m scripts.create_admin --email admin@example.com --password "S3curePass!" --full-name "Site Admin"

Or, reading from environment variables (handy for Docker/CI):

    ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="S3curePass!" ADMIN_FULL_NAME="Site Admin" \
        python -m scripts.create_admin

Docker Compose form:

    docker compose exec backend python -m scripts.create_admin \
        --email admin@example.com --password "S3curePass!" --full-name "Site Admin"
"""

import argparse
import os
import sys

from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create (or verify) the bootstrap admin user.")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL"), help="Admin email (or set ADMIN_EMAIL)")
    parser.add_argument(
        "--password", default=os.getenv("ADMIN_PASSWORD"), help="Admin password (or set ADMIN_PASSWORD)"
    )
    parser.add_argument(
        "--full-name",
        default=os.getenv("ADMIN_FULL_NAME", "Administrator"),
        help="Admin full name (or set ADMIN_FULL_NAME, defaults to 'Administrator')",
    )
    return parser.parse_args()


def create_admin(email: str, password: str, full_name: str) -> int:
    if not email or not password:
        print("ERROR: an email and password are required (via --email/--password or ADMIN_EMAIL/ADMIN_PASSWORD).")
        return 1

    if len(password.encode("utf-8")) > 72:
        print("ERROR: password exceeds bcrypt's 72-byte limit.")
        return 1

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            print(f"No-op: a user with email '{email}' already exists (role={existing.role}, id={existing.id}).")
            return 0

        admin = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(admin)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            print(f"No-op: a user with email '{email}' already exists (created concurrently).")
            return 0
        db.refresh(admin)

        print(f"Created admin user id={admin.id} email={admin.email}")
        return 0
    finally:
        db.close()


def main() -> None:
    args = parse_args()
    exit_code = create_admin(args.email, args.password, args.full_name)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
