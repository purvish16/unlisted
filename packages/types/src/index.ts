// ─── Enums ────────────────────────────────────────────────────────────────────

export enum KycStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
}

export enum KycLevel {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
}

export enum ListingStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  LIVE = 'live',
  SUSPENDED = 'suspended',
  DELISTED = 'delisted',
}

export enum RaiseStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  FUNDED = 'funded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderMode {
  MARKET = 'market',
  LIMIT = 'limit',
}

export enum OrderStatus {
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SettlementStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  SETTLED = 'settled',
  FAILED = 'failed',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  INVESTMENT = 'investment',
  SALE = 'sale',
  DIVIDEND = 'dividend',
  FEE = 'fee',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DocumentType {
  PAN = 'pan',
  AADHAAR = 'aadhaar',
  INCORPORATION = 'incorporation',
  FINANCIALS = 'financials',
  CAP_TABLE = 'cap_table',
  PITCH_DECK = 'pitch_deck',
  GST = 'gst',
  BANK_STATEMENT = 'bank_statement',
  MCA_FILINGS = 'mca_filings',
  SHAREHOLDER_AGREEMENT = 'shareholder_agreement',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  ACTION_REQUIRED = 'action_required',
}

export enum EntityType {
  COMPANY = 'company',
  INVESTOR = 'investor',
}

export enum MarketType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface OtpRequest {
  mobile: string;
}

export interface OtpVerifyRequest {
  mobile: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  role: 'investor' | 'company' | 'admin';
  iat: number;
  exp: number;
}

// ─── User / Investor Types ─────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string | null;
  mobile: string;
  fullName: string | null;
  panNumber: string | null;
  kycStatus: KycStatus;
  kycLevel: KycLevel;
  isAccreditedInvestor: boolean;
  createdAt: string;
}

// ─── Wallet Types ──────────────────────────────────────────────────────────────

export interface WalletBalance {
  availableBalance: number; // stored in paise, display as rupees
  escrowBalance: number;
  totalInvested: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  transactionType: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  status: TransactionStatus;
  createdAt: string;
}

// ─── Company Types ─────────────────────────────────────────────────────────────

export interface CompanyListItem {
  id: string;
  name: string;
  sector: string;
  logoUrl: string | null;
  listingStatus: ListingStatus;
  businessHealthScore: number | null;
  lastTradedPrice: number | null;
  priceChange24h: number | null;
  priceChangePct24h: number | null;
  totalShares: number;
  faceValue: number;
}

export interface CompanyDetail extends CompanyListItem {
  cin: string | null;
  pan: string | null;
  gstin: string | null;
  description: string | null;
  foundedYear: number | null;
  website: string | null;
  primaryRaise: PrimaryRaise | null;
}

// ─── Primary Raise Types ───────────────────────────────────────────────────────

export interface PrimaryRaise {
  id: string;
  companyId: string;
  targetAmount: number;
  raisedAmount: number;
  pricePerShare: number;
  sharesOffered: number;
  minInvestment: number;
  maxInvestment: number;
  raiseOpensAt: string;
  raiseClosesAt: string;
  status: RaiseStatus;
}

// ─── Order Book Types ──────────────────────────────────────────────────────────

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  companyId: string;
  bids: OrderBookEntry[]; // buy orders, highest first
  asks: OrderBookEntry[]; // sell orders, lowest first
  lastTradedPrice: number | null;
  volume24h: number;
  high24h: number | null;
  low24h: number | null;
}

export interface Order {
  id: string;
  investorId: string;
  companyId: string;
  orderType: OrderType;
  orderMode: OrderMode;
  quantity: number;
  pricePerShare: number;
  filledQuantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  placedAt: string;
  expiresAt: string | null;
  filledAt: string | null;
}

// ─── Trade Types ───────────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  companyId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  platformFee: number;
  netToSeller: number;
  settlementStatus: SettlementStatus;
  tradedAt: string;
  settledAt: string | null;
}

// ─── Portfolio / Holdings Types ────────────────────────────────────────────────

export interface Holding {
  companyId: string;
  companyName: string;
  companySector: string;
  sharesHeld: number;
  sharesLocked: number;
  averageCostPrice: number;
  currentMarketPrice: number | null;
  currentValue: number | null;
  investedValue: number;
  pnl: number | null;
  pnlPct: number | null;
}

export interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  totalReturnsPct: number;
  holdings: Holding[];
}

// ─── KYC Types ─────────────────────────────────────────────────────────────────

export interface PanVerifyRequest {
  panNumber: string;
  fullName: string;
  dateOfBirth: string;
}

export interface BankVerifyRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface KycStatusResponse {
  kycStatus: KycStatus;
  kycLevel: KycLevel;
  steps: {
    mobile: boolean;
    pan: boolean;
    bank: boolean;
    aadhaar: boolean;
  };
}

// ─── Document Types ────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  entityId: string;
  entityType: EntityType;
  documentType: DocumentType;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
}

// ─── Share Certificate Types ───────────────────────────────────────────────────

export interface ShareCertificate {
  id: string;
  companyId: string;
  holderId: string;
  certificateNumber: string;
  sharesFrom: number;
  sharesTo: number;
  numberOfShares: number;
  issuePrice: number;
  issueDate: string;
  isCancelled: boolean;
}

// ─── WebSocket Event Types ─────────────────────────────────────────────────────

export interface OrderBookUpdateEvent {
  companyId: string;
  orderBook: OrderBook;
}

export interface TradeMatchedEvent {
  trade: Trade;
  buyerId: string;
  sellerId: string;
}

export interface PriceUpdateEvent {
  companyId: string;
  lastTradedPrice: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface WalletCreditedEvent {
  userId: string;
  amount: number;
  newBalance: number;
  transactionType: TransactionType;
}

// ─── Utility Types ─────────────────────────────────────────────────────────────

/** Convert paise (integer) to rupees (float) for display */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Convert rupees to paise (integer) for storage */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Format number in Indian system: ₹1,00,000 */
export function formatIndianCurrency(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
