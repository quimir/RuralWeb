import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  User, Settings, LogOut, Shield, CreditCard, Edit, Lock, ShoppingBag, List, Plus, Users,
  Check, XCircle, Eye, MapPin, FileText, ClipboardList, Landmark, ShieldCheck, Calendar, Ticket, Trash2, Heart, Star, Camera
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { ImageUpload } from "../components/ui/ImageUpload";

const SPOT_TYPES = [
  { value: "PICKING_GARDEN", label: "采摘园" },
  { value: "FARMSTAY", label: "农家乐" },
  { value: "AGRI_EXPERIENCE", label: "农事体验" },
  { value: "FOLK_CULTURE", label: "民俗文化" },
  { value: "SCENIC_SPOT", label: "风景区" },
];

export default function Profile() {
  const { userInfo, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editForm, setEditForm] = useState({
    nickname: userInfo?.nickname || "",
    avatar: userInfo?.avatar || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    receiverName: "", receiverPhone: "", province: "", city: "", district: "", detail: "", isDefault: false,
  });

  // Favorites
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Admin: Spot Audit
  const [pendingSpots, setPendingSpots] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; spotId: number | null }>({ isOpen: false, spotId: null });
  const [rejectReason, setRejectReason] = useState("");

  // Admin: Loan Review
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [loanReviewLoading, setLoanReviewLoading] = useState(false);

  // Admin: Insurance Claim Review
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [claimReviewLoading, setClaimReviewLoading] = useState(false);

  const role = userInfo?.role;
  const isAdmin = role === "ADMIN";
  const isFarmerOrMerchant = role && ["FARMER", "MERCHANT"].includes(role);
  const isConsumer = role && ["TOURIST", "FARMER", "MERCHANT"].includes(role);

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "bookings") {
      fetchBookings();
    } else if (activeTab === "addresses") {
      fetchAddresses();
    } else if (activeTab === "favorites") {
      fetchFavorites();
    } else if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "spotAudit") {
      fetchPendingSpots();
    } else if (activeTab === "loanReview") {
      fetchPendingLoans();
    } else if (activeTab === "claimReview") {
      fetchPendingClaims();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders", { params: { page: 1, size: 20 } });
      setOrders(res.data?.data?.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await api.get("/tourism/bookings?page=1&size=50");
      const data = res.data?.data;
      setBookings(data?.records || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handlePayBooking = async (bookingId: number) => {
    try {
      const res = await api.put(`/tourism/bookings/${bookingId}/pay`);
      if (res.data.code === 200) {
        addToast("支付成功", "success");
        fetchBookings();
      } else {
        addToast(res.data.message || "支付失败", "error");
      }
    } catch (err) {
      addToast("支付失败", "error");
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const res = await api.put(`/tourism/bookings/${bookingId}/cancel`);
      if (res.data.code === 200) {
        addToast("预约已取消", "success");
        fetchBookings();
      } else {
        addToast(res.data.message || "取消失败", "error");
      }
    } catch (err) {
      addToast("取消失败", "error");
    }
  };

  // --- Favorites ---
  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const res = await api.get("/tourism/favorites?page=1&size=50");
      const data = res.data?.data;
      setFavorites(data?.records || (Array.isArray(data) ? data : []));
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleRemoveFavorite = async (spotId: number) => {
    try {
      await api.post(`/tourism/spots/${spotId}/favorite`);
      addToast("已取消收藏", "success");
      fetchFavorites();
    } catch {
      addToast("操作失败", "error");
    }
  };

  // --- Address Management ---
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await api.get("/addresses");
      setAddresses(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const openAddressModal = (address?: any) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        receiverName: address.receiverName || "",
        receiverPhone: address.receiverPhone || "",
        province: address.province || "",
        city: address.city || "",
        district: address.district || "",
        detail: address.detail || "",
        isDefault: address.isDefault || false,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({ receiverName: "", receiverPhone: "", province: "", city: "", district: "", detail: "", isDefault: false });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingAddressId) {
        res = await api.put(`/addresses/${editingAddressId}`, addressForm);
      } else {
        res = await api.post("/addresses", addressForm);
      }
      if (res.data.code === 200) {
        addToast(editingAddressId ? "地址已更新" : "地址已添加", "success");
        setShowAddressModal(false);
        fetchAddresses();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      const res = await api.delete(`/addresses/${addressId}`);
      if (res.data.code === 200) {
        addToast("地址已删除", "success");
        fetchAddresses();
      } else {
        addToast(res.data.message || "删除失败", "error");
      }
    } catch (err) {
      addToast("删除失败", "error");
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const res = await api.put(`/addresses/${addressId}/default`);
      if (res.data.code === 200) {
        addToast("已设为默认地址", "success");
        fetchAddresses();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/products/categories");
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingSpots = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/admin/tourism/spots?status=PENDING");
      setPendingSpots(res.data?.data?.records || res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchPendingLoans = async () => {
    setLoanReviewLoading(true);
    try {
      const res = await api.get("/finance/loan-applications/review?status=SUBMITTED");
      setPendingLoans(res.data?.data?.records || res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoanReviewLoading(false);
    }
  };

  const fetchPendingClaims = async () => {
    setClaimReviewLoading(true);
    try {
      const res = await api.get("/finance/claims/review?status=SUBMITTED");
      setPendingClaims(res.data?.data?.records || res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimReviewLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await api.post("/admin/categories", { name: newCategoryName.trim() });
      if (res.data.code === 200) {
        addToast("分类添加成功", "success");
        setNewCategoryName("");
        fetchCategories();
      } else {
        addToast(res.data.message || "添加失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("添加失败", "error");
    }
  };

  const handleAuditSpot = async (spotId: number, approved: boolean) => {
    if (!approved) {
      setRejectModal({ isOpen: true, spotId });
      return;
    }
    try {
      const res = await api.put(`/admin/tourism/spots/${spotId}/audit`, {
        approved: true,
        reason: "审核通过",
      });
      if (res.data.code === 200) {
        addToast("景点已通过审核", "success");
        fetchPendingSpots();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const handleRejectSpot = async () => {
    if (!rejectModal.spotId) return;
    try {
      const res = await api.put(`/admin/tourism/spots/${rejectModal.spotId}/audit`, {
        approved: false,
        reason: rejectReason || "信息不完善，请补充后重新提交",
      });
      if (res.data.code === 200) {
        addToast("景点已拒绝", "success");
        setRejectModal({ isOpen: false, spotId: null });
        setRejectReason("");
        fetchPendingSpots();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const handleReviewLoan = async (loanId: number, approved: boolean) => {
    try {
      const res = await api.put(`/finance/loan-applications/${loanId}/review`, {
        approved,
        remark: approved ? "审核通过" : "条件不满足，暂时无法通过",
      });
      if (res.data.code === 200) {
        addToast(approved ? "贷款申请已通过" : "贷款申请已拒绝", "success");
        fetchPendingLoans();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const handleReviewClaim = async (claimId: number, approved: boolean) => {
    try {
      const res = await api.put(`/finance/claims/${claimId}/review`, {
        approved,
        remark: approved ? "理赔审核通过" : "不符合理赔条件",
      });
      if (res.data.code === 200) {
        addToast(approved ? "理赔已通过" : "理赔已拒绝", "success");
        fetchPendingClaims();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put("/users/profile", editForm);
      if (res.data.code === 200) {
        addToast("修改成功", "success");
        if (userInfo) {
          login(localStorage.getItem("token") || "", { ...userInfo, ...editForm });
        }
      } else {
        addToast(res.data.message || "修改失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("修改失败", "error");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast("两次新密码不一致", "error");
      return;
    }
    try {
      const res = await api.put("/users/password", passwordForm);
      if (res.data.code === 200) {
        addToast("密码修改成功，请重新登录", "success");
        logout();
        navigate("/login");
      } else {
        addToast(res.data.message || "修改失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("修改失败", "error");
    }
  };

  if (!userInfo) return null;

  const getTypeLabel = (type: string) => SPOT_TYPES.find(t => t.value === type)?.label || type;

  // Build sidebar tabs based on role
  const tabs: { key: string; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "个人概览", icon: User },
  ];

  // Orders & Bookings & Favorites: only for consumers (TOURIST/FARMER/MERCHANT)
  if (isConsumer) {
    tabs.push({ key: "orders", label: "我的订单", icon: ShoppingBag });
    tabs.push({ key: "bookings", label: "我的预约", icon: Ticket });
    tabs.push({ key: "favorites", label: "我的收藏", icon: Heart });
  }

  // Address management for all logged-in users
  tabs.push({ key: "addresses", label: "地址管理", icon: MapPin });

  // Admin-only management tabs
  if (isAdmin) {
    tabs.push({ key: "categories", label: "商品分类管理", icon: List });
    tabs.push({ key: "spotAudit", label: "景点审核", icon: ClipboardList });
    tabs.push({ key: "loanReview", label: "贷款审核", icon: Landmark });
    tabs.push({ key: "claimReview", label: "理赔审核", icon: ShieldCheck });
  }

  // User management link for admin
  if (isAdmin) {
    tabs.push({ key: "userMgmt", label: "用户管理", icon: Users });
  }

  // Settings & Security for all
  tabs.push({ key: "settings", label: "账号设置", icon: Settings });
  tabs.push({ key: "security", label: "安全中心", icon: Lock });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("settings")}
          className="group relative w-20 h-20 rounded-full overflow-hidden bg-green-100 text-green-600 text-2xl font-bold shrink-0 cursor-pointer"
          title="点击修改头像"
        >
          {userInfo.avatar ? (
            <img src={userInfo.avatar} alt="avatar" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex items-center justify-center w-full h-full transition-transform duration-200 group-hover:scale-110">
              {userInfo.nickname[0]}
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{userInfo.nickname}</h1>
          <p className="text-gray-500">@{userInfo.username}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {userInfo.role === "ADMIN" && "管理员"}
            {userInfo.role === "FARMER" && "认证农户"}
            {userInfo.role === "MERCHANT" && "商家"}
            {userInfo.role === "TOURIST" && "普通用户"}
            {userInfo.role === "FINANCIAL_PROVIDER" && "金融服务商"}
            {userInfo.role === "INSURANCE_PROVIDER" && "保险服务商"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === "userMgmt") {
                  navigate("/admin/users");
                  return;
                }
                setActiveTab(tab.key);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-green-50 text-green-700"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {isAdmin ? "管理面板" : "我的服务"}
              </h2>
              {isAdmin ? (
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setActiveTab("spotAudit")}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">景点审核</h3>
                    <p className="text-sm text-gray-500 mt-1">审核商户提交的景点</p>
                  </div>
                  <div
                    className="p-4 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setActiveTab("loanReview")}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">贷款审核</h3>
                    <p className="text-sm text-gray-500 mt-1">审核农户贷款申请</p>
                  </div>
                  <div
                    className="p-4 bg-green-50 rounded-xl border border-green-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setActiveTab("claimReview")}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">理赔审核</h3>
                    <p className="text-sm text-gray-500 mt-1">审核保险理赔申请</p>
                  </div>
                  <div
                    className="p-4 bg-orange-50 rounded-xl border border-orange-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setActiveTab("categories")}
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-3">
                      <List className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">分类管理</h3>
                    <p className="text-sm text-gray-500 mt-1">管理商品分类</p>
                  </div>
                </div>
              ) : isFarmerOrMerchant ? (
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate("/finance", { state: { tab: "myPolicies" } })}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">我的保险</h3>
                    <p className="text-sm text-gray-500 mt-1">查看已投保的农业保险</p>
                  </div>
                  <div
                    className="p-4 bg-purple-50 rounded-xl border border-purple-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate("/finance", { state: { tab: "myLoanApps" } })}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">我的贷款</h3>
                    <p className="text-sm text-gray-500 mt-1">管理当前的贷款申请</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>欢迎使用乡村振兴管理系统</p>
                </div>
              )}
            </div>
          )}

          {/* Orders - only for consumers */}
          {activeTab === "orders" && isConsumer && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">我的订单</h2>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无订单</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                      <span className="text-sm text-gray-500">订单号: {order.id}</span>
                      <span className={`text-sm font-medium ${
                        order.status === "COMPLETED" ? "text-green-600" : "text-orange-600"
                      }`}>
                        {order.status === "COMPLETED" ? "已完成" : "待支付"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.productName}</h4>
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-xs text-gray-400">{order.createdAt}</span>
                      <div className="text-sm">
                        共 {order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} 件商品，
                        实付 <span className="font-bold text-red-600 text-lg">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* My Bookings */}
          {activeTab === "bookings" && isConsumer && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-600" />
                我的预约
              </h2>
              {bookingsLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无预约记录</div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{booking.spotName || "景点预约"}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{booking.ticketName}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                        booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        booking.status === "PENDING_PAYMENT" ? "bg-yellow-100 text-yellow-700" :
                        booking.status === "USED" ? "bg-blue-100 text-blue-700" :
                        booking.status === "COMPLETED" ? "bg-gray-100 text-gray-700" :
                        booking.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {booking.status === "PENDING_PAYMENT" ? "待支付" :
                         booking.status === "CONFIRMED" ? "已确认" :
                         booking.status === "USED" ? "已使用" :
                         booking.status === "COMPLETED" ? "已完成" :
                         booking.status === "CANCELLED" ? "已取消" : booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {booking.bookingCode && (
                        <div>
                          <span className="text-gray-500">预约码：</span>
                          <span className="font-mono font-bold text-orange-600">{booking.bookingCode}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">数量：</span>
                        <span className="text-gray-900">{booking.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">金额：</span>
                        <span className="font-bold text-red-600">{formatCurrency(booking.totalAmount || 0)}</span>
                      </div>
                      {booking.ticketCategory === "ROOM" ? (
                        <div>
                          <span className="text-gray-500">入住：</span>
                          <span className="text-gray-900">{booking.checkIn} ~ {booking.checkOut}</span>
                        </div>
                      ) : booking.visitDate && (
                        <div>
                          <span className="text-gray-500">日期：</span>
                          <span className="text-gray-900">{booking.visitDate}</span>
                        </div>
                      )}
                    </div>
                    {booking.contactName && (
                      <p className="text-xs text-gray-500">联系人：{booking.contactName} {booking.contactPhone}</p>
                    )}
                    {booking.status === "PENDING_PAYMENT" && (
                      <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                        >
                          取消预约
                        </button>
                        <button
                          onClick={() => handlePayBooking(booking.id)}
                          className="flex items-center gap-1 px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                        >
                          <CreditCard className="w-4 h-4" />
                          立即支付
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Favorites */}
          {activeTab === "favorites" && isConsumer && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                我的收藏
              </h2>
              {favoritesLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无收藏</p>
                  <button
                    onClick={() => navigate("/tourism")}
                    className="mt-3 text-sm text-orange-600 font-medium hover:text-orange-700"
                  >
                    去发现精彩景点 →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                      onClick={() => navigate(`/tourism/${fav.spotId || fav.id}`)}
                    >
                      <div className="h-32 bg-gray-100 relative">
                        <img
                          src={fav.coverImage || fav.spotCoverImage || "https://picsum.photos/seed/spot/400/200"}
                          alt={fav.spotName || fav.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(fav.spotId || fav.id); }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                          title="取消收藏"
                        >
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {fav.spotName || fav.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {fav.address && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{fav.address}
                            </span>
                          )}
                          {(fav.rating || fav.spotRating) && (
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {fav.rating || fav.spotRating}
                            </span>
                          )}
                        </div>
                        {fav.price > 0 && (
                          <p className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(fav.price)} 起</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Address Management */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  {isFarmerOrMerchant ? "地址管理（收货/发货）" : "收货地址"}
                </h2>
                <button
                  onClick={() => openAddressModal()}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  新增地址
                </button>
              </div>
              {addressesLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无地址，点击上方添加</div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`border rounded-xl p-4 hover:shadow-sm transition-shadow ${addr.isDefault ? "border-green-200 bg-green-50/50" : "border-gray-100"}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{addr.receiverName}</span>
                            <span className="text-sm text-gray-500">{addr.receiverPhone}</span>
                            {addr.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">默认</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {addr.fullAddress || `${addr.province}${addr.city}${addr.district}${addr.detail}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              设为默认
                            </button>
                          )}
                          <button
                            onClick={() => openAddressModal(addr)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Management - Admin */}
          {activeTab === "categories" && isAdmin && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <List className="w-5 h-5 text-green-600" />
                商品分类管理
              </h2>

              <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="输入新分类名称..."
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加分类
                </button>
              </form>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center bg-gray-50 hover:bg-green-50 hover:border-green-100 transition-colors group">
                    <span className="font-medium text-gray-700 group-hover:text-green-700">{cat.name}</span>
                    <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">ID: {cat.id}</span>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    暂无分类数据
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spot Audit - Admin */}
          {activeTab === "spotAudit" && isAdmin && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                待审核景点
              </h2>
              {auditLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : pendingSpots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无待审核景点</div>
              ) : (
                <div className="space-y-4">
                  {pendingSpots.map(spot => (
                    <div key={spot.id} className="border border-gray-100 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">{spot.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{getTypeLabel(spot.type)}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{spot.address}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{spot.description}</p>
                      {spot.startDate && (
                        <p className="text-xs text-gray-500">开放日期：{spot.startDate} ~ {spot.endDate || "长期"}</p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleAuditSpot(spot.id, false)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                        <button
                          onClick={() => handleAuditSpot(spot.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => navigate(`/tourism/${spot.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loan Review - Admin */}
          {activeTab === "loanReview" && isAdmin && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-600" />
                待审核贷款申请
              </h2>
              {loanReviewLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : pendingLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无待审核贷款申请</div>
              ) : (
                <div className="space-y-4">
                  {pendingLoans.map(loan => (
                    <div key={loan.id} className="border border-gray-100 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">{loan.applicantName || "申请人"}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            申请产品：{loan.productName} · 金额：{formatCurrency(loan.amount)}
                          </p>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">用途：</span>
                          <span className="text-gray-900">{loan.purpose || "-"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">期限：</span>
                          <span className="text-gray-900">{loan.termMonths || "-"} 个月</span>
                        </div>
                        <div>
                          <span className="text-gray-500">信用分：</span>
                          <span className="text-gray-900">{loan.creditScore || "-"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleReviewLoan(loan.id, false)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                        <button
                          onClick={() => handleReviewLoan(loan.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          通过
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insurance Claim Review - Admin */}
          {activeTab === "claimReview" && isAdmin && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                待审核理赔申请
              </h2>
              {claimReviewLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : pendingClaims.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无待审核理赔</div>
              ) : (
                <div className="space-y-4">
                  {pendingClaims.map(claim => (
                    <div key={claim.id} className="border border-gray-100 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">{claim.claimantName || "申请人"}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            保单号：{claim.policyId} · 索赔金额：{formatCurrency(claim.claimAmount)}
                          </p>
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">出险描述：</span>
                        <span className="text-gray-900">{claim.description || "-"}</span>
                      </div>
                      {claim.incidentDate && (
                        <p className="text-xs text-gray-500">出险日期：{claim.incidentDate}</p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleReviewClaim(claim.id, false)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                        <button
                          onClick={() => handleReviewClaim(claim.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          通过
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                编辑资料
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
                  <ImageUpload
                    value={editForm.avatar}
                    onChange={(url) => setEditForm({ ...editForm, avatar: url })}
                    placeholder="上传头像图片"
                    showCacheOptions
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  保存修改
                </button>
              </form>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                修改密码
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    required
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  修改密码
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title={editingAddressId ? "编辑地址" : "新增地址"}>
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">收货人</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={addressForm.receiverName} onChange={e => setAddressForm({...addressForm, receiverName: e.target.value})} placeholder="姓名" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={addressForm.receiverPhone} onChange={e => setAddressForm({...addressForm, receiverPhone: e.target.value})} placeholder="手机号" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={addressForm.province} onChange={e => setAddressForm({...addressForm, province: e.target.value})} placeholder="如：山东省" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="如：烟台市" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区/县</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} placeholder="如：芝罘区" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={addressForm.detail} onChange={e => setAddressForm({...addressForm, detail: e.target.value})} placeholder="街道、门牌号等" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="addrDefault" checked={addressForm.isDefault}
              onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})}
              className="w-4 h-4 text-green-600 border-gray-300 rounded" />
            <label htmlFor="addrDefault" className="text-sm text-gray-700">设为默认地址</label>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingAddressId ? "保存修改" : "添加地址"}</button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={rejectModal.isOpen} onClose={() => setRejectModal({ isOpen: false, spotId: null })} title="拒绝原因">
        <div className="space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3"
            rows={3}
            placeholder="请输入拒绝原因..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRejectModal({ isOpen: false, spotId: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={handleRejectSpot} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">确认拒绝</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
