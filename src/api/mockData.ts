export const mockProducts = [
  {
    id: 1,
    name: "红富士苹果",
    description: "山东烟台正宗红富士，脆甜多汁，产地直发。",
    price: 5.5,
    originalPrice: 8.0,
    stock: 500,
    salesCount: 120,
    buyerCount: 45,
    unit: "斤",
    origin: "山东烟台",
    tags: "有机,绿色食品,助农",
    coverImage: "https://picsum.photos/seed/apple1/400/300",
    images: "https://picsum.photos/seed/apple1/800/600",
    categoryId: 2,
    categoryName: "水果",
    sellerId: 2,
    sellerName: "张三果园",
    status: "ON_SALE",
    createdAt: "2026-02-25 10:30:00",
  },
  {
    id: 2,
    name: "农家散养土鸡蛋",
    description: "纯天然散养土鸡产蛋，营养丰富，蛋黄橙红。",
    price: 1.5,
    originalPrice: 2.0,
    stock: 1000,
    salesCount: 450,
    buyerCount: 200,
    unit: "枚",
    origin: "四川绵阳",
    tags: "散养,土鸡蛋,营养",
    coverImage: "https://picsum.photos/seed/egg1/400/300",
    images: "https://picsum.photos/seed/egg1/800/600",
    categoryId: 3,
    categoryName: "禽蛋",
    sellerId: 3,
    sellerName: "李四农场",
    status: "ON_SALE",
    createdAt: "2026-02-24 09:15:00",
  },
  {
    id: 3,
    name: "有机五常大米",
    description: "正宗黑龙江五常大米，米粒饱满，清香扑鼻。",
    price: 8.8,
    originalPrice: 12.0,
    stock: 200,
    salesCount: 85,
    buyerCount: 30,
    unit: "斤",
    origin: "黑龙江五常",
    tags: "有机,地理标志",
    coverImage: "https://picsum.photos/seed/rice1/400/300",
    images: "https://picsum.photos/seed/rice1/800/600",
    categoryId: 1,
    categoryName: "粮油",
    sellerId: 4,
    sellerName: "王五米业",
    status: "ON_SALE",
    createdAt: "2026-02-20 14:20:00",
  },
];

export const mockTags = [
  "有机",
  "绿色食品",
  "助农",
  "散养",
  "土鸡蛋",
  "营养",
  "地理标志",
  "新鲜",
  "特价",
];

export const mockCategories = [
  { id: 1, name: "粮油", parentId: 0 },
  { id: 2, name: "水果", parentId: 0 },
  { id: 3, name: "禽蛋", parentId: 0 },
  { id: 4, name: "蔬菜", parentId: 0 },
  { id: 5, name: "肉类", parentId: 0 },
  { id: 6, name: "特产", parentId: 0 },
];

export const mockOrders = [
  {
    id: 12345,
    items: [
      {
        productId: 1,
        productName: "红富士苹果",
        productImage: "https://picsum.photos/seed/apple1/400/300",
        quantity: 2,
        unitPrice: 5.5,
      }
    ],
    totalAmount: 11.0,
    status: "COMPLETED",
    createdAt: "2026-02-20 10:00:00",
  },
  {
    id: 12346,
    items: [
      {
        productId: 2,
        productName: "农家散养土鸡蛋",
        productImage: "https://picsum.photos/seed/egg1/400/300",
        quantity: 10,
        unitPrice: 1.5,
      }
    ],
    totalAmount: 15.0,
    status: "PENDING_PAYMENT",
    createdAt: "2026-02-25 09:30:00",
  }
];



export const mockTourismSpots = [
  {
    id: 1,
    name: "张三采摘园",
    description: "体验亲手采摘新鲜草莓的乐趣，适合家庭周末游。",
    type: "PICKING_GARDEN",
    address: "山东省烟台市牟平区XX村",
    coverImage: "https://picsum.photos/seed/spot1/600/400",
    price: 68.0,
    rating: 4.8,
    reviewCount: 128,
    status: "APPROVED",
  },
  {
    id: 2,
    name: "李家村特色农家乐",
    description: "品尝地道农家菜，体验乡村慢生活，提供住宿。",
    type: "FARMSTAY",
    address: "四川省成都市郫都区XX村",
    coverImage: "https://picsum.photos/seed/spot2/600/400",
    price: 120.0,
    rating: 4.6,
    reviewCount: 85,
    status: "APPROVED",
  },
  {
    id: 3,
    name: "绿野生态公园",
    description: "天然氧吧，徒步、骑行、露营的绝佳去处。",
    type: "ECO_PARK",
    address: "浙江省杭州市临安区XX山",
    coverImage: "https://picsum.photos/seed/spot3/600/400",
    price: 0.0,
    rating: 4.9,
    reviewCount: 342,
    status: "APPROVED",
  },
];

