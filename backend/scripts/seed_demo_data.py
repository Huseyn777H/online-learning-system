"""Seed the catalog with demo categories, courses, modules, lessons and quizzes.

Meant for demos/presentations where an empty catalog makes the app look unfinished.
Idempotent: if any Category already exists, the whole run is a no-op, so it's safe to
call on every container start (see Dockerfile CMD) without duplicating data.

Usage (from the backend/ directory, with the venv active or inside the container):

    python -m scripts.seed_demo_data

Docker Compose form:

    docker compose exec backend python -m scripts.seed_demo_data
"""

from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.category import Category
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.user import User
from app.security import hash_password

DEMO_TEACHER_EMAIL = "instructor@demo.ols"
DEMO_TEACHER_PASSWORD = "DemoTeach123!"
DEMO_TEACHER_NAME = "Alex Morgan"

# A small, freely embeddable public-domain sample video so lesson pages have real
# playable content instead of a broken link during a demo.
SAMPLE_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4"

CATEGORIES = ["Programming", "Web Development", "Data Science", "Design", "Business"]

COURSES = [
    {
        "title": "Python for Beginners",
        "description": "Start from zero and learn Python syntax, data types, control flow, and functions through hands-on exercises.",
        "category": "Programming",
        "level": "beginner",
        "modules": [
            {
                "title": "Getting Started",
                "lessons": [
                    ("Installing Python & Your First Script", 10),
                    ("Variables and Data Types", 14),
                ],
            },
            {
                "title": "Control Flow",
                "lessons": [
                    ("If Statements and Loops", 16),
                    ("Writing Your First Function", 12),
                ],
            },
        ],
        "quiz": {
            "title": "Python Basics Check",
            "description": "A quick check on the fundamentals covered so far.",
            "passing_score": 2,
            "time_limit": 10,
            "questions": [
                {
                    "text": "Which keyword defines a function in Python?",
                    "options": ["func", "def", "function", "lambda"],
                    "answer": "def",
                    "score": 1,
                },
                {
                    "text": "What does `len([1, 2, 3])` return?",
                    "options": ["2", "3", "4", "Error"],
                    "answer": "3",
                    "score": 1,
                },
                {
                    "text": "Which of these is a mutable type in Python?",
                    "options": ["tuple", "str", "list", "int"],
                    "answer": "list",
                    "score": 1,
                },
            ],
        },
    },
    {
        "title": "Advanced JavaScript Patterns",
        "description": "Deepen your JavaScript knowledge with closures, prototypes, async patterns, and functional composition.",
        "category": "Programming",
        "level": "advanced",
        "modules": [
            {
                "title": "Closures & Scope",
                "lessons": [
                    ("Understanding Closures", 18),
                    ("The Module Pattern", 15),
                ],
            },
            {
                "title": "Asynchronous JavaScript",
                "lessons": [
                    ("Promises Deep Dive", 20),
                    ("Async/Await in Practice", 17),
                ],
            },
        ],
    },
    {
        "title": "Full-Stack Web Development with React & Node",
        "description": "Build and deploy a complete web application using React on the frontend and Node.js/Express on the backend.",
        "category": "Web Development",
        "level": "intermediate",
        "modules": [
            {
                "title": "Frontend with React",
                "lessons": [
                    ("Components and Props", 16),
                    ("Managing State with Hooks", 19),
                ],
            },
            {
                "title": "Backend with Node & Express",
                "lessons": [
                    ("Building a REST API", 22),
                    ("Connecting to a Database", 20),
                ],
            },
        ],
    },
    {
        "title": "Modern CSS & Responsive Design",
        "description": "Master Flexbox, Grid, and responsive layout techniques to build interfaces that work on any screen size.",
        "category": "Web Development",
        "level": "beginner",
        "modules": [
            {
                "title": "Layout Fundamentals",
                "lessons": [
                    ("Flexbox in Depth", 14),
                    ("CSS Grid Essentials", 16),
                ],
            }
        ],
    },
    {
        "title": "Data Analysis with Python & Pandas",
        "description": "Learn to clean, transform, and analyze real-world datasets using the Pandas library.",
        "category": "Data Science",
        "level": "intermediate",
        "modules": [
            {
                "title": "Working with DataFrames",
                "lessons": [
                    ("Loading and Exploring Data", 15),
                    ("Filtering and Grouping", 18),
                ],
            }
        ],
    },
    {
        "title": "Machine Learning Fundamentals",
        "description": "Understand the core concepts behind supervised and unsupervised learning, and train your first models.",
        "category": "Data Science",
        "level": "advanced",
        "modules": [
            {
                "title": "Supervised Learning",
                "lessons": [
                    ("Linear Regression from Scratch", 21),
                    ("Classification with Decision Trees", 19),
                ],
            }
        ],
    },
    {
        "title": "UI/UX Design Principles",
        "description": "Learn the foundations of user-centered design, visual hierarchy, and usability heuristics.",
        "category": "Design",
        "level": "beginner",
        "modules": [
            {
                "title": "Design Foundations",
                "lessons": [
                    ("Color Theory and Typography", 12),
                    ("Usability Heuristics", 14),
                ],
            }
        ],
        "quiz": {
            "title": "Design Foundations Quiz",
            "description": "Test your understanding of core design principles.",
            "passing_score": 1,
            "time_limit": 5,
            "questions": [
                {
                    "text": "Which principle refers to guiding the user's eye through a design?",
                    "options": ["Visual hierarchy", "Skeuomorphism", "Latency", "Compression"],
                    "answer": "Visual hierarchy",
                    "score": 1,
                },
                {
                    "text": "Nielsen's heuristics are primarily used to evaluate...",
                    "options": ["Server performance", "Usability", "SEO ranking", "Database schema"],
                    "answer": "Usability",
                    "score": 1,
                },
            ],
        },
    },
    {
        "title": "Figma for Product Designers",
        "description": "Go from wireframes to polished, interactive prototypes using Figma's component and auto-layout systems.",
        "category": "Design",
        "level": "intermediate",
        "modules": [
            {
                "title": "Prototyping in Figma",
                "lessons": [
                    ("Components and Variants", 13),
                    ("Building Interactive Prototypes", 17),
                ],
            }
        ],
    },
    {
        "title": "Digital Marketing Strategy",
        "description": "Build a practical digital marketing plan covering SEO, content, email, and social media channels.",
        "category": "Business",
        "level": "beginner",
        "modules": [
            {
                "title": "Marketing Channels",
                "lessons": [
                    ("SEO Fundamentals", 15),
                    ("Content & Social Strategy", 16),
                ],
            }
        ],
    },
    {
        "title": "Project Management Essentials",
        "description": "Learn the core frameworks (Agile, Scrum, Kanban) used to plan and deliver projects on time.",
        "category": "Business",
        "level": "intermediate",
        "modules": [
            {
                "title": "Agile Foundations",
                "lessons": [
                    ("Scrum Roles and Ceremonies", 14),
                    ("Kanban and Flow", 12),
                ],
            }
        ],
    },
]


