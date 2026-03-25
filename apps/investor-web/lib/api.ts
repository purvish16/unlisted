/**
 * Typed API client for the Unlisted backend.
 * All amounts returned from the API are in PAISE — use formatCurrency() to display.
 */

const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('unlisted_access_token')
    : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Token expired — clear storage
    if (res.status === 401) {
      localStorage.removeItem('unlisted_access_token');
      localStorage.removeItem('unlisted_refresh_token');
    }
    throw new ApiError(res.status, json.error ?? 'Request failed', json);
  }

  return json.data as T;
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile: string) => post<{ isNewUser: boolean }>('/auth/send-otp', { mobile }),
  verifyOtp: (mobile: string, otp: string) =>
    post<{
      accessToken: string;
      refreshToken: string;
      isNewUser: boolean;
      user: { id: string; mobile: string; kycStatus: string; kycLevel: number; role: string };
    }>('/auth/verify-otp', { mobile, otp }),
  refreshToken: (refreshToken: string) =>
    post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken: string) => post('/auth/logout', { refreshToken }),
};

// ── KYC ───────────────────────────────────────────────────────────────────────
export const kycApi = {
  getStatus: () =>
    get<{
      kycStatus: string;
      kycLevel: number;
      steps: { mobile: boolean; pan: boolean; bank: boolean; aadhaar: boolean };
    }>('/kyc/status'),
  verifyPan: (data: { panNumber: string; fullName: string; dateOfBirth: string }) =>
    post<{ verified: boolean; name: string }>('/kyc/verify-pan', data),
  verifyBank: (data: { accountNumber: string; ifscCode: string; accountHolderName: string }) =>
    post<{ verified: boolean }>('/kyc/verify-bank', data),
  initiateAadhaar: () => post<{ requestId: string; redirectUrl: string }>('/kyc/initiate-aadhaar'),
  completeAadhaar: (requestId: string) =>
    post<{ verified: boolean }>('/kyc/complete-aadhaar', { requestId }),
};

// ── Investor ──────────────────────────────────────────────────────────────────
export const investorApi = {
  getProfile: () => get<{
    id: string; email: string | null; mobile: string; fullName: string | null;
    panNumber: string | null; dateOfBirth: string | null;
    bankAccountNumber: string | null; ifscCode: string | null;
    kycStatus: string; kycLevel: number;
    isAccreditedInvestor: boolean; createdAt: string;
  }>('/investor/profile'),
  updateProfile: (data: { email?: string; city?: string; state?: string }) =>
    put('/investor/profile', data),
  getPortfolio: () => get<{
    totalValue: number; totalInvested: number; totalReturns: number;
    totalReturnsPct: number;
    holdings: Array<{
      companyId: string; companyName: string; companySector: string | null;
      sharesHeld: number; sharesLocked: number; averageCostPrice: number;
      currentMarketPrice: number; investedValue: number; currentValue: number;
      pnl: number; pnlPct: number;
    }>;
  }>('/investor/portfolio'),
};

// ── Wallet ─────────────────────────────────────────────────────────────────────
export const walletApi = {
  getBalance: () =>
    get<{ availableBalance: number; escrowBalance: number; totalInvested: number; currency: string }>(
      '/wallet/balance',
    ),
  getTransactions: (page = 1, limit = 20) =>
    get<{
      items: Array<{
        id: string; transactionType: string; amount: number;
        balanceBefore: number; balanceAfter: number;
        description: string | null; status: string; createdAt: string;
      }>;
      total: number; page: number; totalPages: number;
    }>(`/wallet/transactions?page=${page}&limit=${limit}`),
  initiateAddFunds: (amountRupees: number, paymentMethod = 'upi') =>
    post<{ orderId: string; amountPaise: number; keyId: string; devNote?: string }>(
      '/wallet/add-funds/initiate', { amountRupees, paymentMethod },
    ),
  verifyAddFunds: (orderId: string, amountPaise: number) =>
    post<{ availableBalance: number; message: string }>(
      '/wallet/add-funds/verify', { orderId, amountPaise },
    ),
  initiateWithdraw: (amountRupees: number) =>
    post<{ withdrawalId: string; amountPaise: number }>(
      '/wallet/withdraw/initiate', { amountRupees },
    ),
  verifyWithdraw: (withdrawalId: string, amountPaise: number) =>
    post<{ availableBalance: number; message: string }>(
      '/wallet/withdraw/verify', { withdrawalId, amountPaise },
    ),
};

