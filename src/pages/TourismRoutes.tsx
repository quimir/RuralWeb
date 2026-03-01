import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { ImageUpload } from "../components/ui/ImageUpload";
import { motion } from "motion/react";
import {
  ArrowLeft, MapPin, Calendar, Copy, Plus, Trash2, ChevronDown, ChevronUp, Eye, Edit, Search, Clock, X
} from "lucide-react";

export default function TourismRoutes() {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tab, setTab] = useState<"public" | "mine">("public");
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Route Detail
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Create/Edit Route
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [createStep, setCreateStep] = useState(1); // 1=basic info, 2=add spots
  const [routeForm, setRouteForm] = useState({
    title: "",
    totalDays: 1,
    startDate: "",
    isPublic: true,
    coverImage: "https://picsum.photos/seed/route/800/400",
  });
  const [routeDays, setRouteDays] = useState<{ dayNumber: number; spots: any[] }[]>([
    { dayNumber: 1, spots: [] }
  ]);

  // Spot search for adding to route
  const [availableSpots, setAvailableSpots] = useState<any[]>([]);
  const [spotSearchKeyword, setSpotSearchKeyword] = useState("");
  const [showSpotPicker, setShowSpotPicker] = useState<{ dayIndex: number } | null>(null);

  // Add spot form
  const [addSpotForm, setAddSpotForm] = useState({
    visitTime: "09:00",
    durationMinutes: 120,
    notes: "",
  });

  // Confirm
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false, title: "", onConfirm: () => {}
  });

  useEffect(() => {
    fetchRoutes();
  }, [tab]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const url = tab === "public"
        ? "/tourism/routes/public?page=1&size=20"
        : "/tourism/routes/mine?page=1&size=20";
      const res = await api.get(url);
      const data = res.data?.data;
      setRoutes(data?.records || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteDetail = async (routeId: number) => {
    try {
      const res = await api.get(`/tourism/routes/${routeId}`);
      setSelectedRoute(res.data?.data);
      setShowDetailModal(true);
    } catch (err) {
      addToast("获取路线详情失败", "error");
    }
  };

  const fetchAvailableSpots = async (keyword?: string) => {
    try {
      let url = "/tourism/spots?page=1&size=50&status=APPROVED";
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      const res = await api.get(url);
      setAvailableSpots(res.data?.data?.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRoute = async (routeId: number) => {
    if (!userInfo) { addToast("请先登录", "error"); return; }
    try {
      const res = await api.post(`/tourism/routes/${routeId}/copy`);
      if (res.data.code === 200) {
        addToast("已复制到我的路线", "success");
        if (tab === "mine") fetchRoutes();
      } else {
        addToast(res.data.message || "复制失败", "error");
      }
    } catch (err) { addToast("复制失败", "error"); }
  };

  const openCreateModal = () => {
    setEditingRouteId(null);
    setRouteForm({ title: "", totalDays: 1, startDate: "", isPublic: true, coverImage: "https://picsum.photos/seed/route/800/400" });
    setRouteDays([{ dayNumber: 1, spots: [] }]);
    setCreateStep(1);
    setShowCreateModal(true);
  };

  const openEditModal = async (routeId: number) => {
    try {
      const res = await api.get(`/tourism/routes/${routeId}`);
      const route = res.data?.data;
      if (route) {
        setEditingRouteId(routeId);
        setRouteForm({
          title: route.title || "",
          totalDays: route.totalDays || 1,
          startDate: route.startDate || "",
          isPublic: route.isPublic ?? true,
          coverImage: route.coverImage || "https://picsum.photos/seed/route/800/400",
        });
        setRouteDays(
          route.days && route.days.length > 0
            ? route.days.map((d: any) => ({
                dayNumber: d.dayNumber,
                spots: (d.spots || []).map((s: any) => ({
                  spotId: s.spotId,
                  spotName: s.spotName,
                  visitTime: s.visitTime || "09:00",
                  durationMinutes: s.durationMinutes || 120,
                  notes: s.notes || "",
                  sortOrder: s.sortOrder || 0,
                }))
              }))
            : Array.from({ length: route.totalDays || 1 }, (_, i) => ({ dayNumber: i + 1, spots: [] }))
        );
        setCreateStep(2);
        setShowCreateModal(true);
      }
    } catch (err) {
      addToast("获取路线详情失败", "error");
    }
  };

  const handleNextStep = () => {
    if (!routeForm.title.trim()) {
      addToast("请输入路线标题", "error");
      return;
    }
    // Sync days array with totalDays
    const days = routeForm.totalDays;
    setRouteDays(prev => {
      if (prev.length < days) {
        return [...prev, ...Array.from({ length: days - prev.length }, (_, i) => ({
          dayNumber: prev.length + i + 1,
          spots: []
        }))];
      } else if (prev.length > days) {
        return prev.slice(0, days);
      }
      return prev;
    });
    fetchAvailableSpots();
    setCreateStep(2);
  };

  const handleAddSpotToDay = (dayIndex: number, spot: any) => {
    setRouteDays(prev => {
      const updated = [...prev];
      const existing = updated[dayIndex].spots.find((s: any) => s.spotId === spot.id);
      if (existing) {
        addToast("该景点已在行程中", "info");
        return prev;
      }
      updated[dayIndex] = {
        ...updated[dayIndex],
        spots: [
          ...updated[dayIndex].spots,
          {
            spotId: spot.id,
            spotName: spot.name,
            visitTime: addSpotForm.visitTime,
            durationMinutes: addSpotForm.durationMinutes,
            notes: addSpotForm.notes,
            sortOrder: updated[dayIndex].spots.length + 1,
          }
        ]
      };
      return updated;
    });
    setShowSpotPicker(null);
    setAddSpotForm({ visitTime: "09:00", durationMinutes: 120, notes: "" });
    addToast("景点已添加", "success");
  };

  const handleRemoveSpotFromDay = (dayIndex: number, spotIndex: number) => {
    setRouteDays(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        spots: updated[dayIndex].spots.filter((_: any, i: number) => i !== spotIndex)
      };
      return updated;
    });
  };

  const handleAddDay = () => {
    setRouteDays(prev => {
      const newDay = { dayNumber: prev.length + 1, spots: [] };
      return [...prev, newDay];
    });
    setRouteForm(prev => ({ ...prev, totalDays: routeDays.length + 1 }));
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (routeDays.length <= 1) {
      addToast("至少保留一天行程", "error");
      return;
    }
    setRouteDays(prev => {
      const updated = prev.filter((_, i) => i !== dayIndex);
      return updated.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    });
    setRouteForm(prev => ({ ...prev, totalDays: routeDays.length - 1 }));
  };

  const handleSubmitRoute = async () => {
    if (!userInfo) { addToast("请先登录", "error"); return; }
    try {
      // Flatten routeDays into a flat items array as required by backend API
      const items: any[] = [];
      routeDays.forEach((day, dayIdx) => {
        day.spots.forEach((s: any, si: number) => {
          items.push({
            spotId: s.spotId,
            dayNumber: dayIdx + 1,
            sortOrder: si + 1,
            visitTime: s.visitTime || "09:00",
            durationMinutes: s.durationMinutes || 120,
            notes: s.notes || "",
          });
        });
      });

      const payload: any = {
        title: routeForm.title,
        totalDays: routeDays.length,
        isPublic: routeForm.isPublic,
        coverImage: routeForm.coverImage,
        items,
      };
      if (routeForm.startDate) {
        payload.startDate = routeForm.startDate;
      }

      let res;
      if (editingRouteId) {
        res = await api.put(`/tourism/routes/${editingRouteId}`, payload);
      } else {
        res = await api.post("/tourism/routes", payload);
      }

      if (res.data.code === 200) {
        addToast(editingRouteId ? "路线更新成功" : "路线创建成功", "success");
        setShowCreateModal(false);
        if (tab === "public") setTab("mine");
        fetchRoutes();
      } else {
        addToast(res.data.message || "操作失败", "error");
      }
    } catch (err) { addToast("操作失败", "error"); }
  };

  const handleDeleteRoute = (routeId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "确定要删除该路线吗？",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/tourism/routes/${routeId}`);
          if (res.data.code === 200) {
            addToast("路线已删除", "success");
            fetchRoutes();
          } else { addToast(res.data.message || "删除失败", "error"); }
        } catch (err) { addToast("删除失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/tourism")} className="flex items-center text-gray-600 hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回乡村游
        </button>
        {userInfo && (
          <button onClick={openCreateModal}
            className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" />
            创建路线
          </button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">旅游路线</h1>
        <p className="text-sm text-gray-500 mt-1">发现精彩路线，规划你的乡村之旅</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("public")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "public" ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          推荐路线
        </button>
        {userInfo && (
          <button
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "mine" ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            我的路线
          </button>
        )}
      </div>

      {/* Route List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-32"></div>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">{tab === "mine" ? "暂无自己的路线，快去创建吧" : "暂无推荐路线"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route, idx) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row cursor-pointer"
              onClick={() => fetchRouteDetail(route.id)}
            >
              <div className="md:w-48 h-32 md:h-auto bg-gray-100 shrink-0">
                <img
                  src={route.coverImage || "https://picsum.photos/seed/route/400/200"}
                  alt={route.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{route.title}</h3>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {route.isPublic && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">公开</span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {route.totalDays}天
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {route.creatorName && <span>by {route.creatorName}</span>}
                    {route.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {route.startDate}
                      </span>
                    )}
                    {route.copyCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {route.copyCount} 人引用
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3" onClick={e => e.stopPropagation()}>
                  {tab === "public" && userInfo && (
                    <button
                      onClick={() => handleCopyRoute(route.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100"
                    >
                      <Copy className="w-4 h-4" />
                      复制路线
                    </button>
                  )}
                  {/* Admin can delete any route */}
                  {tab === "public" && userInfo?.role === "ADMIN" && (
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  )}
                  {tab === "mine" && (
                    <>
                      <button
                        onClick={() => openEditModal(route.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Route Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedRoute?.title || "路线详情"}>
        {selectedRoute && (
          <div className="space-y-4">
            {selectedRoute.coverImage && (
              <img src={selectedRoute.coverImage} alt="" className="w-full h-40 object-cover rounded-xl" referrerPolicy="no-referrer" />
            )}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span>创建者: {selectedRoute.creatorName || "未知"}</span>
              <span>{selectedRoute.totalDays} 天行程</span>
              {selectedRoute.startDate && <span>出发: {selectedRoute.startDate}</span>}
              {selectedRoute.copyCount > 0 && <span>{selectedRoute.copyCount} 人引用</span>}
              {selectedRoute.isPublic ? (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">公开</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">私有</span>
              )}
            </div>

            {/* Days */}
            {selectedRoute.days && selectedRoute.days.length > 0 ? (
              <div className="space-y-4">
                {selectedRoute.days.map((day: any) => (
                  <div key={day.dayNumber} className="border border-gray-100 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {day.dayNumber}
                      </span>
                      第{day.dayNumber}天
                      {day.date && <span className="text-xs text-gray-400 font-normal">({day.date})</span>}
                    </h4>
                    {day.spots && day.spots.length > 0 ? (
                      <div className="space-y-2 ml-8 border-l-2 border-orange-100 pl-4">
                        {day.spots.map((spot: any, si: number) => (
                          <div key={si} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 -ml-[21px] shrink-0"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">{spot.spotName}</span>
                                {spot.visitTime && (
                                  <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />{spot.visitTime}
                                  </span>
                                )}
                                {spot.durationMinutes && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                    {spot.durationMinutes}分钟
                                  </span>
                                )}
                              </div>
                              {spot.notes && <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-1.5 rounded">{spot.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 ml-8">暂无景点安排</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">该路线共 {selectedRoute.totalDays} 天，暂未安排具体景点</p>
                <p className="text-xs text-gray-400 mt-1">可编辑路线添加每日行程</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">关闭</button>
              {userInfo && selectedRoute.isPublic && (
                <button
                  onClick={() => { handleCopyRoute(selectedRoute.id); setShowDetailModal(false); }}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  复制到我的路线
                </button>
              )}
              {userInfo?.role === "ADMIN" && (
                <button
                  onClick={() => { handleDeleteRoute(selectedRoute.id); setShowDetailModal(false); }}
                  className="py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Route Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editingRouteId ? "编辑旅游路线" : "创建旅游路线"}>
        {createStep === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">路线标题</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={routeForm.title} onChange={e => setRouteForm({...routeForm, title: e.target.value})}
                placeholder="如：烟台周末两日游" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总天数</label>
                <input type="number" required min={1} max={14} className="w-full border border-gray-300 rounded-lg p-2"
                  value={routeForm.totalDays} onChange={e => setRouteForm({...routeForm, totalDays: parseInt(e.target.value) || 1})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出发日期</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg p-2"
                  value={routeForm.startDate} onChange={e => setRouteForm({...routeForm, startDate: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
              <ImageUpload
                value={routeForm.coverImage}
                onChange={(url) => setRouteForm({...routeForm, coverImage: url})}
                placeholder="上传路线封面图"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublic" checked={routeForm.isPublic}
                onChange={e => setRouteForm({...routeForm, isPublic: e.target.checked})}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded" />
              <label htmlFor="isPublic" className="text-sm text-gray-700">公开路线（其他用户可查看和复制）</label>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
              <button type="button" onClick={handleNextStep} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                下一步：添加景点
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500 pb-2 border-b border-gray-100">
              <button onClick={() => setCreateStep(1)} className="text-orange-600 hover:underline">基本信息</button>
              <span>→</span>
              <span className="font-medium text-gray-900">行程安排</span>
            </div>

            {/* Days with spots */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {routeDays.map((day, dayIdx) => (
                <div key={dayIdx} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {day.dayNumber}
                      </span>
                      第{day.dayNumber}天
                      {routeForm.startDate && (
                        <span className="text-xs text-gray-400 font-normal">
                          ({new Date(new Date(routeForm.startDate).getTime() + (dayIdx) * 86400000).toISOString().split("T")[0]})
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setShowSpotPicker({ dayIndex: dayIdx }); fetchAvailableSpots(); }}
                        className="flex items-center gap-1 px-2 py-1 text-orange-600 text-xs font-medium hover:bg-orange-50 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加景点
                      </button>
                      <button
                        onClick={() => handleRemoveDay(dayIdx)}
                        className="flex items-center gap-1 px-2 py-1 text-red-500 text-xs font-medium hover:bg-red-50 rounded-lg"
                        title="删除此天"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {day.spots.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">暂无景点，点击上方添加</p>
                  ) : (
                    <div className="space-y-2">
                      {day.spots.map((spot: any, si: number) => (
                        <div key={si} className="p-2.5 bg-gray-50 rounded-lg space-y-1.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{spot.spotName}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveSpotFromDay(dayIdx, si)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Inline editable fields */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <input type="time" className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-20"
                                value={spot.visitTime || "09:00"}
                                onChange={e => {
                                  setRouteDays(prev => {
                                    const updated = [...prev];
                                    const spots = [...updated[dayIdx].spots];
                                    spots[si] = { ...spots[si], visitTime: e.target.value };
                                    updated[dayIdx] = { ...updated[dayIdx], spots };
                                    return updated;
                                  });
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">时长:</span>
                              <input type="number" min={15} className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-16"
                                value={spot.durationMinutes || 120}
                                onChange={e => {
                                  setRouteDays(prev => {
                                    const updated = [...prev];
                                    const spots = [...updated[dayIdx].spots];
                                    spots[si] = { ...spots[si], durationMinutes: parseInt(e.target.value) || 60 };
                                    updated[dayIdx] = { ...updated[dayIdx], spots };
                                    return updated;
                                  });
                                }}
                              />
                              <span className="text-xs text-gray-400">分钟</span>
                            </div>
                            <input type="text" placeholder="备注..." className="text-xs border border-gray-200 rounded px-1.5 py-0.5 flex-1 min-w-[80px]"
                              value={spot.notes || ""}
                              onChange={e => {
                                setRouteDays(prev => {
                                  const updated = [...prev];
                                  const spots = [...updated[dayIdx].spots];
                                  spots[si] = { ...spots[si], notes: e.target.value };
                                  updated[dayIdx] = { ...updated[dayIdx], spots };
                                  return updated;
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Day Button */}
              <button
                onClick={handleAddDay}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                添加第 {routeDays.length + 1} 天
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setCreateStep(1)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">上一步</button>
              <button type="button" onClick={handleSubmitRoute} className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                {editingRouteId ? "保存修改" : "创建路线"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Spot Picker Modal */}
      <Modal
        isOpen={showSpotPicker !== null}
        onClose={() => setShowSpotPicker(null)}
        title="选择景点"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索景点..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              value={spotSearchKeyword}
              onChange={e => {
                setSpotSearchKeyword(e.target.value);
                fetchAvailableSpots(e.target.value);
              }}
            />
          </div>

          {/* Visit time & duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">到达时间</label>
              <input type="time" className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                value={addSpotForm.visitTime} onChange={e => setAddSpotForm({...addSpotForm, visitTime: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">游玩时长(分钟)</label>
              <input type="number" min={30} className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                value={addSpotForm.durationMinutes} onChange={e => setAddSpotForm({...addSpotForm, durationMinutes: parseInt(e.target.value) || 60})} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">备注</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                value={addSpotForm.notes} onChange={e => setAddSpotForm({...addSpotForm, notes: e.target.value})} placeholder="可选" />
            </div>
          </div>

          {/* Spot list */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {availableSpots.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">暂无可选景点</p>
            ) : (
              availableSpots.map(spot => (
                <div
                  key={spot.id}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/50 cursor-pointer transition-colors"
                  onClick={() => showSpotPicker && handleAddSpotToDay(showSpotPicker.dayIndex, spot)}
                >
                  {spot.coverImage && (
                    <img src={spot.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">{spot.name}</h5>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{spot.address}</span>
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-orange-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
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
    </div>
  );
}
