-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'partial', 'complete');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'under_review', 'approved', 'live', 'suspended', 'delisted');

-- CreateEnum
CREATE TYPE "RaiseStatus" AS ENUM ('draft', 'active', 'funded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "OrderMode" AS ENUM ('market', 'limit');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('open', 'partially_filled', 'filled', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('pending', 'signed', 'settled', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal', 'investment', 'sale', 'dividend', 'fee', 'refund');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('pan', 'aadhaar', 'incorporation', 'financials', 'cap_table', 'pitch_deck', 'gst', 'bank_statement', 'mca_filings', 'shareholder_agreement');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected', 'action_required');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('company', 'investor');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('investor', 'company_admin', 'admin');

-- CreateEnum
CREATE TYPE "DividendStatus" AS ENUM ('declared', 'processing', 'paid', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT NOT NULL,
    "full_name" TEXT,
    "pan_number" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'investor',
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'pending',
    "kyc_level" INTEGER NOT NULL DEFAULT 0,
    "is_accredited_investor" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_number" TEXT,
    "bank_ifsc_code" TEXT,
    "bank_account_name" TEXT,
    "bank_verified_at" TIMESTAMP(3),
    "aadhaar_verified_at" TIMESTAMP(3),
    "pan_verified_at" TIMESTAMP(3),
    "date_of_birth" TIMESTAMP(3),
    "address" TEXT,
    "pincode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "otp_hash" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "available_balance" BIGINT NOT NULL DEFAULT 0,
    "escrow_balance" BIGINT NOT NULL DEFAULT 0,
    "total_invested" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cin" TEXT,
    "pan" TEXT,
    "gstin" TEXT,
    "sector" TEXT,
    "description" TEXT,
    "founded_year" INTEGER,
    "website" TEXT,
    "logo_url" TEXT,
    "total_shares" BIGINT NOT NULL DEFAULT 0,
    "face_value" BIGINT NOT NULL DEFAULT 1000,
    "listing_status" "ListingStatus" NOT NULL DEFAULT 'pending',
    "business_health_score" INTEGER,
    "go_live_at" TIMESTAMP(3),
    "suspended_at" TIMESTAMP(3),
    "suspension_reason" TEXT,
    "last_traded_price" BIGINT,
    "price_change_24h" BIGINT,
    "volume_24h" BIGINT,
    "high_24h" BIGINT,
    "low_24h" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_registry" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "shareholder_id" TEXT NOT NULL,
    "shares_held" BIGINT NOT NULL DEFAULT 0,
    "shares_locked" BIGINT NOT NULL DEFAULT 0,
    "average_cost_price" BIGINT NOT NULL DEFAULT 0,
    "first_acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_certificates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "shares_from" BIGINT NOT NULL,
    "shares_to" BIGINT NOT NULL,
    "number_of_shares" BIGINT NOT NULL,
    "issue_price" BIGINT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_raises" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "target_amount" BIGINT NOT NULL,
    "raised_amount" BIGINT NOT NULL DEFAULT 0,
    "price_per_share" BIGINT NOT NULL,
    "shares_offered" BIGINT NOT NULL,
    "shares_allocated" BIGINT NOT NULL DEFAULT 0,
    "min_investment" BIGINT NOT NULL,
    "max_investment" BIGINT NOT NULL,
    "raise_opens_at" TIMESTAMP(3) NOT NULL,
    "raise_closes_at" TIMESTAMP(3) NOT NULL,
    "status" "RaiseStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_raises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_allocations" (
    "id" TEXT NOT NULL,
    "raise_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "amount_paid" BIGINT NOT NULL,
    "shares_allocated" BIGINT NOT NULL,
    "price_per_share" BIGINT NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "is_refunded" BOOLEAN NOT NULL DEFAULT false,
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "primary_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_type" "OrderType" NOT NULL,
    "order_mode" "OrderMode" NOT NULL,
    "quantity" BIGINT NOT NULL DEFAULT 0,
    "filled_quantity" BIGINT NOT NULL DEFAULT 0,
    "remaining_quantity" BIGINT NOT NULL DEFAULT 0,
    "price_per_share" BIGINT,
    "status" "OrderStatus" NOT NULL DEFAULT 'open',
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "filled_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "buy_order_id" TEXT NOT NULL,
    "sell_order_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL DEFAULT 0,
    "price_per_share" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "platform_fee" BIGINT NOT NULL,
    "net_to_seller" BIGINT NOT NULL,
    "settlement_status" "SettlementStatus" NOT NULL DEFAULT 'pending',
    "buyer_signed_at" TIMESTAMP(3),
    "seller_signed_at" TIMESTAMP(3),
    "sh4_document_url" TEXT,
    "traded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL DEFAULT 0,
    "balance_before" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "admin_notes" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividends" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "amount_per_share" BIGINT NOT NULL,
    "total_payout" BIGINT NOT NULL DEFAULT 0,
    "record_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "status" "DividendStatus" NOT NULL DEFAULT 'declared',
    "declared_by" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "open_price" BIGINT NOT NULL,
    "close_price" BIGINT NOT NULL,
    "high_price" BIGINT NOT NULL,
    "low_price" BIGINT NOT NULL,
    "volume" BIGINT NOT NULL DEFAULT 0,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "interval" TEXT NOT NULL DEFAULT '1d',

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_updates" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "users_pan_number_key" ON "users"("pan_number");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "investor_wallets_user_id_key" ON "investor_wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cin_key" ON "companies"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "companies_pan_key" ON "companies"("pan");

-- CreateIndex
CREATE UNIQUE INDEX "companies_gstin_key" ON "companies"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_registry_company_id_shareholder_id_key" ON "share_registry"("company_id", "shareholder_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_certificates_certificate_number_key" ON "share_certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "price_history_company_id_recorded_at_interval_key" ON "price_history"("company_id", "recorded_at", "interval");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_wallets" ADD CONSTRAINT "investor_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_registry" ADD CONSTRAINT "share_registry_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_registry" ADD CONSTRAINT "share_registry_shareholder_id_fkey" FOREIGN KEY ("shareholder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_certificates" ADD CONSTRAINT "share_certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_certificates" ADD CONSTRAINT "share_certificates_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_raises" ADD CONSTRAINT "primary_raises_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_allocations" ADD CONSTRAINT "primary_allocations_raise_id_fkey" FOREIGN KEY ("raise_id") REFERENCES "primary_raises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_allocations" ADD CONSTRAINT "primary_allocations_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_allocations" ADD CONSTRAINT "primary_allocations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "document_company_fk" FOREIGN KEY ("entity_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "document_investor_fk" FOREIGN KEY ("entity_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_updates" ADD CONSTRAINT "company_updates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
