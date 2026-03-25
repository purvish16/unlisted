// ── API client for Company Portal ──────────────────────────────────────────────

const API_BASE = '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cp_access_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
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

const get  = <T>(path: string)              => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const put  = <T>(path: string, body: unknown) => request<T>('PUT', path, body);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile: string) => post<{ message: string }>('/auth/send-otp', { mobile }),
  verifyOtp: (mobile: string, otp: string) =>
    post<{
      accessToken: string;
      refreshToken: string;
      isNewUser: boolean;
      user: { id: string; mobile: string; kycStatus: string; kycLevel: number; role: string };
    }>('/auth/verify-otp', { mobile, otp }),
  logout: (refreshToken: string) => post('/auth/logout', { refreshToken }),
};

// ── Company ────────────────────────────────────────────────────────────────────
export interface CompanyProfile {
  id: string;
  name: string;
  cin: string | null;
  pan: string | null;
  gstin: string | null;
  description: string | null;
  sector: string | null;
  website: string | null;
  foundedYear: number | null;
  listingStatus: string;
  faceValue: number;
  totalShares: number;
  lastTradedPrice: number | null;
  priceChange24h: number | null;
  businessHealthScore: number | null;
  primaryRaises: Array<{
    id: string;
    status: string;
    pricePerShare: number;
    targetAmount: number;
    raisedAmount: number;
    minInvestment: number;
    maxInvestment: number;
    raiseOpensAt: string;
    raiseClosesAt: string;
  }>;
  updates: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    publishedAt: string | null;
  }>;
}

export interface ShareholderEntry {
  id: string;
  shareholderId: string;
  shareholderType: string;
  sharesHeld: number;
  sharesLocked: number;
  acquiredAt: string;
  shareholder: {
    id: string;
    mobile: string;
    fullName: string | null;
  };
}

export interface CompanyUpdate {
  id: string;
  title: string;
  content: string;
  type: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  userId: string;
  role: string;
  title: string | null;
  user: { id: string; mobile: string; fullName: string | null };
}

export const companyApi = {
  getMyCompany: () => get<CompanyProfile>('/company/my-company'),
  updateProfile: (data: Partial<CompanyProfile>) => put<CompanyProfile>('/company/my-company', data),

  // Cap table / share registry
  getShareRegistry: () => get<{ items: ShareholderEntry[]; total: number }>('/registry/company'),

  // Updates / announcements
  getUpdates: () => get<CompanyUpdate[]>('/company/updates'),
  createUpdate: (data: { title: string; content: string; type: string }) =>
    post<CompanyUpdate>('/company/updates', data),

  // Members
  getMembers: () => get<CompanyMember[]>('/company/members'),

  // Primary raise
  getRaise: () => get<CompanyProfile['primaryRaises'][0] | null>('/company/raise'),
  createRaise: (data: {
    pricePerShare: number;
    targetAmount: number;
    minInvestment: number;
    maxInvestment: number;
    raiseOpensAt: string;
    raiseClosesAt: string;
  }) => post('/company/raise', data),

  // Documents
  getDocuments: () => get<Array<{
    id: string;
    documentType: string;
    fileUrl: string;
    verificationStatus: string;
    createdAt: string;
  }>>('/company/documents'),
};

// ── Order Book (public) ────────────────────────────────────────────────────────
export const marketApi = {
  getOrderBook: (companyId: string) =>
    get<{
      bids: Array<{ price: number; quantity: number; orderCount: number }>;
      asks: Array<{ price: number; quantity: number; orderCount: number }>;
    }>(`/companies/${companyId}/orderbook`),
  getRecentTrades: (companyId: string) =>
    get<Array<{
      id: string;
      quantity: number;
      pricePerShare: number;
      totalAmount: number;
      tradedAt: string;
    }>>(`/companies/${companyId}/trades`),
  getPriceHistory: (companyId: string) =>
    get<Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>>(`/companies/${companyId}/price-history`),
};
