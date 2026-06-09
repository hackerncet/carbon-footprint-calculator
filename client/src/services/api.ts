import type {
  DashboardSummaryResponse,
  FootprintEntry,
  UserChallenge,
  UserAchievement,
  OffsetPurchase,
  User,
  UserGoal,
  CarbonCalculationResponse,
} from '@carbon/shared';

/** Default API base URL, configured via Vite env variable. */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Default fetch timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 10_000;

/** Minimal user shape needed for dev bypass headers. */
interface ApiUser {
  uid: string;
  email?: string;
}

/** Token provider function type. */
type GetIdToken = (forceRefresh?: boolean) => Promise<string | null>;

/**
 * Constructs authorization and dev-bypass headers for API requests.
 */
async function getHeaders(getIdToken: GetIdToken, user: ApiUser | null): Promise<Record<string, string>> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Developer bypass headers for mock authentication
  if (user?.uid) {
    headers['x-dev-user-id'] = user.uid;
    headers['x-dev-user-email'] = user.email || 'dev@example.com';
  }

  return headers;
}

/**
 * Generic authenticated fetch helper with timeout support.
 * Eliminates duplicated fetch + error-handling boilerplate.
 *
 * @param url - The full URL to fetch.
 * @param options - Standard fetch RequestInit options.
 * @param timeoutMs - Request timeout in milliseconds (default: 10s).
 * @returns Parsed JSON response of type T.
 * @throws {Error} If the response is not OK or the request times out.
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errBody: { error?: string } = await res.json();
        if (errBody?.error) errMsg = errBody.error;
      } catch {
        // Response body was not JSON — use status-based message
      }
      throw new Error(errMsg);
    }

    return await res.json() as T;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Fetches the aggregated dashboard summary for the authenticated user. */
export async function fetchDashboard(getIdToken: GetIdToken, user: ApiUser | null): Promise<DashboardSummaryResponse> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<DashboardSummaryResponse>(`${API_BASE}/user/dashboard`, { headers });
}

/** Fetches all footprint log entries for the authenticated user. */
export async function fetchFootprints(getIdToken: GetIdToken, user: ApiUser | null): Promise<FootprintEntry[]> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<FootprintEntry[]>(`${API_BASE}/footprint`, { headers });
}

/** Creates a new footprint log entry with carbon calculation. */
export async function createFootprint(
  getIdToken: GetIdToken,
  user: ApiUser | null,
  data: {
    entryDate: string;
    category: string;
    inputValue: number;
    inputUnit: string;
    subCategory: string;
    notes?: string;
  }
): Promise<{ message: string; entry: FootprintEntry; gamification: { streakUpdated: boolean; pointsAwarded: number; completedChallenges: string[] } }> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout(`${API_BASE}/footprint`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

/** Deletes a footprint log entry by ID. */
export async function deleteFootprint(getIdToken: GetIdToken, user: ApiUser | null, id: string): Promise<{ message: string }> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<{ message: string }>(`${API_BASE}/footprint/${id}`, {
    method: 'DELETE',
    headers,
  });
}

/** Fetches all eco-challenges for the authenticated user. */
export async function fetchChallenges(getIdToken: GetIdToken, user: ApiUser | null): Promise<UserChallenge[]> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<UserChallenge[]>(`${API_BASE}/user/challenges`, { headers });
}

/** Fetches all awarded achievements for the authenticated user. */
export async function fetchAchievements(getIdToken: GetIdToken, user: ApiUser | null): Promise<UserAchievement[]> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<UserAchievement[]>(`${API_BASE}/user/achievements`, { headers });
}

/** Purchases a carbon offset using ZeroGrid Points. */
export async function purchaseOffset(
  getIdToken: GetIdToken,
  user: ApiUser | null,
  data: { projectId: string; offsetAmountCo2eKg: number }
): Promise<{ message: string; purchase: OffsetPurchase; user: User; badgeAwarded: boolean }> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout(`${API_BASE}/offsets/purchase`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

/** Fetches the authenticated user's offset purchase history. */
export async function fetchOffsetsHistory(getIdToken: GetIdToken, user: ApiUser | null): Promise<OffsetPurchase[]> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<OffsetPurchase[]>(`${API_BASE}/offsets`, { headers });
}

/** Performs a carbon calculation preview (no authentication required). */
export async function calculatePreview(data: { category: string; subCategory: string; value: number }): Promise<CarbonCalculationResponse> {
  return fetchWithTimeout<CarbonCalculationResponse>(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Updates the authenticated user's profile. */
export async function updateProfile(
  getIdToken: GetIdToken,
  user: ApiUser | null,
  data: { displayName?: string | null; avatarUrl?: string | null }
): Promise<User> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout<User>(`${API_BASE}/user/profile`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
}

/** Creates or updates a monthly carbon reduction goal. */
export async function saveGoal(
  getIdToken: GetIdToken,
  user: ApiUser | null,
  data: { category: string; targetValue: number; targetMonth: string }
): Promise<{ message: string; goal: UserGoal }> {
  const headers = await getHeaders(getIdToken, user);
  return fetchWithTimeout(`${API_BASE}/user/goals`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}
