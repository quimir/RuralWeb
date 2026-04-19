import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { ShoppingCart, ArrowLeft, MapPin, Store, Tag, User, Edit, X, Power, Plus, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Camera, Pencil } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { ImageUpload } from "../components/ui/ImageUpload";
import { motion, AnimatePresence } from "motion/react";

const IMAGE_TYPES = [
  { value: "DETAIL", label: "详情图" },
  { value: "SPEC", label: "规格图" },
  { value: "ORIGIN", label: "产地实拍" },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { userInfo } = useAuthStore();
  const { addToast } = useToast();

  const [flyingItem, setFlyingItem] = useState<{id: number, x: number, y: number, img: string} | null>(null);

  // Image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detailImages, setDetailImages] = useState<any[]>([]);

  // Add detail image
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImage, setNewImage] = useState({ imageUrl: "", caption: "", imageType: "DETAIL", sortOrder: "0" });

  // Quick image replace (hover-to-edit on main image)
  const [quickEdit, setQuickEdit] = useState<{ open: boolean; mode: "cover" | "detail" | null; targetImage: any }>({
    open: false, mode: null, targetImage: null,
  });
  const [quickImageUrl, setQuickImageUrl] = useState("");

  // Edit Product State
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
     name: "", price: "", unit: "", stock: "", description: "", origin: "",
     status: "ON_SALE", categoryId: "", imageUrl: ""
  });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false, title: "", onConfirm: () => {}
  });

  useEffect(() => {
    fetchProduct();
    fetchDetailImages();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data?.data;
      setProduct(data);
      if (data) {
        setEditForm({
          name: data.name, price: data.price, unit: data.unit, stock: data.stock,
          description: data.description, origin: data.origin,
          status: data.status || "ON_SALE", categoryId: data.categoryId || "",
          imageUrl: data.imageUrl || data.coverImage || ""
        });
        setTags(data.tags ? data.tags.split(",").filter((t: string) => t.trim() !== "") : []);
        // If backend returns detailImages inline
        if (data.detailImages) {
          setDetailImages(data.detailImages);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailImages = async () => {
    try {
      const res = await api.get(`/products/${id}/images`);
      if (res.data?.code === 200) {
        setDetailImages(res.data.data || []);
      }
    } catch {
      // Images API may not be available
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

  useEffect(() => {
    if (showEditModal) fetchCategories();
  }, [showEditModal]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!userInfo) {
      setConfirmDialog({
        isOpen: true, title: "您需要登录才能添加到购物车。是否立即登录？",
        onConfirm: () => navigate("/login")
      });
      return;
    }
    if (product) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyingItem({ id: Date.now(), x: rect.left, y: rect.top, img: product.imageUrl || product.coverImage });
      setTimeout(() => setFlyingItem(null), 800);
      addItem({
        id: Date.now(), productId: product.id, productName: product.name,
        productImage: product.imageUrl || product.coverImage,
        unitPrice: product.price, quantity, unit: product.unit,
        subtotal: product.price * quantity, selected: true,
        stock: product.stock, productStatus: product.status,
      });
      const btn = e.currentTarget as HTMLButtonElement;
      btn.classList.add("scale-105", "bg-green-700");
      setTimeout(() => btn.classList.remove("scale-105", "bg-green-700"), 200);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/products/${id}`, {
        ...editForm,
        price: parseFloat(editForm.price as string),
        stock: parseInt(editForm.stock as string),
        categoryId: editForm.categoryId ? parseInt(editForm.categoryId as string) : undefined,
        tags: tags.join(","),
        imageUrl: editForm.imageUrl || undefined,
      });
      if (res.data.code === 200) {
        addToast("商品修改成功", "success");
        setShowEditModal(false);
        fetchProduct();
      } else {
        addToast(res.data.message || "修改失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("修改失败", "error");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = product.status === "ON_SALE" ? "OFF_SHELF" : "ON_SALE";
    const actionText = newStatus === "ON_SALE" ? "上架" : "下架";
    setConfirmDialog({
      isOpen: true, title: `确定要${actionText}该商品吗？`,
      onConfirm: async () => {
        try {
          const res = await api.put(`/products/${id}/status`, { status: newStatus });
          if (res.data.code === 200) { addToast(`商品已${actionText}`, "success"); fetchProduct(); }
          else { addToast(res.data.message || `${actionText}失败`, "error"); }
        } catch (err) { addToast(`${actionText}失败`, "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Detail Image Management ---

  const handleAddDetailImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage.imageUrl) { addToast("请先上传或输入图片", "error"); return; }
    try {
      const res = await api.post(`/products/${id}/images`, {
        imageUrl: newImage.imageUrl,
        caption: newImage.caption,
        imageType: newImage.imageType,
        sortOrder: parseInt(newImage.sortOrder) || 0,
      });
      if (res.data.code === 200) {
        addToast("详情图添加成功", "success");
        setShowAddImageModal(false);
        setNewImage({ imageUrl: "", caption: "", imageType: "DETAIL", sortOrder: "0" });
        fetchDetailImages();
      } else { addToast(res.data.message || "添加失败", "error"); }
    } catch { addToast("添加失败", "error"); }
  };

  const handleDeleteDetailImage = (imageId: number) => {
    setConfirmDialog({
      isOpen: true, title: "确定要删除这张详情图吗？",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/products/${id}/images/${imageId}`);
          if (res.data.code === 200) { addToast("图片已删除", "success"); fetchDetailImages(); }
          else { addToast(res.data.message || "删除失败", "error"); }
        } catch { addToast("删除失败", "error"); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openQuickEdit = (mode: "cover" | "detail", targetImage: any) => {
    setQuickImageUrl(targetImage?.imageUrl || "");
    setQuickEdit({ open: true, mode, targetImage });
  };

  const handleQuickSave = async () => {
    if (!quickImageUrl) { addToast("请先选择图片", "error"); return; }
    try {
      if (quickEdit.mode === "cover") {
        const res = await api.put(`/products/${id}`, {
          name: product.name, price: product.price, unit: product.unit,
          stock: product.stock, description: product.description,
          origin: product.origin, status: product.status,
          categoryId: product.categoryId, tags: product.tags,
          imageUrl: quickImageUrl,
        });
        if (res.data.code === 200) {
          addToast("封面图已更新", "success");
          setQuickEdit({ open: false, mode: null, targetImage: null });
          fetchProduct();
        } else { addToast(res.data.message || "更新失败", "error"); }
      } else if (quickEdit.mode === "detail" && quickEdit.targetImage?.id) {
        // Replace: delete old + add new with same metadata
        await api.delete(`/products/${id}/images/${quickEdit.targetImage.id}`);
        const res = await api.post(`/products/${id}/images`, {
          imageUrl: quickImageUrl,
          caption: quickEdit.targetImage.caption || "",
          imageType: quickEdit.targetImage.imageType || "DETAIL",
          sortOrder: quickEdit.targetImage.sortOrder || 0,
        });
        if (res.data.code === 200) {
          addToast("图片已更换", "success");
          setQuickEdit({ open: false, mode: null, targetImage: null });
          fetchDetailImages();
        } else { addToast(res.data.message || "更换失败", "error"); }
      }
    } catch { addToast("操作失败", "error"); }
  };

  // Build all images array: cover + detail images
  const allImages = [
    { id: 0, imageUrl: product?.imageUrl || product?.coverImage, caption: "封面图", imageType: "COVER" },
    ...detailImages
  ].filter(img => img.imageUrl);

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!product) return <div className="p-8 text-center">商品未找到</div>;

  const showOriginalPrice = product.originalPrice && product.price < product.originalPrice;
  // eslint-disable-next-line eqeqeq
  const isOwner = userInfo && userInfo.id == product.sellerId;
  const isAdmin = userInfo && userInfo.role === "ADMIN";
  const isOffShelf = product.status !== "ON_SALE";
  const currentImage = allImages[currentImageIndex] || allImages[0];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <AnimatePresence>
        {flyingItem && (
          <motion.img
            key={flyingItem.id}
            src={flyingItem.img}
            initial={{ position: 'fixed', left: flyingItem.x, top: flyingItem.y, width: 32, height: 32, borderRadius: '50%', zIndex: 9999, opacity: 1 }}
            animate={{ left: window.innerWidth - 60, top: 20, width: 16, height: 16, opacity: 0.5, scale: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>

      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          {(isOwner || isAdmin) && (
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isOffShelf ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              <Power className="w-4 h-4" />
              {isOffShelf ? '上架' : '下架'}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              编辑商品
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className={`aspect-square rounded-xl overflow-hidden bg-gray-100 relative ${isOwner ? 'group' : ''}`}>
            <img
              src={currentImage?.imageUrl}
              alt={currentImage?.caption || product.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${isOwner ? 'group-hover:scale-105' : ''} ${isOffShelf ? 'grayscale opacity-70' : ''}`}
              referrerPolicy="no-referrer"
            />

            {/* Owner hover overlay: click to replace image */}
            {isOwner && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={() => openQuickEdit(
                    currentImageIndex === 0 ? "cover" : "detail",
                    currentImageIndex === 0 ? { imageUrl: product.imageUrl || product.coverImage } : currentImage
                  )}
                  className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
                >
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 hover:bg-white/35 transition-colors shadow-lg">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
                    {currentImageIndex === 0 ? '更换封面图' : '更换此图'}
                  </span>
                </button>
              </div>
            )}

            {isOffShelf && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <span className="bg-black/70 text-white px-4 py-2 rounded-lg font-bold tracking-widest">已下架</span>
              </div>
            )}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 disabled:opacity-30 z-10"
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(Math.min(allImages.length - 1, currentImageIndex + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 disabled:opacity-30 z-10"
                  disabled={currentImageIndex === allImages.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              {product.tags && product.tags.split(",").map((tag: string) => (
                <span key={tag} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-green-700 shadow-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />{tag}
                </span>
              ))}
            </div>
            {currentImage?.imageType && currentImage.imageType !== "COVER" && (
              <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10 pointer-events-none">
                {IMAGE_TYPES.find(t => t.value === currentImage.imageType)?.label || currentImage.imageType}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`group relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors cursor-pointer ${
                    idx === currentImageIndex ? 'border-green-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img.imageUrl} alt={img.caption || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {isOwner && img.id > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDetailImage(img.id); }}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {isOwner && (
                <button
                  onClick={() => setShowAddImageModal(true)}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* No detail images yet - show add button for owner */}
          {allImages.length <= 1 && isOwner && (
            <button
              onClick={() => setShowAddImageModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              添加详情图片
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{product.origin}</div>
              <div className="flex items-center gap-1"><Store className="w-4 h-4" />库存: {product.stock} {product.unit}</div>
              <div className="flex items-center gap-1"><User className="w-4 h-4" />{product.sellerName}</div>
            </div>
            {product.categoryName && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                  {product.categoryName}
                </span>
              </div>
            )}
            <div className="flex gap-4 text-sm text-gray-500 mb-4 border-b border-gray-100 pb-4">
              <div><span className="font-bold text-gray-900">{product.salesCount}</span> 已售</div>
              <div><span className="font-bold text-gray-900">{product.buyerCount}</span> 回头客</div>
            </div>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="mt-auto space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-red-600">{formatCurrency(product.price)}</span>
              <span className="text-gray-500">/{product.unit}</span>
              {showOriginalPrice && (
                <span className="text-lg text-gray-400 line-through ml-2">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">购买数量</span>
              <div className={`flex items-center border border-gray-300 rounded-lg ${isOffShelf ? 'opacity-50 pointer-events-none' : ''}`}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 hover:bg-gray-50 text-gray-600">-</button>
                <input type="number" value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none" />
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600">+</button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isOffShelf}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isOffShelf ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 transform active:scale-95 shadow-lg shadow-green-600/20'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOffShelf ? '商品已下架' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>

      {/* Detail Images Section (below main content) */}
      {detailImages.length > 0 && (
        <div className="border-t border-gray-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-600" />
              商品详情图
            </h2>
            {isOwner && (
              <button
                onClick={() => setShowAddImageModal(true)}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
              >
                <Plus className="w-4 h-4" />
                添加图片
              </button>
            )}
          </div>
          <div className="space-y-4">
            {detailImages.map((img: any) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.imageUrl}
                  alt={img.caption || "详情图"}
                  className="w-full rounded-lg"
                  referrerPolicy="no-referrer"
                />
                {img.caption && (
                  <p className="text-xs text-gray-500 mt-1 text-center">{img.caption}</p>
                )}
                {isOwner && (
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openQuickEdit("detail", img)}
                      className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
                      title="替换图片"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDetailImage(img.id)}
                      className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      title="删除图片"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="编辑商品">
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
            <ImageUpload
              value={editForm.imageUrl}
              onChange={(url) => setEditForm({...editForm, imageUrl: url})}
              placeholder="上传商品封面图"
              showCacheOptions
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select className="w-full border border-gray-300 rounded-lg p-2"
              value={editForm.categoryId} onChange={e => setEditForm({...editForm, categoryId: e.target.value})}>
              <option value="">请选择分类</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
              <input type="number" required className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="ON_SALE">上架</option>
                <option value="OFF_SHELF">下架</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产地</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg p-2"
              value={editForm.origin} onChange={e => setEditForm({...editForm, origin: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  {tag}<button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2"
              value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag}
              placeholder="输入标签后按回车添加" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea required className="w-full border border-gray-300 rounded-lg p-2" rows={3}
              value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">保存修改</button>
          </div>
        </form>
      </Modal>

      {/* Add Detail Image Modal */}
      <Modal isOpen={showAddImageModal} onClose={() => setShowAddImageModal(false)} title="添加详情图片">
        <form onSubmit={handleAddDetailImage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
            <ImageUpload
              value={newImage.imageUrl}
              onChange={(url) => setNewImage({...newImage, imageUrl: url})}
              placeholder="上传详情图片"
              showCacheOptions
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片类型</label>
              <select className="w-full border border-gray-300 rounded-lg p-2"
                value={newImage.imageType} onChange={e => setNewImage({...newImage, imageType: e.target.value})}>
                {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg p-2"
                value={newImage.sortOrder} onChange={e => setNewImage({...newImage, sortOrder: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图片说明</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2"
              value={newImage.caption} onChange={e => setNewImage({...newImage, caption: e.target.value})}
              placeholder="如：苹果正面实拍、包装图等" />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setShowAddImageModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">添加</button>
          </div>
        </form>
      </Modal>

      {/* Quick Image Replace Modal */}
      <Modal
        isOpen={quickEdit.open}
        onClose={() => setQuickEdit({ open: false, mode: null, targetImage: null })}
        title={quickEdit.mode === "cover" ? "更换封面图" : "更换详情图"}
      >
        <div className="space-y-4">
          <ImageUpload
            value={quickImageUrl}
            onChange={setQuickImageUrl}
            placeholder="上传新图片或输入图片URL"
            showCacheOptions
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setQuickEdit({ open: false, mode: null, targetImage: null })}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleQuickSave}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <Modal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} title="提示">
        <div className="space-y-4">
          <p className="text-gray-600">{confirmDialog.title}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
            <button onClick={confirmDialog.onConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确定</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
