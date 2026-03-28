import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import {
  ArrowLeft, MapPin, Star, Heart, Eye, Clock, Phone, Calendar,
  Send, Ticket, User, ChevronDown, ChevronUp, Edit, Trash2, Plus, Power,
  CreditCard, Check, ShoppingBag
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { ImageUpload } from "../components/ui/ImageUpload";
import { motion } from "motion/react";

const SPOT_TYPES: Record<string, string> = {
  PICKING_GARDEN: "采摘园",
  FARMSTAY: "农家乐",
  ECO_PARK: "生态公园",
  FOLK_EXPERIENCE: "民俗体验",
  SCENIC_SPOT: "风景区",
};

const SPOT_TYPE_OPTIONS = Object.entries(SPOT_TYPES).map(([value, label]) => ({ value, label }));

export default function TourismDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const { addToast } = useToast();

  const [spot, setSpot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [newReview, setNewReview] = useState({ content: "", rating: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tickets & Booking
  const [tickets, setTickets] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    quantity: 1,
    visitDate: "",
    checkIn: "",
    checkOut: "",
    contactName: "",
    contactPhone: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Edit Spot
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", type: "PICKING_GARDEN", address: "", description: "",
    coverImage: "", price: "", openTime: "", contactPhone: "",
    startDate: "", endDate: ""
  });

  // Add Ticket
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: "", category: "TICKET", price: "", dailyQuota: "", description: ""
  });

  // Payment Modal (after booking created)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Confirm
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false, title: "", onConfirm: () => {}
  });

  // Admin Audit
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [auditing, setAuditing] = useState(false);

  // Expand description
  const [descExpanded, setDescExpanded] = useState(false);

  // eslint-disable-next-line eqeqeq
  const isOwner = userInfo && spot && (
    userInfo.id == spot.creatorId ||
    userInfo.id == spot.ownerId ||
    userInfo.id == spot.userId ||
    userInfo.id == spot.merchantId ||
    userInfo.id == spot.farmerId ||
    (spot.creator && userInfo.id == spot.creator.id) ||
    (spot.owner && userInfo.id == spot.owner.id) ||
    (spot.user && userInfo.id == spot.user.id)
  );
  const isAdmin = userInfo?.role === "ADMIN";
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    fetchSpot();
    fetchReviews(1);
    fetchTickets();
    if (userInfo) fetchFavoriteStatus();
  }, [id]);

  const fetchFavoriteStatus = async () => {
    try {
      const res = await api.get("/tourism/favorites?page=1&size=100");
      const favorites = res.data?.data?.records || res.data?.data || [];
      const isFav = favorites.some((f: any) => f.spotId === parseInt(id as string) || f.id === parseInt(id as string));
      setIsFavorited(isFav);
    } catch {
      // Favorites API may not be available, ignore
    }
  };

  const fetchSpot = async () => {
    try {
      const res = await api.get(`/tourism/spots/${id}`);
      const data = res.data?.data;
      setSpot(data);
      if (data) {
        setEditForm({
          title: data.title || data.name || "", type: data.type || "PICKING_GARDEN",
          address: data.address || "", description: data.description || "",
          coverImage: data.coverImage || "", price: data.price || "",
          openTime: data.openTime || "", contactPhone: data.contactPhone || "",
          startDate: data.startDate || "", endDate: data.endDate || ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page: number) => {
    try {
      const res = await api.get(`/tourism/spots/${id}/reviews?page=${page}&size=10`);
      const data = res.data?.data;
      if (data?.records) {
        setReviews(page === 1 ? data.records : [...reviews, ...data.records]);
        setReviewTotal(data.total || 0);
        setReviewPage(page);
      } else if (Array.isArray(data)) {
        setReviews(data);
        setReviewTotal(data.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get(`/tourism/spots/${id}/tickets`);
      setTickets(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!userInfo) { addToast("请先登录", "error"); return; }
    try {
      const res = await api.post(`/tourism/spots/${id}/favorite`);
      if (res.data.code === 200) {
        const wasFavorited = isFavorited;
        setIsFavorited(!wasFavorited);
        setSpot((prev: any) => prev ? {
          ...prev,
          favoriteCount: Math.max(0, (prev.favoriteCount || 0) + (wasFavorited ? -1 : 1)),
        } : prev);
        addToast(wasFavorited ? "已取消收藏" : "已收藏", "success");
      }
    } catch (err) { addToast("操作失败", "error"); }
  };

  // --- Owner / Admin Actions ---

  const handleEditSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/tourism/spots/${id}`, {
        ...editForm,
        price: editForm.price ? parseFloat(editForm.price as string) : 0,
      });
      if (res.data.code === 200) {
        addToast("景点信息已更新", "success");
        setShowEditModal(false);
        fetchSpot();
      } else {
        addToast(res.data.message || "修改失败", "error");
      }
    } catch (err) { addToast("修改失败", "error"); }
  };

  const handleDeleteSpot = () => {
    setConfirmDialog({
      isOpen: true,
      title: "确定要删除该景点吗？此操作不可撤销。",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/tourism/spots/${id}`);
          if (res.data.code === 200) {
            addToast("景点已删除", "success");
            navigate("/tourism");
          } else { addToast(res.data.message || "删除失败", "error"); }
        } catch (err) { addToast("删除失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleSpotStatus = () => {
    const isOnline = spot.status === "APPROVED";
    setConfirmDialog({
      isOpen: true,
      title: isOnline ? "确定要下架该景点吗？下架后游客将无法浏览。" : "确定要重新上架该景点吗？",
      onConfirm: async () => {
        try {
          const endpoint = isOnline
            ? `/tourism/spots/${id}/offline`
            : `/tourism/spots/${id}/online`;
          const res = await api.put(endpoint);
          if (res.data.code === 200) {
            addToast(isOnline ? "景点已下架" : "景点已上架", "success");
            fetchSpot();
          } else { addToast(res.data.message || "操作失败", "error"); }
        } catch (err) { addToast("操作失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleTicketStatus = (ticketId: number, currentStatus: string) => {
    const isActive = currentStatus === "ACTIVE" || !currentStatus;
    setConfirmDialog({
      isOpen: true,
      title: isActive ? "确定要下架该票型吗？" : "确定要重新上架该票型吗？",
      onConfirm: async () => {
        try {
          const endpoint = isActive
            ? `/tourism/spots/${id}/tickets/${ticketId}/offline`
            : `/tourism/spots/${id}/tickets/${ticketId}/online`;
          const res = await api.put(endpoint);
          if (res.data.code === 200) {
            addToast(isActive ? "票型已下架" : "票型已上架", "success");
            fetchTickets();
          } else { addToast(res.data.message || "操作失败", "error"); }
        } catch (err) { addToast("操作失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/tourism/spots/${id}/tickets`, {
        ...newTicket,
        price: parseFloat(newTicket.price as string),
        dailyQuota: parseInt(newTicket.dailyQuota as string),
      });
      if (res.data.code === 200) {
        addToast("票型添加成功", "success");
        setShowAddTicketModal(false);
        setNewTicket({ name: "", category: "TICKET", price: "", dailyQuota: "", description: "" });
        fetchTickets();
      } else { addToast(res.data.message || "添加失败", "error"); }
    } catch (err) { addToast("添加失败", "error"); }
  };

  const handleDeleteTicket = (ticketId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "确定删除该票型？",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/tourism/spots/${id}/tickets/${ticketId}`);
          if (res.data.code === 200) {
            addToast("票型已删除", "success");
            fetchTickets();
          } else { addToast(res.data.message || "删除失败", "error"); }
        } catch (err) { addToast("删除失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Admin Audit ---

  const handleApproveSpot = async () => {
    setAuditing(true);
    try {
      const res = await api.put(`/admin/tourism/spots/${id}/audit`, {
        approved: true,
        reason: "审核通过",
      });
      if (res.data.code === 200) {
        addToast("景点审核已通过", "success");
        fetchSpot();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    } finally {
      setAuditing(false);
    }
  };

  const handleRejectSpot = async () => {
    setAuditing(true);
    try {
      const res = await api.put(`/admin/tourism/spots/${id}/audit`, {
        approved: false,
        reason: rejectReason || "信息不完善，请补充后重新提交",
      });
      if (res.data.code === 200) {
        addToast("景点已被拒绝", "success");
        setShowRejectModal(false);
        setRejectReason("");
        fetchSpot();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      addToast("操作失败", "error");
    } finally {
      setAuditing(false);
    }
  };

  // --- Reviews ---

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo) { addToast("请先登录", "error"); return; }
    if (!newReview.content.trim()) { addToast("请输入评论内容", "error"); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post(`/tourism/spots/${id}/reviews`, {
        content: newReview.content, rating: newReview.rating,
      });
      if (res.data.code === 200) {
        addToast("评论发布成功", "success");
        setNewReview({ content: "", rating: 5 });
        fetchReviews(1);
        fetchSpot();
      } else { addToast(res.data.message || "评论失败", "error"); }
    } catch (err) { addToast("评论失败", "error"); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const res = await api.delete(`/tourism/reviews/${reviewId}`);
      if (res.data.code === 200) { addToast("评论已删除", "success"); fetchReviews(1); }
    } catch (err) { addToast("删除失败", "error"); }
  };

  // --- Booking ---

  const openBooking = (ticket: any) => {
    if (!userInfo) { addToast("请先登录", "error"); return; }
    setSelectedTicket(ticket);
    setBookingForm({
      quantity: 1, visitDate: "", checkIn: "", checkOut: "",
      contactName: userInfo.nickname || "", contactPhone: "",
    });
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    // Date validation: prevent past dates
    const today = new Date().toISOString().split("T")[0];
    if (selectedTicket.category === "ROOM") {
      if (bookingForm.checkIn < today) {
        setConfirmDialog({ isOpen: true, title: "入住日期不能早于今天，请重新选择日期。", onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })) });
        return;
      }
      if (bookingForm.checkOut <= bookingForm.checkIn) {
        setConfirmDialog({ isOpen: true, title: "退房日期必须晚于入住日期，请重新选择。", onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })) });
        return;
      }
    } else {
      if (bookingForm.visitDate < today) {
        setConfirmDialog({ isOpen: true, title: "游玩日期不能早于今天，请重新选择日期。", onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })) });
        return;
      }
    }

    setSubmittingBooking(true);
    try {
      const payload: any = {
        ticketId: selectedTicket.id, quantity: bookingForm.quantity,
        contactName: bookingForm.contactName, contactPhone: bookingForm.contactPhone,
      };
      if (selectedTicket.category === "ROOM") {
        payload.checkIn = bookingForm.checkIn;
        payload.checkOut = bookingForm.checkOut;
      } else {
        payload.visitDate = bookingForm.visitDate;
      }
      const res = await api.post("/tourism/bookings", payload);
      if (res.data.code === 200) {
        const bookingData = res.data?.data;
        setShowBookingModal(false);
        if (bookingData?.id) {
          setPendingBooking({
            ...bookingData,
            ticketName: selectedTicket.name,
            ticketCategory: selectedTicket.category,
            unitPrice: selectedTicket.price,
            quantity: bookingForm.quantity,
            totalAmount: selectedTicket.price * bookingForm.quantity * (selectedTicket.category === "ROOM" && bookingForm.checkIn && bookingForm.checkOut
              ? Math.max(1, Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / 86400000))
              : 1),
            visitDate: bookingForm.visitDate,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
            spotName: spot?.title || spot?.name,
          });
          setPaymentSuccess(false);
          setShowPaymentModal(true);
        } else {
          addToast("预约成功！请到个人中心-我的预约中完成支付", "success");
        }
      } else { addToast(res.data.message || "预约失败", "error"); }
    } catch (err) { addToast("预约失败", "error"); }
    finally { setSubmittingBooking(false); }
  };

  const handlePayBooking = async () => {
    if (!pendingBooking?.id) return;
    setPaymentLoading(true);
    try {
      const payRes = await api.put(`/tourism/bookings/${pendingBooking.id}/pay`);
      if (payRes.data.code === 200) {
        setPaymentSuccess(true);
      } else {
        addToast(payRes.data.message || "支付失败", "error");
      }
    } catch {
      addToast("支付失败，请稍后重试", "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!spot) return <div className="p-8 text-center">景点未找到</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={handleDeleteSpot}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </>
          )}
          <button
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isFavorited ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500' : ''}`} />
            {isFavorited ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>

      {/* Status Banner for owner/admin: shows status + management actions */}
      {canManage && spot.status && (
        <div className={`rounded-xl p-4 text-sm font-medium ${
          spot.status === "APPROVED" ? 'bg-green-50 text-green-700 border border-green-100' :
          spot.status === "PENDING" ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
          spot.status === "REJECTED" ? 'bg-red-50 text-red-700 border border-red-100' :
          spot.status === "OFFLINE" ? 'bg-gray-100 text-gray-600 border border-gray-200' :
          'bg-gray-50 text-gray-700 border border-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              当前状态：{
                spot.status === "APPROVED" ? "已上架" :
                spot.status === "PENDING" ? "待审核" :
                spot.status === "REJECTED" ? "已拒绝" :
                spot.status === "OFFLINE" ? "已下架" : spot.status
              }
            </div>
            <div className="flex items-center gap-2">
              {/* Admin audit actions for PENDING spots */}
              {isAdmin && spot.status === "PENDING" && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={auditing}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    拒绝
                  </button>
                  <button
                    onClick={handleApproveSpot}
                    disabled={auditing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {auditing ? "处理中..." : "通过审核"}
                  </button>
                </>
              )}
              {/* Offline/Online toggle for APPROVED or OFFLINE spots */}
              {(spot.status === "APPROVED" || spot.status === "OFFLINE") && (
                <button
                  onClick={handleToggleSpotStatus}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    spot.status === "APPROVED"
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300"
                      : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {spot.status === "APPROVED" ? "下架景点" : "重新上架"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
        <img src={spot.coverImage} alt={spot.title || spot.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium">
          {SPOT_TYPES[spot.type] || spot.type}
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-gray-900 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {(spot.averageRating || spot.rating || (reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 5))}
            {(spot.reviewCount || reviews.length) > 0 && (
              <span className="text-xs text-gray-500 font-normal ml-0.5">({spot.reviewCount || reviews.length}评)</span>
            )}
          </div>
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-gray-700 flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {spot.viewCount || 0} 浏览
          </div>
          {(spot.favoriteCount > 0 || isFavorited) && (
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-gray-700 flex items-center gap-1">
              <Heart className={`w-4 h-4 ${isFavorited ? 'text-red-500 fill-red-500' : ''}`} />
              {spot.favoriteCount || 0} 收藏
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{spot.title || spot.name}</h1>
          <div>
            {spot.price > 0 ? (
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(spot.price)}</span>
                <span className="text-xs text-gray-500 ml-1">起</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-green-600">免费开放</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{spot.address}</div>
          {spot.openTime && <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{spot.openTime}</div>}
          {spot.contactPhone && <div className="flex items-center gap-1"><Phone className="w-4 h-4" />{spot.contactPhone}</div>}
        </div>
        <div className="relative">
          <p className={`text-gray-600 leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>{spot.description}</p>
          {spot.description && spot.description.length > 150 && (
            <button onClick={() => setDescExpanded(!descExpanded)} className="text-orange-600 text-sm font-medium mt-1 flex items-center gap-1">
              {descExpanded ? '收起' : '展开全部'}
              {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-orange-600" />
            票型选择
          </h2>
          {canManage && (
            <button
              onClick={() => setShowAddTicketModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100"
            >
              <Plus className="w-4 h-4" />
              添加票型
            </button>
          )}
        </div>
        {tickets.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            {canManage ? "暂无票型，点击上方按钮添加" : "暂无在线票型"}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <div key={ticket.id} className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                ticket.status === "OFFLINE" ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-100 hover:border-orange-200"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{ticket.name}</h4>
                    {ticket.status === "OFFLINE" && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">已下架</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {ticket.category === "ROOM" ? "住宿" : "门票"}
                    {ticket.description && ` · ${ticket.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(ticket.price)}</div>
                    {ticket.remainingQuota !== undefined && (
                      <div className="text-xs text-gray-400">余 {ticket.remainingQuota}</div>
                    )}
                  </div>
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleToggleTicketStatus(ticket.id, ticket.status)}
                        className={`p-1.5 rounded-lg text-xs font-medium ${
                          ticket.status === "OFFLINE"
                            ? "text-green-600 hover:bg-green-50"
                            : "text-yellow-600 hover:bg-yellow-50"
                        }`}
                        title={ticket.status === "OFFLINE" ? "上架" : "下架"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTicket(ticket.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {ticket.status !== "OFFLINE" && userInfo?.role !== "ADMIN" && (
                    <button onClick={() => openBooking(ticket)} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                      预订
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No tickets fallback */}
      {tickets.length === 0 && spot.price > 0 && !canManage && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 mb-3">暂无在线票型，请联系景点预约</p>
          {spot.contactPhone && (
            <a href={`tel:${spot.contactPhone}`} className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors">
              <Phone className="w-5 h-5" />
              拨打电话预约
            </a>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">游客评价 ({reviewTotal})</h2>
        {userInfo && userInfo.role !== "ADMIN" && (
          <form onSubmit={handleSubmitReview} className="mb-6 space-y-3 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">评分：</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })}>
                    <Star className={`w-5 h-5 transition-colors ${star <= newReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newReview.content} onChange={e => setNewReview({ ...newReview, content: e.target.value })}
                placeholder="分享你的体验..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              <button type="submit" disabled={submittingReview}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 transition-colors flex items-center gap-1">
                <Send className="w-4 h-4" />发布
              </button>
            </div>
          </form>
        )}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">暂无评价</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-bold shrink-0">
                  {review.nickname?.[0] || <User className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{review.nickname || "匿名用户"}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= (review.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{review.createdAt}</span>
                      {(userInfo?.id === review.userId || isAdmin) && (
                        <button onClick={() => handleDeleteReview(review.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{review.content}</p>
                </div>
              </motion.div>
            ))}
            {reviews.length < reviewTotal && (
              <button onClick={() => fetchReviews(reviewPage + 1)} className="w-full py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors">
                加载更多评价
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Spot Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="编辑景点">
        <form onSubmit={handleEditSpot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">景点名称</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                {SPOT_TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">票价</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开放起始日期</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开放截止日期</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.endDate} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每日开放时间</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.openTime} onChange={e => setEditForm({...editForm, openTime: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.contactPhone} onChange={e => setEditForm({...editForm, contactPhone: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
            <ImageUpload
              value={editForm.coverImage}
              onChange={(url) => setEditForm({...editForm, coverImage: url})}
              placeholder="上传景点封面图"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea required className="w-full border border-gray-300 rounded-lg p-2" rows={4}
              value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">保存修改</button>
          </div>
        </form>
      </Modal>

      {/* Add Ticket Modal */}
      <Modal isOpen={showAddTicketModal} onClose={() => setShowAddTicketModal(false)} title="添加票型">
        <form onSubmit={handleAddTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">票型名称</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={newTicket.name} onChange={e => setNewTicket({...newTicket, name: e.target.value})} placeholder="如：成人票、亲子套票" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}>
                <option value="TICKET">门票</option>
                <option value="ROOM">住宿</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单价</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={newTicket.price} onChange={e => setNewTicket({...newTicket, price: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">每日限额</label>
            <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
              value={newTicket.dailyQuota} onChange={e => setNewTicket({...newTicket, dailyQuota: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述 (可选)</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2"
              value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setShowAddTicketModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">添加</button>
          </div>
        </form>
      </Modal>

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title={`预订 - ${selectedTicket?.name || ''}`}>
        <form onSubmit={handleSubmitBooking} className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">单价</span>
              <span className="font-bold text-orange-600">{formatCurrency(selectedTicket?.price || 0)}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
            <div className="flex items-center border border-gray-300 rounded-lg w-fit">
              <button type="button" onClick={() => setBookingForm({...bookingForm, quantity: Math.max(1, bookingForm.quantity - 1)})} className="px-3 py-1 hover:bg-gray-50 text-gray-600">-</button>
              <span className="px-4 py-1 border-x border-gray-300 min-w-[40px] text-center">{bookingForm.quantity}</span>
              <button type="button" onClick={() => setBookingForm({...bookingForm, quantity: bookingForm.quantity + 1})} className="px-3 py-1 hover:bg-gray-50 text-gray-600">+</button>
            </div>
          </div>
          {selectedTicket?.category === "ROOM" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入住日期</label>
                <input type="date" required min={new Date().toISOString().split("T")[0]} className="w-full border border-gray-300 rounded-lg p-2" value={bookingForm.checkIn} onChange={e => setBookingForm({...bookingForm, checkIn: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退房日期</label>
                <input type="date" required min={bookingForm.checkIn || new Date().toISOString().split("T")[0]} className="w-full border border-gray-300 rounded-lg p-2" value={bookingForm.checkOut} onChange={e => setBookingForm({...bookingForm, checkOut: e.target.value})} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">游玩日期</label>
              <input type="date" required min={new Date().toISOString().split("T")[0]} className="w-full border border-gray-300 rounded-lg p-2" value={bookingForm.visitDate} onChange={e => setBookingForm({...bookingForm, visitDate: e.target.value})} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2" value={bookingForm.contactName} onChange={e => setBookingForm({...bookingForm, contactName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2" value={bookingForm.contactPhone} onChange={e => setBookingForm({...bookingForm, contactPhone: e.target.value})} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-gray-600">合计</span>
            <span className="text-xl font-bold text-orange-600">{formatCurrency((selectedTicket?.price || 0) * bookingForm.quantity)}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" disabled={submittingBooking} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 font-medium flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />{submittingBooking ? "提交中..." : "确认预订"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Booking Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          if (!paymentLoading) {
            setShowPaymentModal(false);
            setPendingBooking(null);
            setPaymentSuccess(false);
          }
        }}
        title={paymentSuccess ? "支付成功" : "订单支付"}
      >
        {paymentSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">支付成功</h3>
              <p className="text-sm text-gray-500 mt-1">您的预约已确认，祝您旅途愉快！</p>
            </div>
            {pendingBooking?.bookingCode && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-xs text-gray-500">预约码</p>
                <p className="text-xl font-bold text-green-700 tracking-widest">{pendingBooking.bookingCode}</p>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowPaymentModal(false); setPendingBooking(null); setPaymentSuccess(false); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                继续浏览
              </button>
              <button
                onClick={() => { setShowPaymentModal(false); setPendingBooking(null); setPaymentSuccess(false); navigate("/profile"); }}
                className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-4 h-4" />
                查看我的预约
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Booking Summary */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-gray-900">{pendingBooking?.spotName}</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{pendingBooking?.ticketName}</span>
                <span className="text-gray-500">x{pendingBooking?.quantity}</span>
              </div>
              {pendingBooking?.visitDate && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  游玩日期：{pendingBooking.visitDate}
                </div>
              )}
              {pendingBooking?.checkIn && pendingBooking?.checkOut && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  住宿：{pendingBooking.checkIn} ~ {pendingBooking.checkOut}
                </div>
              )}
              {pendingBooking?.bookingCode && (
                <div className="text-xs text-gray-500">预约码：{pendingBooking.bookingCode}</div>
              )}
            </div>

            {/* Total Amount */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-600 font-medium">应付金额</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(pendingBooking?.totalAmount || (pendingBooking?.unitPrice * pendingBooking?.quantity) || 0)}
              </span>
            </div>

            {/* Simulated Payment Methods */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">选择支付方式</p>
              {[
                { name: "支付宝", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                { name: "微信支付", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
                { name: "银行卡支付", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
              ].map((method, idx) => (
                <label key={method.name} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors hover:${method.bg} ${idx === 0 ? method.border + ' ' + method.bg : 'border-gray-100'}`}>
                  <input type="radio" name="payMethod" defaultChecked={idx === 0} className="w-4 h-4 text-orange-600" />
                  <CreditCard className={`w-5 h-5 ${method.color}`} />
                  <span className="text-sm font-medium text-gray-900">{method.name}</span>
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingBooking(null);
                  addToast("预约成功，可在个人中心-我的预约中完成支付", "info");
                }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                稍后支付
              </button>
              <button
                onClick={handlePayBooking}
                disabled={paymentLoading}
                className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 text-sm font-medium flex items-center justify-center gap-1"
              >
                <CreditCard className="w-4 h-4" />
                {paymentLoading ? "处理中..." : "确认支付"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <Modal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} title="确认操作">
        <div className="space-y-4">
          <p className="text-gray-600">{confirmDialog.title}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={confirmDialog.onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">确定</button>
          </div>
        </div>
      </Modal>

      {/* Reject Reason Modal (Admin Audit) */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="拒绝景点">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">请输入拒绝原因，该原因将发送给景点发布者：</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
            rows={3}
            placeholder="如：信息不完善，请补充后重新提交"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={handleRejectSpot} disabled={auditing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {auditing ? "处理中..." : "确认拒绝"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
