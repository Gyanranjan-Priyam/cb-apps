import { API_BASE_URL } from "./api-config";

export interface DashboardRealStats {
  totalMembers: number;
  activeBatches: number;
  avgAttendanceRate: string;
  totalPointsIssued: string;
  rawPoints: number;
  counts: {
    quizzes: number;
    tasks: number;
    events: number;
    batches: number;
  };
  recentSession?: {
    id: string;
    sessionNumber: number;
    title: string;
    date: string;
    presentCount: number;
  } | null;
  recentTask?: {
    id: string;
    title: string;
    points: number;
    submissionsCount: number;
    dueDate: string;
  } | null;
  recentMembers?: Array<{
    id: string;
    name: string;
    image?: string | null;
    profileImageKey?: string | null;
    branch: string;
  }>;
}

export interface RealMember {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  batch: string;
  batchCode: string | null;
  status: string;
  createdAt: string;
}

export interface RealBatch {
  id: string;
  name: string;
  code: string;
  description: string;
  admissionYear: string;
  status: string;
  membersCount: number;
  createdAt: string;
}

export interface RealBatchMember {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  rollNumber: string | null;
  registration: string | null;
  status: string;
  image?: string | null;
  createdAt: string;
}

export interface RealBatchDetail extends RealBatch {
  members: RealBatchMember[];
}

export interface RealUnassignedMember {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  rollNumber: string | null;
  registration: string | null;
  status: string;
  image?: string | null;
}

export interface RealAttendanceSession {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  day: string;
  targetBatchIds: string[];
  targetBatchNames?: string[];
  targetBatchLabel?: string;
  presentCount: number;
  totalEligible?: number;
  totalMarked?: number;
}

export interface RealAttendanceStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  rollNumber: string | null;
  registration: string | null;
  image?: string | null;
  batchId?: string | null;
  batchName: string;
  batchCode: string;
  status: "present" | "absent";
  markedAt: string | null;
  method: string;
  points: number;
}

export interface RealAttendanceSessionDetail {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  day: string;
  targetBatchIds: string[];
  targetBatchLabel: string;
  totalEligible: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  students: RealAttendanceStudent[];
}

export interface RealAttendanceData {
  sessions: RealAttendanceSession[];
  recentLogs: {
    id: string;
    name: string;
    event: string;
    time: string;
    status: string;
    method: string;
  }[];
}

export interface RealQuiz {
  id: string;
  quizId: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: string;
  participants: number;
  status: string;
}

export interface RealTask {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  points: string;
  dueDate: string;
  submissionsCount: number;
}

export interface RealLeaderboardUser {
  rank: number;
  id: string;
  name: string;
  email: string;
  points: number;
}

export interface RealPointsData {
  totalPoints: number;
  activity: {
    id: string;
    reason: string;
    target: string;
    points: string;
    date: string;
  }[];
}

export interface RealForm {
  id: string;
  formId: string;
  title: string;
  description: string;
  isPublished: boolean;
  acceptingResponses: boolean;
  publishedAt: string | null;
  responsesCount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RealFormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  order?: number;
  paymentAmount?: number;
  entryLabel?: string;
  subQuestions?: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }[];
}

export interface RealFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: RealFormField[];
}

export interface RealFormDefinition {
  theme?: string;
  bannerKey?: string;
  sections?: RealFormSection[];
  settings?: {
    submitButtonLabel?: string;
    successMessage?: string;
    allowMultipleSubmissions?: boolean;
    collectName?: boolean;
    collectEmail?: boolean;
  };
}

export interface RealFormFile {
  id: string;
  fieldId: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  googleDriveWebViewLink: string | null;
  googleDriveDownloadLink: string | null;
}

export interface RealFormResponse {
  id: string;
  formId: string;
  answers: Record<string, unknown>;
  transactionId: string | null;
  paymentStatus: string; // "verified" | "rejected" | "pending"
  verifiedAt: string | null;
  createdAt: string;
  submittedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    branch?: string | null;
    rollNumber?: string | null;
    registration?: string | null;
  } | null;
  files: RealFormFile[];
}

export interface RealFormDetail {
  id: string;
  formId: string;
  title: string;
  description: string;
  isPublished: boolean;
  acceptingResponses: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  definition: RealFormDefinition;
  responsesCount: number;
  responses: RealFormResponse[];
}

export interface RealRoadmap {
  id: string;
  slug: string;
  title: string;
  category: string;
  badgeText: string;
  stagesCount: number;
  enrolledCount: number;
}