export const mockFinanceDashboard = {
  totalRevenue: 126800.0,
  monthRevenue: 12500.0,
  lastMonthRevenue: 10200.0,
  revenueGrowthRate: 22.55,
  totalCompletedOrders: 234,
  activeOrders: 8,
  activeProducts: 12,
  monthlyTrend: [
    { month: "2025-10", revenue: 7500.0, orderCount: 12 },
    { month: "2025-11", revenue: 8200.0, orderCount: 14 },
    { month: "2025-12", revenue: 9000.0, orderCount: 16 },
    { month: "2026-01", revenue: 10200.0, orderCount: 18 },
    { month: "2026-02", revenue: 12500.0, orderCount: 22 },
  ],
  creditReport: {
    totalScore: 82,
    grade: "EXCELLENT",
    historyScore: 25,
    tradeScore: 35,
    riskScore: 22,
    registeredDays: 456,
    activeProductCount: 12,
    completedOrderCount: 234,
    completionRate: 98.3,
    totalTransactionAmount: 126800.0,
    recentMonthRevenue: 12500.0,
    activePolicyCount: 2,
    generatedAt: "2026-02-25 15:00:00",
  },
  activePolicies: 2,
  totalCoverage: 80000.0,
  suggestions: [
    "📈 本月收入同比增长22.55%，可考虑申请设备购置贷支持扩产",
    "⭐ 信用评分82分（优秀），可申请更高额度的贷款产品",
    "🌱 春耕备耕时节，可关注「春耕贷」等低利率贷款产品",
  ],
};

export const mockLoanProducts = [
  {
    id: 1,
    name: "春耕备耕贷",
    description: "专为农户春季购买种子、化肥、农药等农资设计的低息贷款。",
    type: "CROP_LOAN",
    minAmount: 5000,
    maxAmount: 100000,
    annualRate: 3.85,
    minTermMonths: 3,
    maxTermMonths: 12,
    minCreditScore: 60,
    providerName: "农村信用社牟平支行",
  },
  {
    id: 2,
    name: "农机设备购置贷",
    description: "支持购买大型农业机械设备，提高农业生产效率。",
    type: "EQUIPMENT_LOAN",
    minAmount: 20000,
    maxAmount: 500000,
    annualRate: 4.25,
    minTermMonths: 6,
    maxTermMonths: 36,
    minCreditScore: 70,
    providerName: "中国农业银行XX分行",
  },
];

export const mockInsuranceProducts = [
  {
    id: 1,
    name: "水稻种植综合险",
    description: "保障水稻种植过程中因自然灾害、病虫害等造成的损失。",
    type: "CROP",
    premium: 18,
    premiumUnit: "元/亩",
    coverageAmount: 800,
    coverageMonths: 6,
    coverageScope: "洪涝、干旱、病虫害导致的减产",
    claimConditions: "需提供损失照片和村委证明",
    providerName: "中国人保财险烟台分公司",
  },
  {
    id: 2,
    name: "生猪养殖保险",
    description: "为生猪养殖提供疾病、自然灾害等风险保障。",
    type: "LIVESTOCK",
    premium: 60,
    premiumUnit: "元/头",
    coverageAmount: 1500,
    coverageMonths: 12,
    coverageScope: "疫病死亡",
    claimConditions: "需提供兽医诊断证明和死亡证明",
    providerName: "中国人保财险烟台分公司",
  },
];

export const mockLoanApplications = [
  {
    id: 1,
    productName: "春耕备耕贷",
    applicantName: "张三果园",
    amount: 50000,
    purpose: "购买春耕种子化肥",
    termMonths: 12,
    creditScore: 82,
    status: "SUBMITTED",
    createdAt: "2026-02-20 10:00:00",
  },
];

export const mockPolicies = [
  {
    id: 1,
    policyNo: "POL-20260301-A3K7M2",
    productName: "水稻种植综合险",
    totalPremium: 400,
    totalCoverage: 20000,
    quantity: 2,
    status: "ACTIVE",
    effectiveDate: "2026-03-01",
    expiryDate: "2026-09-01",
    coverageMonths: 6,
  },
];

export const mockClaims = [
  {
    id: 1,
    policyId: 1,
    claimantName: "张三果园",
    claimAmount: 5000,
    description: "暴雨导致部分水稻倒伏受损",
    incidentDate: "2026-05-15",
    status: "SUBMITTED",
    createdAt: "2026-05-16 08:00:00",
  },
];

export const mockAddresses = [
  {
    id: 1,
    receiverName: "李四",
    receiverPhone: "13900139000",
    province: "浙江省",
    city: "杭州市",
    district: "西湖区",
    detail: "文三路123号",
    fullAddress: "浙江省杭州市西湖区文三路123号",
    isDefault: true,
    createdAt: "2026-02-20 10:00:00",
  },
  {
    id: 2,
    receiverName: "李四",
    receiverPhone: "13900139000",
    province: "上海市",
    city: "浦东新区",
    district: "",
    detail: "张江高科技园区碧波路888号",
    fullAddress: "上海市浦东新区张江高科技园区碧波路888号",
    isDefault: false,
    createdAt: "2026-02-22 14:30:00",
  },
];

export const mockRoutes = [
  {
    id: 1,
    title: "烟台周末两日游",
    creatorName: "小王",
    totalDays: 2,
    startDate: "2026-03-20",
    isPublic: true,
    coverImage: "https://picsum.photos/seed/route1/800/400",
    copyCount: 3,
    days: [
      {
        dayNumber: 1,
        date: "2026-03-20",
        spots: [
          { itemId: 1, spotId: 1, spotName: "张三采摘园", coverImage: "https://picsum.photos/seed/spot1/600/400", type: "PICKING_GARDEN", address: "山东省烟台市牟平区XX村", sortOrder: 1, visitTime: "09:00", durationMinutes: 180, notes: "上午摘草莓" },
        ],
      },
      {
        dayNumber: 2,
        date: "2026-03-21",
        spots: [
          { itemId: 2, spotId: 3, spotName: "绿野生态公园", coverImage: "https://picsum.photos/seed/spot3/600/400", type: "ECO_PARK", address: "浙江省杭州市临安区XX山", sortOrder: 1, visitTime: "08:30", durationMinutes: 240, notes: "徒步+野餐" },
        ],
      },
    ],
  },
];
