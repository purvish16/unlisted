/**
 * Unlisted Platform — Database Seed
 * Seeds realistic test data:
 *   - 2 admin users
 *   - 5 companies (3 live, 1 approved, 1 under_review)
 *   - 10 investors (with wallets, varying KYC levels)
 *   - Primary raises for 2 companies
 *   - Share registry entries
 *   - Sample orders (open buy/sell orders)
 *   - Sample trades
 *   - Wallet transactions
 *   - Price history
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// All monetary values in PAISE (multiply rupees × 100)
const INR = (rupees: number) => BigInt(Math.round(rupees * 100));
const SHARES = (n: number) => BigInt(n);

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Admin Users ──────────────────────────────────────────────────────────
  console.log('Creating admin users...');
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);

  const admin1 = await prisma.user.upsert({
    where: { mobile: '9000000001' },
    update: {},
    create: {
      mobile: '9000000001',
      email: 'admin@unlisted.in',
      fullName: 'Unlisted Admin',
      role: 'admin',
      kycStatus: 'complete',
      kycLevel: 3,
    },
  });

  // ── 2. Investor Users ───────────────────────────────────────────────────────
  console.log('Creating investor users...');

  const investors = await Promise.all([
    prisma.user.upsert({
      where: { mobile: '9876543210' },
      update: {},
      create: {
        mobile: '9876543210',
        email: 'ravi.kumar@example.com',
        fullName: 'Ravi Kumar',
        panNumber: 'ABCPK1234D',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        bankAccountNumber: '001234567890',
        bankIfscCode: 'HDFC0001234',
        bankAccountName: 'Ravi Kumar',
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543211' },
      update: {},
      create: {
        mobile: '9876543211',
        email: 'priya.sharma@example.com',
        fullName: 'Priya Sharma',
        panNumber: 'BCQPS5678E',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        isAccreditedInvestor: true,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543212' },
      update: {},
      create: {
        mobile: '9876543212',
        email: 'amit.patel@example.com',
        fullName: 'Amit Patel',
        panNumber: 'CDRAT9012F',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 2,
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543213' },
      update: {},
      create: {
        mobile: '9876543213',
        email: 'sneha.iyer@example.com',
        fullName: 'Sneha Iyer',
        panNumber: 'DESI1234G',
        role: 'investor',
        kycStatus: 'partial',
        kycLevel: 1,
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543214' },
      update: {},
      create: {
        mobile: '9876543214',
        email: 'vikram.nair@example.com',
        fullName: 'Vikram Nair',
        panNumber: 'EFNV5678H',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        isAccreditedInvestor: true,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543215' },
      update: {},
      create: {
        mobile: '9876543215',
        email: 'deepa.menon@example.com',
        fullName: 'Deepa Menon',
        role: 'investor',
        kycStatus: 'pending',
        kycLevel: 0,
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543216' },
      update: {},
      create: {
        mobile: '9876543216',
        email: 'rohit.gupta@example.com',
        fullName: 'Rohit Gupta',
        panNumber: 'FGRG1234I',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543217' },
      update: {},
      create: {
        mobile: '9876543217',
        email: 'kavya.reddy@example.com',
        fullName: 'Kavya Reddy',
        panNumber: 'GHRK5678J',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 2,
        isAccreditedInvestor: false,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543218' },
      update: {},
      create: {
        mobile: '9876543218',
        email: 'arjun.singh@example.com',
        fullName: 'Arjun Singh',
        panNumber: 'HIAS9012K',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        isAccreditedInvestor: true,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '9876543219' },
      update: {},
      create: {
        mobile: '9876543219',
        email: 'meera.joshi@example.com',
        fullName: 'Meera Joshi',
        panNumber: 'IJMJ1234L',
        role: 'investor',
        kycStatus: 'complete',
        kycLevel: 3,
        isAccreditedInvestor: false,
      },
    }),
  ]);

  // ── 3. Investor Wallets ─────────────────────────────────────────────────────
  console.log('Creating investor wallets...');

  const walletData = [
    { availableBalance: INR(30000), totalInvested: INR(145000) },  // Ravi
    { availableBalance: INR(75000), totalInvested: INR(320000) },  // Priya
    { availableBalance: INR(15000), totalInvested: INR(50000) },   // Amit
    { availableBalance: INR(5000),  totalInvested: INR(0) },       // Sneha
    { availableBalance: INR(200000), totalInvested: INR(500000) }, // Vikram
    { availableBalance: INR(1000),  totalInvested: INR(0) },       // Deepa
    { availableBalance: INR(45000), totalInvested: INR(120000) },  // Rohit
    { availableBalance: INR(22000), totalInvested: INR(80000) },   // Kavya
    { availableBalance: INR(150000), totalInvested: INR(800000) }, // Arjun
    { availableBalance: INR(60000), totalInvested: INR(200000) },  // Meera
  ];

  for (let i = 0; i < investors.length; i++) {
    const investor = investors[i];
    const data = walletData[i];
    if (!investor || !data) continue;
    await prisma.investorWallet.upsert({
      where: { userId: investor.id },
      update: {},
      create: {
        userId: investor.id,
        availableBalance: data.availableBalance,
        escrowBalance: BigInt(0),
        totalInvested: data.totalInvested,
        currency: 'INR',
      },
    });
  }

  // ── 4. Company Admin Users ──────────────────────────────────────────────────
  console.log('Creating company admin users...');

  const companyAdmins = await Promise.all([
    prisma.user.upsert({
      where: { mobile: '8000000001' },
      update: {},
      create: {
        mobile: '8000000001',
        email: 'founders@techcosolutions.in',
        fullName: 'Rahul Mehta',
        role: 'company_admin',
        kycStatus: 'complete',
        kycLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '8000000002' },
      update: {},
      create: {
        mobile: '8000000002',
        email: 'ceo@healthcodiagnostics.in',
        fullName: 'Dr. Ananya Singh',
        role: 'company_admin',
        kycStatus: 'complete',
        kycLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '8000000003' },
      update: {},
      create: {
        mobile: '8000000003',
        email: 'founder@foodcoorganics.in',
        fullName: 'Suresh Pillai',
        role: 'company_admin',
        kycStatus: 'complete',
        kycLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '8000000004' },
      update: {},
      create: {
        mobile: '8000000004',
        email: 'ceo@educolearning.in',
        fullName: 'Pooja Agarwal',
        role: 'company_admin',
        kycStatus: 'complete',
        kycLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { mobile: '8000000005' },
      update: {},
      create: {
        mobile: '8000000005',
        email: 'cfo@retailcoventures.in',
        fullName: 'Karan Malhotra',
        role: 'company_admin',
        kycStatus: 'partial',
        kycLevel: 1,
      },
    }),
  ]);

  // ── 5. Companies ────────────────────────────────────────────────────────────
  console.log('Creating companies...');

  const companies = await Promise.all([
    // Company 1 — TechCo Solutions (LIVE, high demand)
    prisma.company.upsert({
      where: { cin: 'U72900MH2019PTC000001' },
      update: {},
      create: {
        name: 'TechCo Solutions Pvt Ltd',
        cin: 'U72900MH2019PTC000001',
        pan: 'AABCT1234A',
        gstin: '27AABCT1234A1ZQ',
        sector: 'SaaS',
        description:
          'Enterprise AI & Cloud infrastructure for Asian markets. TechCo builds next-gen SaaS tools for Fortune 500 companies across India, SEA, and ANZ. Revenue growing 3x YoY with 94% gross margins.',
        foundedYear: 2019,
        website: 'https://techcosolutions.in',
        totalShares: SHARES(10_000_000),
        faceValue: INR(10), // ₹10 face value = 1000 paise
        listingStatus: 'live',
        businessHealthScore: 87,
        lastTradedPrice: INR(152), // ₹152 per share
        priceChange24h: INR(4),
        volume24h: SHARES(12450),
        high24h: INR(154),
        low24h: INR(148),
        goLiveAt: new Date('2026-01-15'),
      },
    }),
    // Company 2 — HealthCo Diagnostics (LIVE, new launch)
    prisma.company.upsert({
      where: { cin: 'U85110KA2021PTC000002' },
      update: {},
      create: {
        name: 'HealthCo Diagnostics Pvt Ltd',
        cin: 'U85110KA2021PTC000002',
        pan: 'AABCH5678B',
        gstin: '29AABCH5678B1ZX',
        sector: 'HealthTech',
        description:
          'Rapid genetic testing kits for household diagnostics. HealthCo has developed a breakthrough portable DNA sequencer retailing at ₹3,499. Already in 500+ pharmacies across 12 cities.',
        foundedYear: 2021,
        website: 'https://healthcodiagnostics.in',
        totalShares: SHARES(5_000_000),
        faceValue: INR(10),
        listingStatus: 'live',
        businessHealthScore: 72,
        lastTradedPrice: INR(850),
        priceChange24h: BigInt(0),
        volume24h: SHARES(3200),
        high24h: INR(856),
        low24h: INR(844),
        goLiveAt: new Date('2026-02-01'),
      },
    }),
    // Company 3 — FoodCo Organics (LIVE, limited supply)
    prisma.company.upsert({
      where: { cin: 'U15400TN2020PTC000003' },
      update: {},
      create: {
        name: 'FoodCo Organics Pvt Ltd',
        cin: 'U15400TN2020PTC000003',
        pan: 'AABCF9012C',
        gstin: '33AABCF9012C1ZV',
        sector: 'D2C',
        description:
          'Direct-to-consumer organic snacks and daily essentials. FoodCo is India\'s fastest-growing organic D2C brand with ₹85 Cr ARR, distributed across 22 states and 4 quick-commerce platforms.',
        foundedYear: 2020,
        website: 'https://foodcoorganics.in',
        totalShares: SHARES(3_000_000),
        faceValue: INR(10),
        listingStatus: 'live',
        businessHealthScore: 68,
        lastTradedPrice: INR(480),
        priceChange24h: INR(-8),
        volume24h: SHARES(1850),
        high24h: INR(492),
        low24h: INR(476),
        goLiveAt: new Date('2026-01-20'),
      },
    }),
    // Company 4 — EduCo Learning (APPROVED, not yet live)
    prisma.company.upsert({
      where: { cin: 'U80900DL2022PTC000004' },
      update: {},
      create: {
        name: 'EduCo Learning Technologies Pvt Ltd',
        cin: 'U80900DL2022PTC000004',
        pan: 'AABCE1234D',
        gstin: '07AABCE1234D1ZT',
        sector: 'EdTech',
        description:
          'AR-powered learning modules for K-12 engineering prep. EduCo\'s immersive curriculum is adopted in 800+ schools across India, partnered with 6 state education boards.',
        foundedYear: 2022,
        website: 'https://educolearning.in',
        totalShares: SHARES(8_000_000),
        faceValue: INR(10),
        listingStatus: 'approved',
        businessHealthScore: 79,
      },
    }),
    // Company 5 — RetailCo Ventures (UNDER_REVIEW)
    prisma.company.upsert({
      where: { cin: 'U52100MH2023PTC000005' },
      update: {},
      create: {
        name: 'RetailCo Ventures Pvt Ltd',
        cin: 'U52100MH2023PTC000005',
        pan: 'AABCR5678E',
        sector: 'Retail',
        description:
          'Omnichannel retail technology enabling kiranas to compete with modern trade. 14,000 kirana stores on platform across 8 cities.',
        foundedYear: 2023,
        totalShares: SHARES(2_000_000),
        faceValue: INR(10),
        listingStatus: 'under_review',
        businessHealthScore: 55,
      },
    }),
  ]);

  // ── 6. Company Members ──────────────────────────────────────────────────────
  console.log('Linking company admins...');
  for (let i = 0; i < Math.min(companies.length, companyAdmins.length); i++) {
    const company = companies[i];
    const admin = companyAdmins[i];
    if (!company || !admin) continue;
    await prisma.companyMember.upsert({
      where: { companyId_userId: { companyId: company.id, userId: admin.id } },
      update: {},
      create: { companyId: company.id, userId: admin.id, role: 'admin' },
    });
  }

  // ── 7. Share Registry — Seed Holdings ──────────────────────────────────────
  console.log('Creating share registry entries...');

  const [techco, healthco, foodco] = companies as [
    (typeof companies)[0],
    (typeof companies)[1],
    (typeof companies)[2],
  ];
  const [ravi, priya, amit, , vikram, , rohit, kavya, arjun, meera] = investors;

  // TechCo holdings
  const techcoHoldings = [
    { investor: ravi,  shares: 1000, avgPrice: 100 },
    { investor: priya, shares: 5000, avgPrice: 110 },
    { investor: vikram,shares: 10000,avgPrice: 90 },
    { investor: rohit, shares: 2000, avgPrice: 120 },
    { investor: arjun, shares: 8000, avgPrice: 85 },
  ];

  for (const h of techcoHoldings) {
    if (!h.investor) continue;
    await prisma.shareRegistry.upsert({
      where: { companyId_shareholderId: { companyId: techco.id, shareholderId: h.investor.id } },
      update: {},
      create: {
        companyId: techco.id,
        shareholderId: h.investor.id,
        sharesHeld: SHARES(h.shares),
        sharesLocked: BigInt(0),
        averageCostPrice: INR(h.avgPrice),
      },
    });
  }

  // HealthCo holdings
  const healthcoHoldings = [
    { investor: priya, shares: 200, avgPrice: 800 },
    { investor: arjun, shares: 500, avgPrice: 750 },
    { investor: meera, shares: 300, avgPrice: 820 },
  ];

  for (const h of healthcoHoldings) {
    if (!h.investor) continue;
    await prisma.shareRegistry.upsert({
      where: { companyId_shareholderId: { companyId: healthco.id, shareholderId: h.investor.id } },
      update: {},
      create: {
        companyId: healthco.id,
        shareholderId: h.investor.id,
        sharesHeld: SHARES(h.shares),
        sharesLocked: BigInt(0),
        averageCostPrice: INR(h.avgPrice),
      },
    });
  }

  // FoodCo holdings
  const foodcoHoldings = [
    { investor: ravi,  shares: 500, avgPrice: 500 },
    { investor: kavya, shares: 1000, avgPrice: 470 },
    { investor: amit,  shares: 300, avgPrice: 510 },
  ];

  for (const h of foodcoHoldings) {
    if (!h.investor) continue;
    await prisma.shareRegistry.upsert({
      where: { companyId_shareholderId: { companyId: foodco.id, shareholderId: h.investor.id } },
      update: {},
      create: {
        companyId: foodco.id,
        shareholderId: h.investor.id,
        sharesHeld: SHARES(h.shares),
        sharesLocked: BigInt(0),
        averageCostPrice: INR(h.avgPrice),
      },
    });
  }

  // ── 8. Primary Raises ───────────────────────────────────────────────────────
  console.log('Creating primary raises...');

  await prisma.primaryRaise.upsert({
    where: { id: 'raise-techco-series-a' },
    update: {},
    create: {
      id: 'raise-techco-series-a',
      companyId: techco.id,
      targetAmount: INR(5_00_00_000), // ₹5 Cr
      raisedAmount: INR(3_20_00_000), // ₹3.2 Cr raised
      pricePerShare: INR(150),
      sharesOffered: SHARES(3_33_333),
      sharesAllocated: SHARES(2_13_333),
      minInvestment: INR(15_000),
      maxInvestment: INR(5_00_000),
      raiseOpensAt: new Date('2026-01-15'),
      raiseClosesAt: new Date('2026-04-15'),
      status: 'active',
    },
  });

  await prisma.primaryRaise.upsert({
    where: { id: 'raise-healthco-seed' },
    update: {},
    create: {
      id: 'raise-healthco-seed',
      companyId: healthco.id,
      targetAmount: INR(2_00_00_000), // ₹2 Cr
      raisedAmount: INR(2_00_00_000), // Fully funded
      pricePerShare: INR(800),
      sharesOffered: SHARES(25_000),
      sharesAllocated: SHARES(25_000),
      minInvestment: INR(80_000),
      maxInvestment: INR(10_00_000),
      raiseOpensAt: new Date('2026-01-01'),
      raiseClosesAt: new Date('2026-02-28'),
      status: 'funded',
    },
  });

  // ── 9. Open Orders (Order Book) ─────────────────────────────────────────────
  console.log('Creating open orders...');

  if (ravi && priya && vikram && arjun && meera && rohit) {
    // TechCo buy orders
    await prisma.order.createMany({
      skipDuplicates: true,
      data: [
        {
          investorId: ravi.id,
          companyId: techco.id,
          orderType: 'buy',
          orderMode: 'limit',
          quantity: SHARES(500),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(500),
          pricePerShare: INR(150),
          status: 'open',
          placedAt: new Date('2026-03-24T09:15:00Z'),
        },
        {
          investorId: priya.id,
          companyId: techco.id,
          orderType: 'buy',
          orderMode: 'limit',
          quantity: SHARES(1000),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(1000),
          pricePerShare: INR(148),
          status: 'open',
          placedAt: new Date('2026-03-24T09:30:00Z'),
        },
        {
          investorId: meera.id,
          companyId: techco.id,
          orderType: 'buy',
          orderMode: 'limit',
          quantity: SHARES(200),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(200),
          pricePerShare: INR(145),
          status: 'open',
          placedAt: new Date('2026-03-24T10:00:00Z'),
        },
      ],
    });

    // TechCo sell orders
    await prisma.order.createMany({
      skipDuplicates: true,
      data: [
        {
          investorId: vikram.id,
          companyId: techco.id,
          orderType: 'sell',
          orderMode: 'limit',
          quantity: SHARES(2000),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(2000),
          pricePerShare: INR(155),
          status: 'open',
          placedAt: new Date('2026-03-24T08:00:00Z'),
        },
        {
          investorId: arjun.id,
          companyId: techco.id,
          orderType: 'sell',
          orderMode: 'limit',
          quantity: SHARES(500),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(500),
          pricePerShare: INR(158),
          status: 'open',
          placedAt: new Date('2026-03-24T08:45:00Z'),
        },
        {
          investorId: rohit.id,
          companyId: techco.id,
          orderType: 'sell',
          orderMode: 'limit',
          quantity: SHARES(300),
          filledQuantity: BigInt(0),
          remainingQuantity: SHARES(300),
          pricePerShare: INR(160),
          status: 'open',
          placedAt: new Date('2026-03-24T11:00:00Z'),
        },
      ],
    });
  }

  // ── 10. Price History ────────────────────────────────────────────────────────
  console.log('Creating price history...');

  const techcoPriceHistory = [
    { date: '2026-03-17', open: 135, high: 138, low: 133, close: 136, vol: 8200 },
    { date: '2026-03-18', open: 136, high: 142, low: 135, close: 140, vol: 11000 },
    { date: '2026-03-19', open: 140, high: 145, low: 139, close: 143, vol: 9800 },
    { date: '2026-03-20', open: 143, high: 148, low: 141, close: 146, vol: 14200 },
    { date: '2026-03-21', open: 146, high: 150, low: 144, close: 149, vol: 13500 },
    { date: '2026-03-22', open: 149, high: 153, low: 147, close: 148, vol: 10100 },
    { date: '2026-03-23', open: 148, high: 155, low: 147, close: 152, vol: 12450 },
  ];

  for (const p of techcoPriceHistory) {
    await prisma.priceHistory.upsert({
      where: { companyId_recordedAt_interval: { companyId: techco.id, recordedAt: new Date(p.date), interval: '1d' } },
      update: {},
      create: {
        companyId: techco.id,
        openPrice: INR(p.open),
        highPrice: INR(p.high),
        lowPrice: INR(p.low),
        closePrice: INR(p.close),
        volume: SHARES(p.vol),
        recordedAt: new Date(p.date),
        interval: '1d',
      },
    });
  }

  // ── 11. Sample Wallet Transactions ──────────────────────────────────────────
  console.log('Creating wallet transactions...');

  if (ravi) {
    await prisma.transaction.createMany({
      skipDuplicates: false,
      data: [
        {
          userId: ravi.id,
          transactionType: 'deposit',
          amount: INR(50000),
          balanceBefore: INR(0),
          balanceAfter: INR(50000),
          referenceType: 'deposit',
          status: 'completed',
          description: 'UPI deposit via Razorpay',
          createdAt: new Date('2026-01-10T14:30:00Z'),
        },
        {
          userId: ravi.id,
          transactionType: 'investment',
          amount: INR(10000),
          balanceBefore: INR(50000),
          balanceAfter: INR(40000),
          referenceType: 'raise',
          status: 'completed',
          description: 'Primary raise — TechCo Solutions (100 shares @ ₹100)',
          createdAt: new Date('2026-01-16T10:00:00Z'),
        },
        {
          userId: ravi.id,
          transactionType: 'deposit',
          amount: INR(20000),
          balanceBefore: INR(40000),
          balanceAfter: INR(60000),
          referenceType: 'deposit',
          status: 'completed',
          description: 'UPI deposit via Razorpay',
          createdAt: new Date('2026-02-15T09:00:00Z'),
        },
        {
          userId: ravi.id,
          transactionType: 'sale',
          amount: INR(4200),
          balanceBefore: INR(60000),
          balanceAfter: INR(64200),
          referenceType: 'trade',
          status: 'completed',
          description: 'Sold 50 shares of HealthCo @ ₹84',
          createdAt: new Date('2026-01-24T15:30:00Z'),
        },
      ],
    });
  }

  // ── 12. Notifications ────────────────────────────────────────────────────────
  console.log('Creating notifications...');

  if (ravi) {
    await prisma.notification.createMany({
      skipDuplicates: false,
      data: [
        {
          userId: ravi.id,
          type: 'wallet_credited',
          title: 'Wallet Recharged',
          body: '₹50,000 successfully added to your wallet.',
          isRead: true,
          readAt: new Date('2026-01-10T15:00:00Z'),
          createdAt: new Date('2026-01-10T14:30:00Z'),
        },
        {
          userId: ravi.id,
          type: 'order_placed',
          title: 'Buy Order Placed',
          body: 'Your order to buy 500 shares of TechCo @ ₹150 is live in the order book.',
          isRead: false,
          createdAt: new Date('2026-03-24T09:15:00Z'),
        },
      ],
    });
  }

  console.log('✅ Seed complete!');
  console.log(`
  Summary:
  ──────────────────────────────────────────
  👤 Admin users:      1
  👤 Investor users:   10
  🏢 Companies:        5 (3 live, 1 approved, 1 under review)
  💼 Share registry:   11 entries
  📈 Primary raises:   2
  📋 Open orders:      6 (3 buy, 3 sell for TechCo)
  📜 Transactions:     4 (for Ravi Kumar)
  🔔 Notifications:    2 (for Ravi Kumar)
  ──────────────────────────────────────────

  Test login: mobile 9876543210 (Ravi Kumar) — KYC complete
  Test login: mobile 9876543211 (Priya Sharma) — Accredited investor
  Test login: mobile 9000000001 — Admin
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