export interface RealTransactionForm {
  id: string;
  formId: string;
  title: string;
  description: string;
  paymentAmount: number;
  formattedAmount: string;
  totalTransactions: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalRevenue: number;
  formattedRevenue: string;
  lastTransactionDate: string | null;
  createdAt: string;
}

export interface RealTransactionFormsPayload {
  forms: RealTransactionForm[];
  stats: {
    totalRevenue: number;
    formattedTotalRevenue: string;
    totalTransactions: number;
    totalVerified: number;
    totalPending: number;
  };
}

export interface RealTransactionItem {
  id: string;
  formId: string;
  formTitle: string;
  receiptNumber: string;
  transactionId: string;
  paymentStatus: string;
  paymentAmount: number;
  formattedAmount: string;
  payerName: string;
  payerEmail: string;
  payerAvatar: string | null;
  branch: string | null;
  rollNumber: string | null;
  registration: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface RealFormTransactionsPayload {
  id: string;
  formId: string;
  title: string;
  paymentAmount: number;
  formattedAmount: string;
  stats: {
    totalTransactions: number;
    verifiedCount: number;
    pendingCount: number;
    rejectedCount: number;
    totalRevenue: number;
    formattedRevenue: string;
  };
  transactions: RealTransactionItem[];
}

export interface RealTransactionDetail {
  id: string;
  receiptNumber: string;
  transactionId: string;
  paymentStatus: string;
  paymentAmount: number;
  formattedAmount: string;
  createdAt: string;
  verifiedAt: string | null;
  form: {
    id: string;
    formId: string;
    title: string;
    definition?: RealFormDefinition;
  };
  payer: {
    id: string | null;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
    branch: string | null;
    rollNumber: string | null;
    registration: string | null;
    image: string | null;
  };
  answers: Record<string, unknown>;
  files: RealFormFile[];
}

export interface RealTransaction {
  id: string;
  title: string;
  payer: string;
  amount: string;
  status: string;
  date: string;
}

export interface RealEvent {
  id: string;
  eventNumber: number;
  title: string;
  description: string;
  points: number;
  date: string;
  attendeesCount: number;
  status: string;
}

export interface RealSystemSettings {
  settings: {
    id: string;
    key: string;
    value: string;
    description: string | null;
  }[];
  serverStatus: string;
  databaseEngine: string;
}

export interface RealMemberFullProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  aadhaarNumber: string | null;
  upiId: string | null;
  state: string | null;
  district: string | null;
  collegeName: string | null;
  collegeAddress: string | null;
  username: string | null;
  cbUserId: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
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
  hasLoggedIn: boolean;
  loginCount: number;
  lastLoginAt: string | null;
  githubUsername: string | null;
  batchId: string | null;
  batch: {
    id: string;
    name: string;
    code: string;
    admissionYear: string | null;
  } | null;
  specializedDomain: string | null;
  socialLinks: Record<string, string> | null;
  customLinks: { id: string; title: string; url: string }[] | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalPoints: number;
    attendanceCount: number;
    attendancePoints: number;
    taskSubmissionCount: number;
    taskPoints: number;
    quizAttemptCount: number;
    quizPoints: number;
    eventCount: number;
    eventPoints: number;
  };
}

import {
  saveCachedData,
  getCachedData,
  enqueuePendingMutation,
} from "./offline-manager";

export async function fetchAdminData<T>(
  type: string,
  params?: Record<string, string>,
  options?: { forceFresh?: boolean }
): Promise<T | null> {
  // 1. INSTANT LOCAL CACHE (sub-millisecond 0-1ms response)
  const cached = await getCachedData<T>(type, params);

  // Background network revalidation helper
  const revalidate = async (): Promise<T | null> => {
    try {
      let url = `${API_BASE_URL}/api/admin/mobile?type=${type}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        url += `&${searchParams.toString()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data !== undefined) {
          void saveCachedData<T>(type, params, json.data as T);
          return json.data as T;
        }
      }
    } catch {
      // offline / timeout, ignore
    }
    return null;
  };

  // If local cache exists and not forcing fresh, return INSTANTLY within 1ms!
  if (cached !== null && !options?.forceFresh) {
    // Revalidate in background without blocking UI
    void revalidate();
    return cached;
  }

  // Otherwise fetch from network or fallback to cache
  const fresh = await revalidate();
  if (fresh !== null) return fresh;

  return cached;
}

