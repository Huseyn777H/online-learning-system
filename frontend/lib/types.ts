// Shared types matching docs/API_SPEC.md exactly (camelCase fields).

export type Role = "student" | "teacher" | "admin";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "inactive";

export interface Course {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  teacherId: number;
  level: CourseLevel;
  status: CourseStatus;
  createdAt: string;
  modules?: Module[];
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  orderIndex: number;
  lessons?: Lesson[];
}

export type ContentType = "video" | "pdf" | "text";

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  contentType: ContentType;
  contentUrl: string | null;
  duration: number;
  completed?: boolean;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  progress: number;
  enrolledAt: string;
  course?: Course;
}

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
}

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  answerUrl: string;
  score: number | null;
  feedback: string | null;
  isLate: boolean;
  submittedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Quiz {
  id: number;
  courseId: number;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number | null;
  questions?: Question[];
}

export interface Question {
  id: number;
  quizId: number;
  questionText: string;
  options: string[];
  correctAnswer?: string; // hidden from students
  score: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  studentId: number;
  score: number;
  submittedAt: string;
  passed: boolean;
}

export interface Certificate {
  id: number;
  studentId: number;
  courseId: number;
  certificateUrl: string;
  issuedAt: string;
  certificateCode: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeEnrollments: number;
  assignmentsSubmitted: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  detail: string;
}