// ── Companies ──────────────────────────────────────────────────────────────────
export const companiesApi = {
  list: (params?: {
    search?: string; sector?: string; page?: number; limit?: number;
    sortBy?: string; sortDir?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.sector) q.set('sector', params.sector);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortDir) q.set('sortDir', params.sortDir);
    return get<{
      items: CompanyListItem[];
      total: number; page: number; totalPages: number;
    }>(`/companies?${q.toString()}`);
  },
  getById: (id: string) => get<CompanyDetail>(`/companies/${id}`),
  getTrending: () => get<CompanyListItem[]>('/companies/trending'),
  getSectors: () => get<string[]>('/companies/sectors'),
  getOrderBook: (id: string) =>
    get<{
      bids: Array<{ price: number; quantity: number; orderCount: number }>;
      asks: Array<{ price: number; quantity: number; orderCount: number }>;
    }>(`/companies/${id}/orderbook`),
  getTrades: (id: string) =>
    get<Array<{
      id: string; quantity: number; pricePerShare: number;
      totalAmount: number; tradedAt: string;
    }>>(`/companies/${id}/trades`),
};

// ── Raises ─────────────────────────────────────────────────────────────────────
export const raisesApi = {
  getRaise: (companyId: string) =>
    get<{
      id: string; companyId: string; targetAmount: number; raisedAmount: number;
      pricePerShare: number; sharesOffered: number; sharesAllocated: number;
      minInvestment: number; maxInvestment: number;
      raiseOpensAt: string; raiseClosesAt: string; status: string;
    }>(`/raises/${companyId}`),
  invest: (companyId: string, amountRupees: number) =>
    post<{ sharesAllocated: number; pricePerShare: number }>(
      `/raises/${companyId}/invest`, { amountRupees },
    ),
  getMyAllocation: (companyId: string) =>
    get<Array<{
      id: string; amountPaid: number; sharesAllocated: number; pricePerShare: number;
      isPaid: boolean; paidAt: string | null; createdAt: string;
    }>>(`/raises/${companyId}/my-allocation`),
};

// ── Orders ─────────────────────────────────────────────────────────────────────
export const ordersApi = {
  place: (data: {
    companyId: string; orderType: 'buy' | 'sell';
    orderMode: 'market' | 'limit'; quantity: number; pricePerShare?: number;
  }) => post<OrderData>('/orders/place', data),
  cancel: (id: string) => put<null>(`/orders/${id}/cancel`),
  getMyOrders: (page = 1) =>
    get<{
      items: OrderData[];
      total: number; page: number; totalPages: number;
    }>(`/orders/my-orders?page=${page}`),
};

// ── Trades ─────────────────────────────────────────────────────────────────────
export const tradesApi = {
  getMyTrades: (page = 1) =>
    get<{
      items: Array<{
        id: string; companyId: string; quantity: number; pricePerShare: number;
        totalAmount: number; platformFee: number; netToSeller: number;
        settlementStatus: string; tradedAt: string;
        company: { id: string; name: string; sector: string | null };
      }>;
      total: number; page: number; totalPages: number;
    }>(`/trades/my-trades?page=${page}`),
};

// ── Shared Types ───────────────────────────────────────────────────────────────
export interface CompanyListItem {
  id: string; name: string; sector: string | null; logoUrl: string | null;
  listingStatus: string; businessHealthScore: number | null;
  lastTradedPrice: number | null; priceChange24h: number | null;
  totalShares: number; faceValue: number;
}

export interface CompanyDetail extends CompanyListItem {
  cin: string | null; pan: string | null; gstin: string | null;
  description: string | null; foundedYear: number | null; website: string | null;
  primaryRaises: Array<{
    id: string; status: string; pricePerShare: number;
    targetAmount: number; raisedAmount: number; minInvestment: number; maxInvestment: number;
    raiseOpensAt: string; raiseClosesAt: string;
  }>;
  updates: Array<{
    id: string; title: string; content: string; type: string; publishedAt: string | null;
  }>;
}

export interface OrderData {
  id: string; companyId: string; orderType: string; orderMode: string;
  quantity: number; filledQuantity: number; remainingQuantity: number;
  pricePerShare: number | null; status: string; placedAt: string;
  company?: { name: string; sector: string | null };
}
