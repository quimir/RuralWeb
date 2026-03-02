import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { MapPin, Star, Calendar, Plus, X, Search, Check, XCircle, Eye } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { ImageUpload } from "../components/ui/ImageUpload";

const SPOT_TYPES = [
  { value: "PICKING_GARDEN", label: "采摘园" },
  { value: "FARMSTAY", label: "农家乐" },
  { value: "ECO_PARK", label: "生态公园" },
  { value: "FOLK_EXPERIENCE", label: "民俗体验" },
  { value: "SCENIC_SPOT", label: "风景区" },
];

export default function Tourism() {
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Search & Filter
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Publish Spot Modal
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [newSpot, setNewSpot] = useState({
    name: "",
    type: "PICKING_GARDEN",
    address: "",
    description: "",
    coverImage: "https://picsum.photos/seed/spot/800/600",
    price: "",
    openTime: "08:00-18:00",
    contactPhone: "",
    startDate: "",
    endDate: "",
  });

  // Featured Route
  const [featuredRoute, setFeaturedRoute] = useState<any>(null);

  // Admin Audit
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [pendingSpots, setPendingSpots] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchSpots = async () => {
    try {
      let url = "/tourism/spots?page=1&size=20";
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      const res = await api.get(url);
      setSpots(res.data?.data?.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
    fetchFeaturedRoute();
  }, [typeFilter]);

  const fetchFeaturedRoute = async () => {
    try {
      const res = await api.get("/tourism/routes/public?page=1&size=1");
      const routes = res.data?.data?.records || [];
      if (routes.length > 0) {
        setFeaturedRoute(routes[0]);
      }
    } catch {
      // Ignore - featured route is optional
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchSpots();
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...newSpot,
        price: newSpot.price ? parseFloat(newSpot.price) : 0,
      };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      const res = await api.post("/tourism/spots", payload);
      if (res.data.code === 200) {
        const isAdminUser = userInfo?.role === "ADMIN";
        addToast(isAdminUser ? "景点发布成功" : "景点发布成功，等待管理员审核", "success");
        setShowAddSpotModal(false);
        setNewSpot({
          name: "",
          type: "PICKING_GARDEN",
          address: "",
          description: "",
          coverImage: "https://picsum.photos/seed/spot/800/600",
          price: "",
          openTime: "08:00-18:00",
          contactPhone: "",
          startDate: "",
          endDate: "",
        });
        fetchSpots();
      } else {
        addToast(res.data.message || "发布失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("发布失败", "error");
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

  const handleAudit = async (spotId: number, approved: boolean) => {
    try {
      const res = await api.put(`/admin/tourism/spots/${spotId}/audit`, {
        approved,
        reason: approved ? "审核通过" : "信息不完善，请补充后重新提交",
      });
      if (res.data.code === 200) {
        addToast(approved ? "已通过审核" : "已拒绝", "success");
        fetchPendingSpots();
        fetchSpots();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("操作失败", "error");
    }
  };

  const getTypeLabel = (type: string) => {
    return SPOT_TYPES.find(t => t.value === type)?.label || type;
  };

  const canPublishSpot = userInfo && ["ADMIN", "MERCHANT", "FARMER"].includes(userInfo.role);
  const isAdmin = userInfo?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">乡村游推广</h1>
          <p className="text-sm text-gray-500 mt-1">发现美丽乡村，体验慢生活</p>
        </div>
        <div className="flex items-center gap-2">
          {canPublishSpot && (
            <button
              onClick={() => setShowAddSpotModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              发布景点
            </button>
          )}
        </div>
      </div>

      {/* Admin Audit Banner */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
             <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
             <span className="text-sm font-medium">管理员：查看待审核的景点信息</span>
          </div>
          <button
            onClick={() => { setShowAuditPanel(true); fetchPendingSpots(); }}
            className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50"
          >
            去审核
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索景点名称..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter("")}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === "" ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            全部
          </button>
          {SPOT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === t.value ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Route */}
      {featuredRoute && (
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
              热门推荐路线
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {featuredRoute.title}
            </h2>
            <p className="text-gray-600 text-sm">
              {featuredRoute.totalDays}天行程
              {featuredRoute.startDate && ` · 出发: ${featuredRoute.startDate}`}
              {featuredRoute.copyCount > 0 && ` · ${featuredRoute.copyCount}人引用`}
              {featuredRoute.creatorName && ` · by ${featuredRoute.creatorName}`}
            </p>
            <button
              onClick={() => navigate("/tourism/routes")}
              className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              查看路线详情
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-video md:aspect-auto md:h-40 rounded-xl overflow-hidden">
            <img
              src={featuredRoute.coverImage || "https://picsum.photos/seed/route1/800/400"}
              alt={featuredRoute.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900 pt-4">热门景点</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="bg-gray-200 aspect-video rounded-xl mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            </div>
          ))}
        </div>
      ) : spots.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">暂无景点数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.map((spot, idx) => (
            <motion.div
              key={spot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/tourism/${spot.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col group cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                  src={spot.coverImage}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-xs font-medium">
                  {getTypeLabel(spot.type)}
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-gray-900 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {spot.averageRating ?? spot.rating ?? 0}
                  <span className="font-normal text-gray-500">({spot.reviewCount || 0}评)</span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {spot.name}
                </h3>
                <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{spot.address}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                  {spot.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <div>
                    {spot.price > 0 ? (
                      <>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(spot.price)}
                        </span>
                        <span className="text-xs text-gray-500">起</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-green-600">
                        免费开放
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3.5 h-3.5" />
                    {spot.viewCount || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Spot Modal */}
      <Modal
        isOpen={showAddSpotModal}
        onClose={() => setShowAddSpotModal(false)}
        title="发布旅游景点"
      >
        <form onSubmit={handleAddSpot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">景点名称</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg p-2"
              value={newSpot.name}
              onChange={e => setNewSpot({...newSpot, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.type}
                onChange={e => setNewSpot({...newSpot, type: e.target.value})}
              >
                {SPOT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">票价 (0为免费)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.price}
                onChange={e => setNewSpot({...newSpot, price: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg p-2"
              value={newSpot.address}
              onChange={e => setNewSpot({...newSpot, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开放起始日期</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.startDate}
                onChange={e => setNewSpot({...newSpot, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开放截止日期</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.endDate}
                onChange={e => setNewSpot({...newSpot, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每日开放时间</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.openTime}
                onChange={e => setNewSpot({...newSpot, openTime: e.target.value})}
                placeholder="08:00-18:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newSpot.contactPhone}
                onChange={e => setNewSpot({...newSpot, contactPhone: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
            <ImageUpload
              value={newSpot.coverImage}
              onChange={(url) => setNewSpot({...newSpot, coverImage: url})}
              placeholder="上传景点封面图"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              required
              className="w-full border border-gray-300 rounded-lg p-2"
              rows={4}
              value={newSpot.description}
              onChange={e => setNewSpot({...newSpot, description: e.target.value})}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddSpotModal(false)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              发布
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Audit Panel */}
      <Modal
        isOpen={showAuditPanel}
        onClose={() => setShowAuditPanel(false)}
        title="景点审核"
      >
        <div className="space-y-4">
          {auditLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : pendingSpots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无待审核景点</div>
          ) : (
            pendingSpots.map(spot => (
              <div key={spot.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{spot.name}</h4>
                    <span className="text-xs text-gray-500">{getTypeLabel(spot.type)} · {spot.address}</span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md font-medium">待审核</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{spot.description}</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleAudit(spot.id, false)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </button>
                  <button
                    onClick={() => handleAudit(spot.id, true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    通过
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