export async function mutateAdminData(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: unknown; error?: string; isOffline?: boolean; [key: string]: unknown }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/mobile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      return { success: true, ...json };
    }
    return { success: false, ...json, error: json.error || "Mutation failed" };
  } catch {
    clearTimeout(timeoutId);
    // Network offline / connection failed -> enqueue mutation for later sync
    if (action !== "sync-attendance") {
      await enqueuePendingMutation(action, payload);
      return {
        success: true,
        isOffline: true,
        message: "Action recorded offline. Will sync when online.",
      };
    }
    return { success: false, error: "Network error" };
  }
}

export interface AdminUserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  image?: string | null;
  profileImageKey?: string | null;
  username?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  mobileNumber?: string | null;
  whatsappNumber?: string | null;
  admissionYear?: string | null;
  registration?: string | null;
  rollNumber?: string | null;
  branch?: string | null;
  collegeName?: string | null;
  collegeAddress?: string | null;
  address?: string | null;
  postOffice?: string | null;
  policeStation?: string | null;
  block?: string | null;
  pinCode?: string | null;
  state?: string | null;
  district?: string | null;
  githubUsername?: string | null;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    portfolio?: string;
    leetcode?: string;
    codeforces?: string;
  } | null;
  customLinks?: Array<{ id: string; title: string; url: string }> | null;
  profileComplete?: boolean;
  createdAt: string;
}

export interface AdminSettingsData {
  user: AdminUserProfile | null;
  systemSettings: {
    registrationEnabled: boolean;
    externalQuizEnabled: boolean;
    githubOrgName: string;
  };
  sessions: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    expiresAt: string;
  }>;
  googleDrive: {
    isConnected: boolean;
    email?: string;
  };
}

export async function fetchAdminSettings(userId?: string): Promise<AdminSettingsData | null> {
  return await fetchAdminData<AdminSettingsData>(
    "admin-settings",
    userId ? { userId } : undefined
  );
}

export async function updateAdminProfileApi(payload: Partial<AdminUserProfile> & { userId?: string }) {
  return await mutateAdminData("update-admin-profile", payload as Record<string, unknown>);
}

export async function updateProfileImageApi(payload: { userId?: string; image?: string; profileImageKey?: string }) {
  return await mutateAdminData("update-profile-image", payload as Record<string, unknown>);
}

export async function removeProfileImageApi(userId?: string) {
  return await mutateAdminData("remove-profile-image", { userId });
}

export async function updateAdminSocialLinksApi(payload: {
  userId?: string;
  socialLinks?: Record<string, string>;
  customLinks?: Array<{ id: string; title: string; url: string }>;
}) {
  return await mutateAdminData("update-admin-social-links", payload as Record<string, unknown>);
}

export async function updateSystemSettingApi(key: string, value: string | boolean) {
  return await mutateAdminData("update-system-setting", { key, value });
}

export async function revokeAdminSessionApi(sessionId: string) {
  return await mutateAdminData("revoke-admin-session", { sessionId });
}

export interface RealLeaderboardStudent {
  rank: number;
  id: string;
  name: string;
  email: string;
  image?: string | null;
  profileImageKey?: string | null;
  branch: string;
  rollNumber: string | null;
  registration: string | null;
  batchId?: string | null;
  batchName: string;
  batchCode?: string | null;
  totalPoints: number;
  points: number;
  attendancePoints: number;
  taskPoints: number;
  eventPoints: number;
  quizPoints: number;
  sessionsAttended: number;
  tasksCompleted: number;
  eventsParticipated: number;
  quizzesTaken: number;
}

export interface RealLeaderboardUser extends RealLeaderboardStudent {}

export interface LeaderboardBatchItem {
  id: string;
  name: string;
  code: string;
}

export interface LeaderboardResponseData {
  leaderboard: RealLeaderboardStudent[];
  batches: LeaderboardBatchItem[];
  timeframe: "overall" | "monthly";
  year: number;
  month: number;
  batchId: string;
}

export async function fetchLeaderboard(options?: {
  timeframe?: "overall" | "monthly";
  batchId?: string;
  month?: number;
  year?: number;
  forceFresh?: boolean;
}): Promise<LeaderboardResponseData | null> {
  const params: Record<string, string> = {};
  if (options?.timeframe) params.timeframe = options.timeframe;
  if (options?.batchId && options.batchId !== "all") params.batchId = options.batchId;
  if (options?.month) params.month = options.month.toString();
  if (options?.year) params.year = options.year.toString();

  return await fetchAdminData<LeaderboardResponseData>("leaderboard", params, {
    forceFresh: options?.forceFresh,
  });
}