def seed() -> int:
    db = SessionLocal()
    try:
        if db.query(Category.id).first() is not None:
            print("No-op: catalog already has data (at least one category exists).")
            return 0

        teacher = db.query(User).filter(User.email == DEMO_TEACHER_EMAIL).first()
        if teacher is None:
            teacher = User(
                full_name=DEMO_TEACHER_NAME,
                email=DEMO_TEACHER_EMAIL,
                password_hash=hash_password(DEMO_TEACHER_PASSWORD),
                role="teacher",
            )
            db.add(teacher)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                teacher = db.query(User).filter(User.email == DEMO_TEACHER_EMAIL).first()
            else:
                db.refresh(teacher)

        categories_by_name: dict[str, Category] = {}
        for name in CATEGORIES:
            category = Category(name=name, description=f"{name} courses")
            db.add(category)
            categories_by_name[name] = category
        db.commit()
        for category in categories_by_name.values():
            db.refresh(category)

        course_count = 0
        for course_data in COURSES:
            course = Course(
                title=course_data["title"],
                description=course_data["description"],
                category_id=categories_by_name[course_data["category"]].id,
                teacher_id=teacher.id,
                level=course_data["level"],
                status="published",
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            course_count += 1

            for module_index, module_data in enumerate(course_data["modules"], start=1):
                module = Module(course_id=course.id, title=module_data["title"], order_index=module_index)
                db.add(module)
                db.commit()
                db.refresh(module)

                for lesson_title, duration in module_data["lessons"]:
                    lesson = Lesson(
                        module_id=module.id,
                        title=lesson_title,
                        content_type="video",
                        content_url=SAMPLE_VIDEO_URL,
                        duration=duration,
                    )
                    db.add(lesson)
                db.commit()

            quiz_data = course_data.get("quiz")
            if quiz_data:
                quiz = Quiz(
                    course_id=course.id,
                    title=quiz_data["title"],
                    description=quiz_data["description"],
                    passing_score=quiz_data["passing_score"],
                    time_limit=quiz_data["time_limit"],
                )
                db.add(quiz)
                db.commit()
                db.refresh(quiz)

                for q in quiz_data["questions"]:
                    question = Question(
                        quiz_id=quiz.id,
                        question_text=q["text"],
                        options=q["options"],
                        correct_answer=q["answer"],
                        score=q["score"],
                    )
                    db.add(question)
                db.commit()

        print(
            f"Seeded {len(categories_by_name)} categories and {course_count} courses "
            f"(instructor: {DEMO_TEACHER_EMAIL} / {DEMO_TEACHER_PASSWORD})."
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(seed())
