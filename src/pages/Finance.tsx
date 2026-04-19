import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import {
  Shield, TrendingUp, ChevronRight, Plus, Edit, Trash2, Check, XCircle,
  FileText, CreditCard, ClipboardList, Eye, DollarSign, Landmark, AlertCircle, Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const LOAN_TYPES: Record<string, string> = {
  CROP_LOAN: "春耕贷",
  EQUIPMENT_LOAN: "设备贷",
  WORKING_CAPITAL: "流动资金贷",
  LAND_LOAN: "土地贷",
  AGRI_CHAIN: "产业链贷",
};

const INSURANCE_TYPES: Record<string, string> = {
  CROP: "种植险",
  LIVESTOCK: "养殖险",
  FORESTRY: "林业险",
  FACILITY: "设施险",
  INCOME: "收入险",
};

export default function Finance() {
  const { userInfo } = useAuthStore();
  const { addToast } = useToast();

  const role = userInfo?.role;
  const isFarmer = role && ["FARMER", "MERCHANT"].includes(role);
  const isFinProvider = role === "FINANCIAL_PROVIDER";
  const isInsProvider = role === "INSURANCE_PROVIDER";
  const isAdmin = role === "ADMIN";

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard data (farmer)
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Loan products (browse)
  const [loans, setLoans] = useState<any[]>([]);
  // Insurance products (browse)
  const [insuranceProducts, setInsuranceProducts] = useState<any[]>([]);

  // Financial Provider: my loan products
  const [myLoanProducts, setMyLoanProducts] = useState<any[]>([]);
  // Financial Provider: pending loan apps for review
  const [pendingLoanApps, setPendingLoanApps] = useState<any[]>([]);

  // Insurance Provider: my insurance products
  const [myInsuranceProducts, setMyInsuranceProducts] = useState<any[]>([]);
  // Insurance Provider: pending claims
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);

  // Farmer: my loan applications
  const [myLoanApps, setMyLoanApps] = useState<any[]>([]);
  // Farmer: my policies
  const [myPolicies, setMyPolicies] = useState<any[]>([]);

  // Modals
  const [showLoanApplyModal, setShowLoanApplyModal] = useState(false);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<any>(null);
  const [loanApplyForm, setLoanApplyForm] = useState({ amount: "", purpose: "", termMonths: "" });

  const [showInsuranceBuyModal, setShowInsuranceBuyModal] = useState(false);
  const [selectedInsProduct, setSelectedInsProduct] = useState<any>(null);
  const [insuranceBuyForm, setInsuranceBuyForm] = useState({ quantity: 1, effectiveDate: "" });

  // Loan detail modal
  const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);
  const [loanDetailProduct, setLoanDetailProduct] = useState<any>(null);

  // Insurance detail modal
  const [showInsDetailModal, setShowInsDetailModal] = useState(false);
  const [insDetailProduct, setInsDetailProduct] = useState<any>(null);

  // Loan application detail modal
  const [showLoanAppDetailModal, setShowLoanAppDetailModal] = useState(false);
  const [selectedLoanApp, setSelectedLoanApp] = useState<any>(null);

  // Provider: publish loan product
  const [showPublishLoanModal, setShowPublishLoanModal] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);
  const [loanProductForm, setLoanProductForm] = useState({
    name: "", type: "CROP_LOAN", description: "", minAmount: "", maxAmount: "",
    annualRate: "", minTermMonths: "", maxTermMonths: "", minCreditScore: "40",
  });

  // Provider: publish insurance product
  const [showPublishInsModal, setShowPublishInsModal] = useState(false);
  const [editingInsId, setEditingInsId] = useState<number | null>(null);
  const [insProductForm, setInsProductForm] = useState({
    name: "", type: "CROP", description: "", premium: "", premiumUnit: "元/亩",
    coverageAmount: "", coverageMonths: "", coverageScope: "", claimConditions: "",
  });

  const location = useLocation();

  // Jump to a specific tab when navigated here with state (e.g. from Profile cards)
  useEffect(() => {
    const targetTab = (location.state as any)?.tab;
    if (targetTab) setActiveTab(targetTab);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [userInfo]);

  useEffect(() => {
    if (activeTab === "myLoanApps") fetchMyLoanApps();
    if (activeTab === "myPolicies") fetchMyPolicies();
    if (activeTab === "myLoanProducts") fetchMyLoanProducts();
    if (activeTab === "loanReview") fetchPendingLoanApps();
    if (activeTab === "myInsProducts") fetchMyInsuranceProducts();
    if (activeTab === "claimReview") fetchPendingClaims();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        api.get("/finance/loan-products?page=1&size=20"),
        api.get("/finance/insurance-products?page=1&size=20"),
      ];
      if (isFarmer) {
        promises.push(api.get("/finance/dashboard"));
      }
      const results = await Promise.allSettled(promises);
      if (results[0].status === "fulfilled") setLoans(results[0].value.data?.data?.records || []);
      if (results[1].status === "fulfilled") setInsuranceProducts(results[1].value.data?.data?.records || []);
      if (results[2]?.status === "fulfilled") setDashboard(results[2].value.data?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLoanProducts = async () => {
    try {
      const res = await api.get("/finance/loan-products/mine");
      setMyLoanProducts(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPendingLoanApps = async () => {
    try {
      const res = await api.get("/finance/loan-applications/review?status=SUBMITTED");
      setPendingLoanApps(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyInsuranceProducts = async () => {
    try {
      const res = await api.get("/finance/insurance-products/mine");
      setMyInsuranceProducts(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPendingClaims = async () => {
    try {
      const res = await api.get("/finance/claims/review?status=SUBMITTED");
      setPendingClaims(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyLoanApps = async () => {
    try {
      const res = await api.get("/finance/loan-applications/mine");
      setMyLoanApps(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyPolicies = async () => {
    try {
      const res = await api.get("/finance/policies/mine");
      setMyPolicies(res.data?.data?.records || res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  // --- Handlers ---

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanProduct) return;

    const amount = parseFloat(loanApplyForm.amount);
    const term = parseInt(loanApplyForm.termMonths);

    // Validate amount range
    if (selectedLoanProduct.minAmount && amount < selectedLoanProduct.minAmount) {
      addToast(`申请金额不能低于最低限额 ${formatCurrency(selectedLoanProduct.minAmount)}`, "error");
      return;
    }
    if (selectedLoanProduct.maxAmount && amount > selectedLoanProduct.maxAmount) {
      addToast(`申请金额不能超过最高额度 ${formatCurrency(selectedLoanProduct.maxAmount)}`, "error");
      return;
    }

    // Validate term
    if (selectedLoanProduct.maxTermMonths && term > selectedLoanProduct.maxTermMonths) {
      addToast(`申请期限不能超过最长期限 ${selectedLoanProduct.maxTermMonths} 个月`, "error");
      return;
    }

    // Check credit score
    if (selectedLoanProduct.minCreditScore && dashboard?.creditReport?.totalScore) {
      const userScore = dashboard.creditReport.totalScore;
      const requiredScore = selectedLoanProduct.minCreditScore;
      if (userScore < requiredScore) {
        addToast(`您的信用评分（${userScore}分）低于该产品最低要求（${requiredScore}分），暂时无法申请`, "error");
        return;
      }
    }

    try {
      const res = await api.post("/finance/loan-applications", {
        productId: selectedLoanProduct.id,
        applyAmount: amount,
        purpose: loanApplyForm.purpose,
        applyTermMonths: term,
      });
      if (res.data.code === 200) {
        addToast("贷款申请已提交", "success");
        setShowLoanApplyModal(false);
        setLoanApplyForm({ amount: "", purpose: "", termMonths: "" });
      } else {
        addToast(res.data.message || "申请失败", "error");
      }
    } catch (err) { addToast("申请失败", "error"); }
  };

  const handleBuyInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsProduct) return;
    try {
      const res = await api.post("/finance/policies", {
        productId: selectedInsProduct.id,
        quantity: insuranceBuyForm.quantity,
        effectiveDate: insuranceBuyForm.effectiveDate,
      });
      if (res.data.code === 200) {
        addToast("投保成功，请完成支付", "success");
        setShowInsuranceBuyModal(false);
        setInsuranceBuyForm({ quantity: 1, effectiveDate: "" });
      } else {
        addToast(res.data.message || "投保失败", "error");
      }
    } catch (err) { addToast("投保失败", "error"); }
  };

  const handleReviewLoan = async (appId: number, approved: boolean) => {
    try {
      const res = await api.put(`/finance/loan-applications/${appId}/review`, {
        approved,
        remark: approved ? "审核通过" : "条件不满足",
      });
      if (res.data.code === 200) {
        addToast(approved ? "已通过" : "已拒绝", "success");
        fetchPendingLoanApps();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const handleReviewClaim = async (claimId: number, approved: boolean) => {
    try {
      const res = await api.put(`/finance/claims/${claimId}/review`, {
        approved,
        remark: approved ? "理赔审核通过" : "不符合理赔条件",
      });
      if (res.data.code === 200) {
        addToast(approved ? "已通过" : "已拒绝", "success");
        fetchPendingClaims();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const openPublishLoanModal = (product?: any) => {
    if (product) {
      setEditingLoanId(product.id);
      setLoanProductForm({
        name: product.name || "",
        type: product.type || "CROP_LOAN",
        description: product.description || "",
        minAmount: product.minAmount?.toString() || "",
        maxAmount: product.maxAmount?.toString() || "",
        annualRate: product.annualRate?.toString() || "",
        minTermMonths: product.minTermMonths?.toString() || "",
        maxTermMonths: product.maxTermMonths?.toString() || "",
        minCreditScore: product.minCreditScore?.toString() || "40",
      });
    } else {
      setEditingLoanId(null);
      setLoanProductForm({ name: "", type: "CROP_LOAN", description: "", minAmount: "", maxAmount: "", annualRate: "", minTermMonths: "", maxTermMonths: "", minCreditScore: "40" });
    }
    setShowPublishLoanModal(true);
  };

  const handlePublishLoanProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...loanProductForm,
        minAmount: parseFloat(loanProductForm.minAmount),
        maxAmount: parseFloat(loanProductForm.maxAmount),
        annualRate: parseFloat(loanProductForm.annualRate),
        minTermMonths: parseInt(loanProductForm.minTermMonths),
        maxTermMonths: parseInt(loanProductForm.maxTermMonths),
        minCreditScore: parseInt(loanProductForm.minCreditScore),
      };
      let res;
      if (editingLoanId) {
        res = await api.put(`/finance/loan-products/${editingLoanId}`, payload);
      } else {
        res = await api.post("/finance/loan-products", payload);
      }
      if (res.data.code === 200) {
        addToast(editingLoanId ? "产品已更新" : "产品已发布", "success");
        setShowPublishLoanModal(false);
        fetchMyLoanProducts();
        fetchInitialData();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const handleDeleteLoanProduct = async (id: number) => {
    try {
      const res = await api.delete(`/finance/loan-products/${id}`);
      if (res.data.code === 200) {
        addToast("产品已下线", "success");
        fetchMyLoanProducts();
        fetchInitialData();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const openPublishInsModal = (product?: any) => {
    if (product) {
      setEditingInsId(product.id);
      setInsProductForm({
        name: product.name || "",
        type: product.type || "CROP",
        description: product.description || "",
        premium: product.premium?.toString() || "",
        premiumUnit: product.premiumUnit || "元/亩",
        coverageAmount: product.coverageAmount?.toString() || "",
        coverageMonths: product.coverageMonths?.toString() || "",
        coverageScope: product.coverageScope || "",
        claimConditions: product.claimConditions || "",
      });
    } else {
      setEditingInsId(null);
      setInsProductForm({ name: "", type: "CROP", description: "", premium: "", premiumUnit: "元/亩", coverageAmount: "", coverageMonths: "", coverageScope: "", claimConditions: "" });
    }
    setShowPublishInsModal(true);
  };

  const handlePublishInsProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...insProductForm,
        premium: parseFloat(insProductForm.premium),
        coverageAmount: parseFloat(insProductForm.coverageAmount),
        coverageMonths: parseInt(insProductForm.coverageMonths),
      };
      let res;
      if (editingInsId) {
        res = await api.put(`/finance/insurance-products/${editingInsId}`, payload);
      } else {
        res = await api.post("/finance/insurance-products", payload);
      }
      if (res.data.code === 200) {
        addToast(editingInsId ? "产品已更新" : "产品已发布", "success");
        setShowPublishInsModal(false);
        fetchMyInsuranceProducts();
        fetchInitialData();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const handleDeleteInsProduct = async (id: number) => {
    try {
      const res = await api.delete(`/finance/insurance-products/${id}`);
      if (res.data.code === 200) {
        addToast("产品已下线", "success");
        fetchMyInsuranceProducts();
        fetchInitialData();
      } else { addToast(res.data.message || "操作失败", "error"); }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const handlePayPolicy = async (policyId: number) => {
    try {
      const res = await api.put(`/finance/policies/${policyId}/pay`);
      if (res.data.code === 200) {
        addToast("保费支付成功", "success");
        fetchMyPolicies();
      } else { addToast(res.data.message || "支付失败", "error"); }
    } catch (err) { addToast("支付失败", "error"); }
  };

  const openInsDetail = (product: any) => {
    setInsDetailProduct(product);
    setShowInsDetailModal(true);
  };

  const openLoanAppDetail = (app: any) => {
    setSelectedLoanApp(app);
    setShowLoanAppDetailModal(true);
  };

  // --- Check product expiry ---
  const isProductExpired = (product: any): boolean => {
    if (!product) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (product.endDate) {
      const end = new Date(product.endDate);
      return end < today;
    }
    if (product.expiryDate) {
      const exp = new Date(product.expiryDate);
      return exp < today;
    }
    if (product.status === "EXPIRED" || product.status === "OFF_SHELF" || product.status === "INACTIVE") {
      return true;
    }
    return false;
  };

  const openLoanDetail = (product: any) => {
    setLoanDetailProduct(product);
    setShowLoanDetailModal(true);
  };

  // --- Build tabs ---
  const tabs: { key: string; label: string }[] = [];

  if (isFarmer) {
    tabs.push({ key: "overview", label: "财务看板" });
    tabs.push({ key: "loanBrowse", label: "贷款产品" });
    tabs.push({ key: "insuranceBrowse", label: "保险产品" });
    tabs.push({ key: "myLoanApps", label: "我的贷款" });
    tabs.push({ key: "myPolicies", label: "我的保险" });
  } else if (isFinProvider) {
    tabs.push({ key: "myLoanProducts", label: "我的贷款产品" });
    tabs.push({ key: "loanReview", label: "贷款审核" });
  } else if (isInsProvider) {
    tabs.push({ key: "myInsProducts", label: "我的保险产品" });
    tabs.push({ key: "claimReview", label: "理赔审核" });
  } else if (isAdmin) {
    tabs.push({ key: "loanBrowse", label: "贷款产品" });
    tabs.push({ key: "insuranceBrowse", label: "保险产品" });
    tabs.push({ key: "loanReview", label: "贷款审核" });
    tabs.push({ key: "claimReview", label: "理赔审核" });
  } else {
    // TOURIST - browse only
    tabs.push({ key: "loanBrowse", label: "贷款产品" });
    tabs.push({ key: "insuranceBrowse", label: "保险产品" });
  }

  // Set default tab
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">农村金融服务</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isFinProvider ? "管理贷款产品，审核贷款申请" :
           isInsProvider ? "管理保险产品，审核理赔申请" :
           "助农贷款、农业保险、财务分析一站式服务"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Farmer Dashboard */}
      {activeTab === "overview" && isFarmer && dashboard && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">总收入</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.totalRevenue)}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">本月收入</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.monthRevenue)}</div>
                <div className={`text-sm font-medium mb-1 ${dashboard.revenueGrowthRate > 0 ? "text-green-600" : "text-red-600"}`}>
                  {dashboard.revenueGrowthRate > 0 ? "+" : ""}{dashboard.revenueGrowthRate}%
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">信用评分</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{dashboard.creditReport?.totalScore}</div>
                <div className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                  {dashboard.creditReport?.grade === "EXCELLENT" ? "优秀" :
                   dashboard.creditReport?.grade === "GOOD" ? "良好" :
                   dashboard.creditReport?.grade === "FAIR" ? "一般" : "较差"}
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">生效保单</div>
              <div className="text-2xl font-bold text-gray-900">{dashboard.activePolicies} 份</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-6">收入趋势</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(val) => `¥${val / 1000}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "收入"]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3}
                      dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-900">智能建议</h3>
              </div>
              <div className="space-y-4 flex-1">
                {dashboard.suggestions?.map((sug: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-blue-800 bg-white/60 p-3 rounded-lg">
                    <span className="shrink-0 mt-0.5">{sug.charAt(0)}</span>
                    <span>{sug.substring(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loan Products Browse */}
      {activeTab === "loanBrowse" && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">贷款产品</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-48"></div>)}
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无贷款产品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loans.map((loan, idx) => {
                const expired = isProductExpired(loan);
                return (
                <motion.div key={loan.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all relative overflow-hidden group ${expired ? "opacity-60 grayscale" : "hover:border-blue-200 hover:shadow-md"}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:bg-blue-100 transition-colors"></div>
                  {expired && (
                    <div className="absolute top-3 left-3 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md z-10">已过期</div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{loan.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{loan.providerName}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                      {LOAN_TYPES[loan.type] || loan.type}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{loan.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">最高额度</div>
                      <div className="text-lg font-bold text-red-600">{(loan.maxAmount || 0) / 10000}万</div>
                    </div>
                    {loan.minAmount && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">最低金额</div>
                        <div className="text-sm font-bold text-gray-700">{formatCurrency(loan.minAmount)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">年化利率</div>
                      <div className="text-lg font-bold text-gray-900">{loan.annualRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">最长期限</div>
                      <div className="text-lg font-bold text-gray-900">{loan.maxTermMonths}个月</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5 text-green-500" />
                      需信用分 ≥ {loan.minCreditScore}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openLoanDetail(loan)}
                        className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </button>
                      {isFarmer && (
                        <button
                          onClick={() => {
                            if (expired) return;
                            // Check credit score before opening modal
                            if (loan.minCreditScore && dashboard?.creditReport?.totalScore && dashboard.creditReport.totalScore < loan.minCreditScore) {
                              addToast(`您的信用评分（${dashboard.creditReport.totalScore}分）低于该产品最低要求（${loan.minCreditScore}分），暂时无法申请`, "error");
                              return;
                            }
                            setSelectedLoanProduct(loan);
                            setShowLoanApplyModal(true);
                          }}
                          disabled={expired}
                          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${expired ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                        >
                          立即申请
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Insurance Products Browse */}
      {activeTab === "insuranceBrowse" && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">保险产品</h2>
          </div>
          {insuranceProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无保险产品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insuranceProducts.map((ins, idx) => {
                const expired = isProductExpired(ins);
                return (
                <motion.div key={ins.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all relative overflow-hidden group ${expired ? "opacity-60 grayscale" : "hover:border-green-200 hover:shadow-md"}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10 group-hover:bg-green-100 transition-colors"></div>
                  {expired && (
                    <div className="absolute top-3 left-3 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md z-10">已过期</div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{ins.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{ins.providerName}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                      {INSURANCE_TYPES[ins.type] || ins.type}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{ins.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">保费</div>
                      <div className="text-lg font-bold text-red-600">{formatCurrency(ins.premium || 0)}{ins.premiumUnit ? `/${ins.premiumUnit.replace("元/", "")}` : ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">保额</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(ins.coverageAmount || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">保障期</div>
                      <div className="text-lg font-bold text-gray-900">{ins.coverageMonths}个月</div>
                    </div>
                    {ins.coverageScope && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">保障范围</div>
                        <div className="text-sm font-medium text-gray-700 line-clamp-2">{ins.coverageScope}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end pt-4 border-t border-gray-50 gap-2">
                    <button
                      onClick={() => openInsDetail(ins)}
                      className="px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                    {isFarmer && (
                      <button
                        onClick={() => { if (!expired) { setSelectedInsProduct(ins); setShowInsuranceBuyModal(true); } }}
                        disabled={expired}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${expired ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                      >
                        立即投保
                      </button>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* My Loan Applications (Farmer) */}
      {activeTab === "myLoanApps" && isFarmer && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">我的贷款申请</h2>
          {myLoanApps.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无贷款申请</div>
          ) : (
            <div className="space-y-3">
              {myLoanApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => openLoanAppDetail(app)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{app.productName || "贷款产品"}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        金额：{formatCurrency(app.amount || app.applyAmount)} · 期限：{app.termMonths || app.applyTermMonths}个月
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                        app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        app.status === "DISBURSED" ? "bg-blue-100 text-blue-700" :
                        app.status === "REPAID" ? "bg-green-100 text-green-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {app.status === "SUBMITTED" ? "待审核" :
                         app.status === "UNDER_REVIEW" ? "审核中" :
                         app.status === "APPROVED" ? "已通过" :
                         app.status === "REJECTED" ? "已拒绝" :
                         app.status === "DISBURSED" ? "已放款" :
                         app.status === "REPAID" ? "已还清" : app.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {app.purpose && <p className="text-sm text-gray-600 mt-2">用途：{app.purpose}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* My Policies (Farmer) */}
      {activeTab === "myPolicies" && isFarmer && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">我的保单</h2>
          {myPolicies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无保单</div>
          ) : (
            <div className="space-y-3">
              {myPolicies.map(policy => (
                <div key={policy.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{policy.productName || "保险产品"}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        保费：{formatCurrency(policy.totalPremium || 0)} · 保额：{formatCurrency(policy.totalCoverage || 0)}
                        {policy.quantity && ` · ${policy.quantity}份`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      policy.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      policy.status === "EXPIRED" ? "bg-gray-100 text-gray-700" :
                      policy.status === "CLAIMED" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {policy.status === "PENDING_PAYMENT" ? "待支付" :
                       policy.status === "ACTIVE" ? "生效中" :
                       policy.status === "EXPIRED" ? "已过期" :
                       policy.status === "CLAIMED" ? "已理赔" :
                       policy.status === "CANCELLED" ? "已取消" : policy.status}
                    </span>
                  </div>
                  {(policy.effectiveDate || policy.startDate) && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      保障期：{policy.effectiveDate || policy.startDate} ~ {policy.expiryDate || policy.endDate}
                      {policy.coverageMonths && ` (${policy.coverageMonths}个月)`}
                    </p>
                  )}
                  {policy.status === "PENDING_PAYMENT" && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handlePayPolicy(policy.id)}
                        className="flex items-center gap-1 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        支付保费
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* My Loan Products (Financial Provider) */}
      {activeTab === "myLoanProducts" && isFinProvider && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">我的贷款产品</h2>
            <button
              onClick={() => openPublishLoanModal()}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              发布贷款产品
            </button>
          </div>
          {myLoanProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无贷款产品，点击上方发布</div>
          ) : (
            <div className="space-y-3">
              {myLoanProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{product.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {LOAN_TYPES[product.type] || product.type} · 最高{(product.maxAmount || 0) / 10000}万 · {product.annualRate}%利率
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openPublishLoanModal(product)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteLoanProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Loan Review (Financial Provider / Admin) */}
      {activeTab === "loanReview" && (isFinProvider || isAdmin) && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">待审核贷款申请</h2>
          {pendingLoanApps.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无待审核申请</div>
          ) : (
            <div className="space-y-3">
              {pendingLoanApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{app.applicantName || "申请人"}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        产品：{app.productName} · 金额：{formatCurrency(app.amount)} · 期限：{app.termMonths}个月
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                  </div>
                  {app.purpose && <p className="text-sm text-gray-600">用途：{app.purpose}</p>}
                  {app.creditScore && <p className="text-xs text-gray-500">信用评分：{app.creditScore}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleReviewLoan(app.id, false)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                      <XCircle className="w-4 h-4" />拒绝
                    </button>
                    <button onClick={() => handleReviewLoan(app.id, true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      <Check className="w-4 h-4" />通过
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* My Insurance Products (Insurance Provider) */}
      {activeTab === "myInsProducts" && isInsProvider && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">我的保险产品</h2>
            <button
              onClick={() => openPublishInsModal()}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              发布保险产品
            </button>
          </div>
          {myInsuranceProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无保险产品，点击上方发布</div>
          ) : (
            <div className="space-y-3">
              {myInsuranceProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{product.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {INSURANCE_TYPES[product.type] || product.type} · 保费{formatCurrency(product.premium || 0)}{product.premiumUnit ? `/${product.premiumUnit.replace("元/", "")}` : ""} · 保额{formatCurrency(product.coverageAmount || 0)} · {product.coverageMonths}个月
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openPublishInsModal(product)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteInsProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Claim Review (Insurance Provider / Admin) */}
      {activeTab === "claimReview" && (isInsProvider || isAdmin) && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">待审核理赔申请</h2>
          {pendingClaims.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">暂无待审核理赔</div>
          ) : (
            <div className="space-y-3">
              {pendingClaims.map(claim => (
                <div key={claim.id} className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{claim.claimantName || "申请人"}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        保单号：{claim.policyId} · 索赔：{formatCurrency(claim.claimAmount || 0)}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                  </div>
                  {claim.description && <p className="text-sm text-gray-600">描述：{claim.description}</p>}
                  {claim.incidentDate && <p className="text-xs text-gray-500">出险日期：{claim.incidentDate}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleReviewClaim(claim.id, false)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                      <XCircle className="w-4 h-4" />拒绝
                    </button>
                    <button onClick={() => handleReviewClaim(claim.id, true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      <Check className="w-4 h-4" />通过
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Loan Apply Modal */}
      <Modal isOpen={showLoanApplyModal} onClose={() => setShowLoanApplyModal(false)} title={`申请贷款 - ${selectedLoanProduct?.name || ""}`}>
        <form onSubmit={handleApplyLoan} className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">最高额度</span><span className="font-bold">{formatCurrency(selectedLoanProduct?.maxAmount || 0)}</span></div>
            {selectedLoanProduct?.minAmount && (
              <div className="flex justify-between"><span className="text-gray-600">最低申请金额</span><span className="font-bold">{formatCurrency(selectedLoanProduct.minAmount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-600">年化利率</span><span className="font-bold">{selectedLoanProduct?.annualRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-600">最长期限</span><span className="font-bold">{selectedLoanProduct?.maxTermMonths} 个月</span></div>
            <div className="flex justify-between"><span className="text-gray-600">最低信用分要求</span><span className="font-bold">{selectedLoanProduct?.minCreditScore} 分</span></div>
          </div>

          {/* Credit score warning */}
          {dashboard?.creditReport?.totalScore && selectedLoanProduct?.minCreditScore && (
            <div className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
              dashboard.creditReport.totalScore >= selectedLoanProduct.minCreditScore
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {dashboard.creditReport.totalScore >= selectedLoanProduct.minCreditScore ? (
                <>
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>您的信用评分 <b>{dashboard.creditReport.totalScore}分</b>，满足该产品最低要求（{selectedLoanProduct.minCreditScore}分）</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>您的信用评分 <b>{dashboard.creditReport.totalScore}分</b>，低于该产品最低要求（{selectedLoanProduct.minCreditScore}分），提交后可能被拒绝</span>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申请金额 (元)
              {selectedLoanProduct?.minAmount && selectedLoanProduct?.maxAmount && (
                <span className="text-xs text-gray-400 ml-2">
                  范围: {formatCurrency(selectedLoanProduct.minAmount)} ~ {formatCurrency(selectedLoanProduct.maxAmount)}
                </span>
              )}
            </label>
            <input type="number" required
              min={selectedLoanProduct?.minAmount || 1}
              max={selectedLoanProduct?.maxAmount || undefined}
              className="w-full border border-gray-300 rounded-lg p-2"
              value={loanApplyForm.amount} onChange={e => setLoanApplyForm({...loanApplyForm, amount: e.target.value})}
              placeholder={selectedLoanProduct?.minAmount ? `最低 ${selectedLoanProduct.minAmount} 元` : "请输入申请金额"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">贷款用途</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={loanApplyForm.purpose} onChange={e => setLoanApplyForm({...loanApplyForm, purpose: e.target.value})}
              placeholder="如：购买春耕种子化肥" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              申请期限 (月)
              {selectedLoanProduct?.maxTermMonths && (
                <span className="text-xs text-gray-400 ml-2">最长 {selectedLoanProduct.maxTermMonths} 个月</span>
              )}
            </label>
            <input type="number" required min={selectedLoanProduct?.minTermMonths || 1}
              max={selectedLoanProduct?.maxTermMonths || undefined}
              className="w-full border border-gray-300 rounded-lg p-2"
              value={loanApplyForm.termMonths} onChange={e => setLoanApplyForm({...loanApplyForm, termMonths: e.target.value})} />
          </div>

          {/* Estimated monthly payment */}
          {loanApplyForm.amount && loanApplyForm.termMonths && selectedLoanProduct?.annualRate && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">预估月还款额</span>
                <span className="font-bold text-blue-700">
                  {formatCurrency(
                    (parseFloat(loanApplyForm.amount) * (1 + selectedLoanProduct.annualRate / 100 * parseInt(loanApplyForm.termMonths) / 12)) / parseInt(loanApplyForm.termMonths)
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">*仅供参考，实际以审批结果为准</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowLoanApplyModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">提交申请</button>
          </div>
        </form>
      </Modal>

      {/* Insurance Buy Modal */}
      <Modal isOpen={showInsuranceBuyModal} onClose={() => setShowInsuranceBuyModal(false)} title={`投保 - ${selectedInsProduct?.name || ""}`}>
        <form onSubmit={handleBuyInsurance} className="space-y-4">
          <div className="bg-green-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">单份保费</span><span className="font-bold">{formatCurrency(selectedInsProduct?.premium || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">单份保额</span><span className="font-bold">{formatCurrency(selectedInsProduct?.coverageAmount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">保障期</span><span className="font-bold">{selectedInsProduct?.coverageMonths}个月</span></div>
            {selectedInsProduct?.premiumUnit && (
              <div className="flex justify-between"><span className="text-gray-600">计量单位</span><span className="font-bold">{selectedInsProduct.premiumUnit}</span></div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">购买份数</label>
            <div className="flex items-center border border-gray-300 rounded-lg w-fit">
              <button type="button" onClick={() => setInsuranceBuyForm({...insuranceBuyForm, quantity: Math.max(1, insuranceBuyForm.quantity - 1)})} className="px-3 py-1 hover:bg-gray-50 text-gray-600">-</button>
              <span className="px-4 py-1 border-x border-gray-300 min-w-[40px] text-center">{insuranceBuyForm.quantity}</span>
              <button type="button" onClick={() => setInsuranceBuyForm({...insuranceBuyForm, quantity: insuranceBuyForm.quantity + 1})} className="px-3 py-1 hover:bg-gray-50 text-gray-600">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">保险生效日期</label>
            <input type="date" required className="w-full border border-gray-300 rounded-lg p-2"
              min={new Date().toISOString().split("T")[0]}
              value={insuranceBuyForm.effectiveDate}
              onChange={e => setInsuranceBuyForm({...insuranceBuyForm, effectiveDate: e.target.value})} />
            <p className="text-xs text-gray-400 mt-1">生效日期不能早于今天</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">总保费</span><span className="text-lg font-bold text-red-600">{formatCurrency((selectedInsProduct?.premium || 0) * insuranceBuyForm.quantity)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">总保额</span><span className="font-bold">{formatCurrency((selectedInsProduct?.coverageAmount || 0) * insuranceBuyForm.quantity)}</span></div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowInsuranceBuyModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认投保</button>
          </div>
        </form>
      </Modal>

      {/* Publish Loan Product Modal */}
      <Modal isOpen={showPublishLoanModal} onClose={() => setShowPublishLoanModal(false)} title={editingLoanId ? "编辑贷款产品" : "发布贷款产品"}>
        <form onSubmit={handlePublishLoanProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={loanProductForm.name} onChange={e => setLoanProductForm({...loanProductForm, name: e.target.value})} placeholder="如：春耕助农贷" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.type} onChange={e => setLoanProductForm({...loanProductForm, type: e.target.value})}>
                {Object.entries(LOAN_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年化利率 (%)</label>
              <input type="number" required step="0.01" className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.annualRate} onChange={e => setLoanProductForm({...loanProductForm, annualRate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低额度 (元)</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.minAmount} onChange={e => setLoanProductForm({...loanProductForm, minAmount: e.target.value})} placeholder="如：5000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高额度 (元)</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.maxAmount} onChange={e => setLoanProductForm({...loanProductForm, maxAmount: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最短期限 (月)</label>
              <input type="number" required min={1} className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.minTermMonths} onChange={e => setLoanProductForm({...loanProductForm, minTermMonths: e.target.value})} placeholder="如：3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最长期限 (月)</label>
              <input type="number" required min={1} className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.maxTermMonths} onChange={e => setLoanProductForm({...loanProductForm, maxTermMonths: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低信用分</label>
              <input type="number" required min={0} max={100} className="w-full border border-gray-300 rounded-lg p-2"
                value={loanProductForm.minCreditScore} onChange={e => setLoanProductForm({...loanProductForm, minCreditScore: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
            <textarea required className="w-full border border-gray-300 rounded-lg p-2" rows={3}
              value={loanProductForm.description} onChange={e => setLoanProductForm({...loanProductForm, description: e.target.value})} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPublishLoanModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingLoanId ? "保存修改" : "发布产品"}</button>
          </div>
        </form>
      </Modal>

      {/* Loan Detail Modal */}
      <Modal isOpen={showLoanDetailModal} onClose={() => setShowLoanDetailModal(false)} title={loanDetailProduct?.name || "贷款产品详情"}>
        {loanDetailProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                {LOAN_TYPES[loanDetailProduct.type] || loanDetailProduct.type}
              </span>
              {isProductExpired(loanDetailProduct) && (
                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md">已过期</span>
              )}
            </div>
            {loanDetailProduct.providerName && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Landmark className="w-4 h-4" />
                <span>发布机构：{loanDetailProduct.providerName}</span>
              </div>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{loanDetailProduct.description}</p>
            <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-xl p-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">最高贷款额度</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(loanDetailProduct.maxAmount || 0)}</div>
              </div>
              {loanDetailProduct.minAmount && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">最低申请金额</div>
                  <div className="text-xl font-bold text-gray-700">{formatCurrency(loanDetailProduct.minAmount)}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">年化利率</div>
                <div className="text-xl font-bold text-gray-900">{loanDetailProduct.annualRate}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">贷款期限</div>
                <div className="text-xl font-bold text-gray-900">{loanDetailProduct.minTermMonths} ~ {loanDetailProduct.maxTermMonths} 个月</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">最低信用分要求</div>
                <div className="text-xl font-bold text-gray-900">{loanDetailProduct.minCreditScore} 分</div>
              </div>
              {loanDetailProduct.annualRate && loanDetailProduct.maxTermMonths && loanDetailProduct.maxAmount && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">满额月还款参考</div>
                  <div className="text-sm font-bold text-blue-700">
                    ≈ {formatCurrency(
                      (loanDetailProduct.maxAmount * (1 + loanDetailProduct.annualRate / 100 * loanDetailProduct.maxTermMonths / 12)) / loanDetailProduct.maxTermMonths
                    )}/月
                  </div>
                </div>
              )}
            </div>

            {/* Credit score check display */}
            {dashboard?.creditReport?.totalScore && loanDetailProduct.minCreditScore && (
              <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                dashboard.creditReport.totalScore >= loanDetailProduct.minCreditScore
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                <Shield className="w-4 h-4 shrink-0" />
                {dashboard.creditReport.totalScore >= loanDetailProduct.minCreditScore
                  ? `您的信用评分（${dashboard.creditReport.totalScore}分）满足申请条件`
                  : `您的信用评分（${dashboard.creditReport.totalScore}分）低于最低要求（${loanDetailProduct.minCreditScore}分）`}
              </div>
            )}
            {loanDetailProduct.createdAt && (
              <div className="text-xs text-gray-400">发布时间：{loanDetailProduct.createdAt}</div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowLoanDetailModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">关闭</button>
              {isFarmer && !isProductExpired(loanDetailProduct) && (
                <button
                  onClick={() => {
                    setShowLoanDetailModal(false);
                    setSelectedLoanProduct(loanDetailProduct);
                    setShowLoanApplyModal(true);
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  立即申请
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Publish Insurance Product Modal */}
      <Modal isOpen={showPublishInsModal} onClose={() => setShowPublishInsModal(false)} title={editingInsId ? "编辑保险产品" : "发布保险产品"}>
        <form onSubmit={handlePublishInsProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={insProductForm.name} onChange={e => setInsProductForm({...insProductForm, name: e.target.value})} placeholder="如：水稻种植综合险" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={insProductForm.type} onChange={e => setInsProductForm({...insProductForm, type: e.target.value})}>
                {Object.entries(INSURANCE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保障期 (月)</label>
              <input type="number" required min={1} className="w-full border border-gray-300 rounded-lg p-2"
                value={insProductForm.coverageMonths} onChange={e => setInsProductForm({...insProductForm, coverageMonths: e.target.value})} placeholder="如：6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单份保费 (元)</label>
              <input type="number" required step="0.01" className="w-full border border-gray-300 rounded-lg p-2"
                value={insProductForm.premium} onChange={e => setInsProductForm({...insProductForm, premium: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保费单位</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={insProductForm.premiumUnit} onChange={e => setInsProductForm({...insProductForm, premiumUnit: e.target.value})}>
                <option value="元/亩">元/亩</option>
                <option value="元/头">元/头</option>
                <option value="元/份">元/份</option>
                <option value="元/棚">元/棚</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单份保额 (元)</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={insProductForm.coverageAmount} onChange={e => setInsProductForm({...insProductForm, coverageAmount: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
            <textarea required className="w-full border border-gray-300 rounded-lg p-2" rows={2}
              value={insProductForm.description} onChange={e => setInsProductForm({...insProductForm, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">保障范围</label>
            <textarea className="w-full border border-gray-300 rounded-lg p-2" rows={2}
              value={insProductForm.coverageScope} onChange={e => setInsProductForm({...insProductForm, coverageScope: e.target.value})}
              placeholder="如：洪涝、干旱、病虫害导致的减产" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">理赔条件</label>
            <textarea className="w-full border border-gray-300 rounded-lg p-2" rows={2}
              value={insProductForm.claimConditions} onChange={e => setInsProductForm({...insProductForm, claimConditions: e.target.value})}
              placeholder="如：需提供损失照片和村委证明" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowPublishInsModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingInsId ? "保存修改" : "发布产品"}</button>
          </div>
        </form>
      </Modal>

      {/* Insurance Detail Modal */}
      <Modal isOpen={showInsDetailModal} onClose={() => setShowInsDetailModal(false)} title={insDetailProduct?.name || "保险产品详情"}>
        {insDetailProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                {INSURANCE_TYPES[insDetailProduct.type] || insDetailProduct.type}
              </span>
              {isProductExpired(insDetailProduct) && (
                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md">已过期</span>
              )}
            </div>
            {insDetailProduct.providerName && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>承保机构：{insDetailProduct.providerName}</span>
              </div>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{insDetailProduct.description}</p>
            <div className="grid grid-cols-2 gap-4 bg-green-50 rounded-xl p-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">单份保费</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(insDetailProduct.premium || 0)}
                  {insDetailProduct.premiumUnit && <span className="text-xs font-normal text-gray-500 ml-1">/{insDetailProduct.premiumUnit.replace("元/", "")}</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">单份保额</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(insDetailProduct.coverageAmount || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">保障期限</div>
                <div className="text-xl font-bold text-gray-900">{insDetailProduct.coverageMonths} 个月</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">赔付比例</div>
                <div className="text-xl font-bold text-gray-900">
                  {insDetailProduct.coverageAmount && insDetailProduct.premium
                    ? `${Math.round(insDetailProduct.coverageAmount / insDetailProduct.premium)}倍`
                    : "—"}
                </div>
              </div>
            </div>
            {insDetailProduct.coverageScope && (
              <div>
                <div className="text-sm text-gray-500 mb-1">保障范围</div>
                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{insDetailProduct.coverageScope}</p>
              </div>
            )}
            {insDetailProduct.claimConditions && (
              <div>
                <div className="text-sm text-gray-500 mb-1">理赔条件</div>
                <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3">{insDetailProduct.claimConditions}</p>
              </div>
            )}
            {insDetailProduct.createdAt && (
              <div className="text-xs text-gray-400">发布时间：{insDetailProduct.createdAt}</div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowInsDetailModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">关闭</button>
              {isFarmer && !isProductExpired(insDetailProduct) && (
                <button
                  onClick={() => {
                    setShowInsDetailModal(false);
                    setSelectedInsProduct(insDetailProduct);
                    setShowInsuranceBuyModal(true);
                  }}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  立即投保
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Loan Application Detail Modal */}
      <Modal isOpen={showLoanAppDetailModal} onClose={() => setShowLoanAppDetailModal(false)} title="贷款申请详情">
        {selectedLoanApp && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{selectedLoanApp.productName || "贷款产品"}</h3>
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                selectedLoanApp.status === "APPROVED" ? "bg-green-100 text-green-700" :
                selectedLoanApp.status === "REJECTED" ? "bg-red-100 text-red-700" :
                selectedLoanApp.status === "DISBURSED" ? "bg-blue-100 text-blue-700" :
                selectedLoanApp.status === "REPAID" ? "bg-green-100 text-green-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {selectedLoanApp.status === "SUBMITTED" ? "待审核" :
                 selectedLoanApp.status === "UNDER_REVIEW" ? "审核中" :
                 selectedLoanApp.status === "APPROVED" ? "已通过" :
                 selectedLoanApp.status === "REJECTED" ? "已拒绝" :
                 selectedLoanApp.status === "DISBURSED" ? "已放款" :
                 selectedLoanApp.status === "REPAID" ? "已还清" : selectedLoanApp.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-xl p-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">申请金额</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(selectedLoanApp.amount || selectedLoanApp.applyAmount || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">申请期限</div>
                <div className="text-xl font-bold text-gray-900">{selectedLoanApp.termMonths || selectedLoanApp.applyTermMonths} 个月</div>
              </div>
              {selectedLoanApp.creditScore && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">信用评分快照</div>
                  <div className="text-xl font-bold text-blue-600">{selectedLoanApp.creditScore} 分</div>
                </div>
              )}
              {(selectedLoanApp.annualRate || selectedLoanApp.interestRate) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">年化利率</div>
                  <div className="text-xl font-bold text-gray-900">{selectedLoanApp.annualRate || selectedLoanApp.interestRate}%</div>
                </div>
              )}
            </div>

            {selectedLoanApp.purpose && (
              <div>
                <div className="text-sm text-gray-500 mb-1">贷款用途</div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedLoanApp.purpose}</p>
              </div>
            )}

            {/* Progress Timeline */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">申请进度</div>
              <div className="space-y-3">
                {[
                  { key: "SUBMITTED", label: "已提交申请", desc: "等待金融服务商审核" },
                  { key: "UNDER_REVIEW", label: "审核中", desc: "金融服务商正在审核您的申请" },
                  { key: "APPROVED", label: "审核通过", desc: "贷款申请已通过审核" },
                  { key: "DISBURSED", label: "已放款", desc: "贷款已发放至您的账户" },
                  { key: "REPAID", label: "已还清", desc: "贷款已全部还清" },
                ].map((step, idx) => {
                  const statusOrder = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "DISBURSED", "REPAID"];
                  const currentIdx = statusOrder.indexOf(selectedLoanApp.status);
                  const stepIdx = statusOrder.indexOf(step.key);
                  const isRejected = selectedLoanApp.status === "REJECTED";
                  const isActive = !isRejected && stepIdx <= currentIdx;
                  const isCurrent = !isRejected && stepIdx === currentIdx;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCurrent ? "bg-blue-600 text-white" :
                        isActive ? "bg-green-500 text-white" :
                        "bg-gray-200 text-gray-400"
                      }`}>
                        {isActive && !isCurrent ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}>{step.label}</div>
                        <div className={`text-xs ${isActive ? "text-gray-500" : "text-gray-300"}`}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
                {selectedLoanApp.status === "REJECTED" && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-500 text-white">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-700">审核未通过</div>
                      <div className="text-xs text-red-500">{selectedLoanApp.rejectReason || "不满足贷款条件"}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedLoanApp.createdAt && (
              <div className="text-xs text-gray-400">申请时间：{selectedLoanApp.createdAt}</div>
            )}
            <button onClick={() => setShowLoanAppDetailModal(false)} className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">关闭</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
