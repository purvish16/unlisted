const API_BASE = '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  return data.data ?? data;
}

const get  = <T>(path: string)               => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const put  = <T>(path: string, body: unknown) => request<T>('PUT', path, body);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminCompany {
  id: string;
  name: string;
  sector: string | null;
  listingStatus: string;
  businessHealthScore: number | null;
  lastTradedPrice: number | null;
  totalShares: number;
  createdAt: string;
  members: Array<{ user: { mobile: string; fullName: string | null } }>;
}

export interface AdminUser {
  id: string;
  mobile: string;
  fullName: string | null;
  role: string;
  kycStatus: string;
  kycLevel: number;
  createdAt: string;
  wallet?: { availableBalance: number; totalInvested: number } | null;
}

export interface AdminTrade {
  id: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  platformFee: number;
  settlementStatus: string;
  tradedAt: string;
  company: { id: string; name: string };
  buyer: { mobile: string; fullName: string | null };
  seller: { mobile: string; fullName: string | null };
}

export interface PlatformMetrics {
  totalUsers: number;
  totalInvestors: number;
  totalCompanies: number;
  liveCompanies: number;
  totalTrades: number;
  totalTradeVolume: number;
  totalPlatformFees: number;
  totalWalletBalance: number;
  kycStats: { level0: number; level1: number; level2: number; level3: number };
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile: string) => post<{ message: string }>('/auth/send-otp', { mobile }),
  verifyOtp: (mobile: string, otp: string) =>
    post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; mobile: string; role: string };
    }>('/auth/verify-otp', { mobile, otp }),
  logout: (refreshToken: string) => post('/auth/logout', { refreshToken }),
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminApi = {
  // Metrics
  getMetrics: () => get<PlatformMetrics>('/admin/metrics'),

  // Companies
  getApplications: (status?: string) =>
    get<{ items: AdminCompany[]; total: number }>(
      `/admin/applications${status ? `?status=${status}` : ''}`,
    ),
  reviewApplication: (companyId: string, action: 'approve' | 'reject', notes?: string) =>
    post<{ message: string }>(`/admin/applications/${companyId}/review`, { action, notes }),
  goLive: (companyId: string) =>
    post<{ message: string }>(`/admin/companies/${companyId}/go-live`, {}),
  setHealthScore: (companyId: string, score: number) =>
    put<{ message: string }>(`/admin/companies/${companyId}/health-score`, { score }),
  getAllCompanies: (status?: string) =>
    get<{ items: AdminCompany[]; total: number }>(
      `/admin/companies${status ? `?status=${status}` : ''}`,
    ),

  // Users
  getUsers: (page = 1, search?: string) =>
    get<{ items: AdminUser[]; total: number; totalPages: number }>(
      `/admin/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),

  // Trades
  getAllTrades: (page = 1) =>
    get<{ items: AdminTrade[]; total: number; totalPages: number }>(
      `/admin/trades?page=${page}`,
    ),

  // Documents
  verifyDocument: (docId: string, status: 'approved' | 'rejected', notes?: string) =>
    put<{ message: string }>(`/admin/documents/${docId}/verify`, { status, notes }),
};
