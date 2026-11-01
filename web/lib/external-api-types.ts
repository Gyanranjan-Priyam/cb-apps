/**
 * TypeScript type definitions for External Data API
 * 
 * Use these types when integrating with the External Data API endpoint
 * to ensure type safety and better developer experience.
 */

// ==================== API Response Types ====================

export interface APIResponse<T> {
  success: boolean;
  resource: string;
  data: T;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  limit: number;
  offset: number;
  totalCount?: number;
  returnedCount: number;
  hasMore: boolean;
  currentPage: number;
  totalPages?: number;
  timestamp: string;
}

export interface APIError {
  error: string;
  message: string;
  code: ErrorCode;
  details?: string;
  resetTime?: string;
}

export type ErrorCode =
  | 'AUTH_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MISSING_RESOURCE'
  | 'INVALID_RESOURCE'
  | 'INTERNAL_ERROR';

// ==================== Resource Types ====================

export type Resource =
  | 'users'
  | 'attendance'
  | 'tasks'
  | 'events'
  | 'quizzes'
  | 'projects'
  | 'reviews'
  | 'all';

// ==================== User Types ====================

export interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  image: string | null;
  profileImageKey: string | null;
  state: string | null;
  district: string | null;
  collegeName: string | null;
  collegeAddress: string | null;
  registration: string | null;
  rollNumber: string | null;
  branch: string | null;
  admissionYear: string | null;
  address: string | null;
  postOffice: string | null;
  policeStation: string | null;
  block: string | null;
  pinCode: string | null;
  profileComplete: boolean;
  githubUsername: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
  publishedProjects?: PublishedProjectSummary[];
  projectReviews?: ProjectReviewSummary[];
}

// ==================== Attendance Types ====================

export interface AttendanceSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  day: string;
  createdAt: string;
  createdBy: string;
  attendances?: Attendance[];
}

export interface Attendance {
  id: string;
  userId: string;
  status: string;
  points: number;
  markedAt: string;
  markedBy: string;
}

// ==================== Task Types ====================

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
  startDate: string;
  dueDate: string;
  points: number;
  createdAt: string;
  createdBy: string;
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id: string;
  userId: string;
  status: string;
  projectUrl: string | null;
  submittedAt: string | null;
  evaluatedAt: string | null;
  pointsAwarded: number;
  feedback: string | null;
}

// ==================== Event Types ====================

export interface EventPoint {
  id: string;
  eventNumber: number;
  title: string;
  description: string | null;
  eventDate: string;
  points: number;
  createdAt: string;
  createdBy: string;
  participations?: EventParticipation[];
}

export interface EventParticipation {
  id: string;
  userId: string;
  status: string;
  participatedAt: string | null;
  evaluatedAt: string | null;
  pointsAwarded: number;
  feedback: string | null;
}

// ==================== Quiz Types ====================

export interface Quiz {
  id: string;
  quizId: string;
  title: string;
  description: string;
  sets: number;
  duration: number;
  pointsPerQuestion: number;
  startDateTime: string | null;
  endDateTime: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  attempts?: QuizAttempt[];
  setAssignments?: QuizSetAssignment[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  setNumber: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  startedAt: string;
  completedAt: string | null;
}

export interface QuizSetAssignment {
  userId: string;
  assignedSet: string;
  assignedAt: string;
}

// ==================== Project Types ====================

export interface PublishedProject {
  id: string;
  githubRepoId: number;
  title: string;
  description: string;
  techStack: string[];
  projectUrl: string | null;
  thumbnailKey: string;
  publishedById: string;
  createdAt: string;
  updatedAt: string;
  publishedBy?: UserSummary;
}

export interface PublishedProjectSummary {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  projectUrl: string | null;
  createdAt: string;
}

// ==================== Project Review Types ====================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewType = 'review' | 'collaboration' | 'publish';

export interface ProjectReview {
  id: string;
  userId: string;
  repoName: string;
  repoUrl: string;
  description: string;
  reviewType: ReviewType;
  explanation: string;
  liveUrl: string | null;
  whatsappNumber: string | null;
  status: ReviewStatus;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

export interface ProjectReviewSummary {
  id: string;
  repoName: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  createdAt: string;
}

// ==================== All Resource Summary ====================

export interface AllDataSummary {
  summary: {
    totalUsers: number;
    totalAttendanceSessions: number;
    totalTasks: number;
    totalEvents: number;
    totalQuizzes: number;
    totalPublishedProjects: number;
    totalProjectReviews: number;
  };
  systemSettings: SystemSetting[];
  message: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

// ==================== Helper Types ====================

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  username: string | null;
}

// ==================== Query Parameters ====================

export interface BaseQueryParams {
  resource: Resource;
  limit?: number;
  offset?: number;
  includeRelations?: boolean;
}

export interface UserQueryParams extends BaseQueryParams {
  resource: 'users';
  branch?: string;
  admissionYear?: string;
  profileComplete?: boolean;
  role?: string;
}

export interface QuizQueryParams extends BaseQueryParams {
  resource: 'quizzes';
  isActive?: boolean;
}

export interface ReviewQueryParams extends BaseQueryParams {
  resource: 'reviews';
  status?: ReviewStatus;
  reviewType?: ReviewType;
}

export type QueryParams =
  | BaseQueryParams
  | UserQueryParams
  | QuizQueryParams
  | ReviewQueryParams;

// ==================== API Client Configuration ====================

export interface ExternalAPIConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

// ==================== Type Guards ====================

export function isAPIResponse<T>(obj: any): obj is APIResponse<T> {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.resource === 'string' &&
    'data' in obj &&
    'metadata' in obj
  );
}

export function isAPIError(obj: any): obj is APIError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.error === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.code === 'string'
  );
}
