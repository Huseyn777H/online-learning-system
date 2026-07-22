import type {
  AdminStats,
  Assignment,
  Category,
  Certificate,
  Course,
  Enrollment,
  Lesson,
  Module,
  Notification,
  Paginated,
  Question,
  Quiz,
  QuizAttempt,
  Role,
  Submission,
  User,
} from "./types";

// Browser requests remain same-origin and are proxied server-side. That keeps
// the backend address out of the client bundle and removes CORS coupling.
const API_URL = "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "ols_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    throw new ApiError(0, "Network error — could not reach the server. Is the backend running?");
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const detail =
      (data as { detail?: string } | null)?.detail || `Request failed with status ${res.status}`;

    // An authenticated request that comes back 401 means the stored token is
    // missing/expired/invalid — clear it and bounce to /login rather than
    // leaving the user staring at a per-page error forever. Calls made with
    // auth: false (login/register) legitimately return 401 for bad
    // credentials and must not trigger this. Skip the redirect if we're
    // already on /login to avoid a pointless reload loop.
    if (
      res.status === 401 &&
      auth &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      setToken(null);
      window.location.href = "/login";
    }

    throw new ApiError(res.status, detail);
  }

  return data as T;
}

// ---------- Auth ----------
export const authApi = {
  register: (body: { fullName: string; email: string; password: string; role: Role }) =>
    request<{ user: User; accessToken: string }>("/api/auth/register", {
      method: "POST",
      body,
      auth: false,
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; accessToken: string }>("/api/auth/login", {
      method: "POST",
      body,
      auth: false,
    }),
};

// ---------- Users ----------
export const usersApi = {
  getProfile: () => request<User>("/api/users/profile"),
  updateProfile: (body: Partial<{ fullName: string; email: string }>) =>
    request<User>("/api/users/profile", { method: "PATCH", body }),
};

// ---------- Courses ----------
export const coursesApi = {
  list: (query?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    level?: string;
    teacherId?: number;
    status?: string;
  }) => request<Paginated<Course>>("/api/courses", { query, auth: true }),
  create: (body: { title: string; description: string; categoryId: number; level: string }) =>
    request<Course>("/api/courses", { method: "POST", body }),
  get: (id: number) => request<Course>(`/api/courses/${id}`),
  update: (id: number, body: Partial<Course>) =>
    request<Course>(`/api/courses/${id}`, { method: "PATCH", body }),
  remove: (id: number) => request<Course>(`/api/courses/${id}`, { method: "DELETE" }),
  enroll: (id: number) => request<Enrollment>(`/api/courses/${id}/enroll`, { method: "POST" }),
  search: (query: {
    keyword?: string;
    category?: string;
    level?: string;
    page?: number;
    pageSize?: number;
  }) => request<Paginated<Course>>("/api/courses/search", { query, auth: false }),
  getCertificate: (id: number) =>
    request<Certificate>(`/api/courses/${id}/certificate`),
};

// ---------- Enrollments ----------
export const enrollmentsApi = {
  mine: () => request<Enrollment[]>("/api/enrollments"),
};

// ---------- Modules & Lessons ----------
export const modulesApi = {
  create: (body: { courseId: number; title: string; orderIndex: number }) =>
    request<Module>("/api/modules", { method: "POST", body }),
  update: (id: number, body: Partial<Module>) =>
    request<Module>(`/api/modules/${id}`, { method: "PATCH", body }),
};

export const lessonsApi = {
  create: (body: {
    moduleId: number;
    title: string;
    contentType: string;
    contentUrl: string;
    duration: number;
  }) => request<Lesson>("/api/lessons", { method: "POST", body }),
  complete: (id: number) =>
    request<Enrollment>(`/api/lessons/${id}/complete`, { method: "PATCH" }),
};

// ---------- Assignments & Submissions ----------
export const assignmentsApi = {
  create: (body: {
    courseId: number;
    title: string;
    description: string;
    deadline: string;
    maxScore: number;
  }) => request<Assignment>("/api/assignments", { method: "POST", body }),
  listByCourse: (courseId: number) =>
    request<Assignment[]>("/api/assignments", { query: { courseId } }),
  // For the student "Assignments" page across all enrolled courses.
  mine: () => request<Assignment[]>("/api/assignments/mine"),
  submit: (id: number, body: { answerUrl: string }) =>
    request<Submission>(`/api/assignments/${id}/submit`, { method: "POST", body }),
};

export const submissionsApi = {
  listByAssignment: (assignmentId: number) =>
    request<Submission[]>("/api/submissions", { query: { assignmentId } }),
  // For the student "Grades" page: all of the current student's submissions.
  mine: () => request<Submission[]>("/api/submissions/mine"),
  grade: (id: number, body: { score: number; feedback: string }) =>
    request<Submission>(`/api/submissions/${id}/grade`, { method: "PATCH", body }),
};

// ---------- Notifications ----------
export const notificationsApi = {
  list: () => request<Notification[]>("/api/notifications"),
  markRead: (ids: number[] = []) =>
    request<Notification[]>("/api/notifications/read", { method: "PATCH", body: { ids } }),
};

// ---------- Admin ----------
export const adminApi = {
  stats: () => request<AdminStats>("/api/admin/stats"),
  users: (query?: { page?: number; pageSize?: number; role?: string }) =>
    request<Paginated<User>>("/api/admin/users", { query }),
  updateUserRole: (id: number, body: { role: Role }) =>
    request<User>(`/api/admin/users/${id}`, { method: "PATCH", body }),
};

// ---------- Categories ----------
export const categoriesApi = {
  list: () => request<Category[]>("/api/categories", { auth: false }),
  create: (body: { name: string; description: string }) =>
    request<Category>("/api/categories", { method: "POST", body }),
  update: (id: number, body: Partial<{ name: string; description: string }>) =>
    request<Category>(`/api/categories/${id}`, { method: "PATCH", body }),
  remove: (id: number) => request<Category>(`/api/categories/${id}`, { method: "DELETE" }),
};

// ---------- Quizzes ----------
export const quizzesApi = {
  listByCourse: (courseId: number) => request<Quiz[]>("/api/quizzes", { query: { courseId } }),
  create: (body: {
    courseId: number;
    title: string;
    description: string;
    passingScore: number;
    timeLimit: number | null;
  }) => request<Quiz>("/api/quizzes", { method: "POST", body }),
  addQuestion: (
    quizId: number,
    body: { questionText: string; options: string[]; correctAnswer: string; score: number }
  ) => request<Question>(`/api/quizzes/${quizId}/questions`, { method: "POST", body }),
  get: (id: number) => request<Quiz>(`/api/quizzes/${id}`),
  submit: (id: number, body: { answers: { questionId: number; answer: string }[] }) =>
    request<QuizAttempt>(`/api/quizzes/${id}/submit`, { method: "POST", body }),
};

// ---------- Certificates ----------
export const certificatesApi = {
  generate: (body: { courseId: number }) =>
    request<Certificate>("/api/certificates/generate", { method: "POST", body }),
};
