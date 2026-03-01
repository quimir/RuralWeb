import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { ShoppingCart, ArrowLeft, MapPin, Store, Tag, User, Edit, X, Power } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import { motion, AnimatePresence } from "motion/react";

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

  // Edit Product State
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
     name: "",
     price: "",
     unit: "",
     stock: "",
     description: "",
     origin: "",
     status: "ON_SALE",
     categoryId: ""
  });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data?.data);
      if (res.data?.data) {
          setEditForm({
              name: res.data.data.name,
              price: res.data.data.price,
              unit: res.data.data.unit,
              stock: res.data.data.stock,
              description: res.data.data.description,
              origin: res.data.data.origin,
              status: res.data.data.status || "ON_SALE",
              categoryId: res.data.data.categoryId || ""
          });
          setTags(res.data.data.tags ? res.data.data.tags.split(",").filter((t: string) => t.trim() !== "") : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  // Fetch categories when edit modal opens
  useEffect(() => {
    if (showEditModal) {
      fetchCategories();
    }
  }, [showEditModal]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!userInfo) {
      setConfirmDialog({
        isOpen: true,
        title: "您需要登录才能添加到购物车。是否立即登录？",
        onConfirm: () => navigate("/login")
      });
      return;
    }

    if (product) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyingItem({ id: Date.now(), x: rect.left, y: rect.top, img: product.coverImage });
      setTimeout(() => setFlyingItem(null), 800);

      addItem({
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        productImage: product.coverImage,
        unitPrice: product.price,
        quantity: quantity,
        unit: product.unit,
        subtotal: product.price * quantity,
        selected: true,
        stock: product.stock,
        productStatus: product.status,
      });

      // Visual feedback
      const btn = e.currentTarget as HTMLButtonElement;
      btn.classList.add("scale-105", "bg-green-700");
      setTimeout(() => {
        btn.classList.remove("scale-105", "bg-green-700");
      }, 200);
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
              tags: tags.join(",")
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
      isOpen: true,
      title: `确定要${actionText}该商品吗？`,
      onConfirm: async () => {
        try {
          const res = await api.put(`/products/${id}/status`, { status: newStatus });
          if (res.data.code === 200) {
            addToast(`商品已${actionText}`, "success");
            fetchProduct();
          } else {
            addToast(res.data.message || `${actionText}失败`, "error");
          }
        } catch (err) {
          console.error(err);
          addToast(`${actionText}失败`, "error");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!product) return <div className="p-8 text-center">商品未找到</div>;

  const showOriginalPrice = product.originalPrice && product.price < product.originalPrice;
  const isOwner = userInfo && userInfo.id === product.sellerId;
  const isAdmin = userInfo && userInfo.role === "ADMIN";
  const isOffShelf = product.status !== "ON_SALE";

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
                isOffShelf
                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
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
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
          <img
            src={product.coverImage}
            alt={product.name}
            className={`w-full h-full object-cover ${isOffShelf ? 'grayscale opacity-70' : ''}`}
            referrerPolicy="no-referrer"
          />
          {isOffShelf && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="bg-black/70 text-white px-4 py-2 rounded-lg font-bold tracking-widest">已下架</span>
            </div>
          )}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
             {product.tags && product.tags.split(",").map((tag: string) => (
                <span key={tag} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-green-700 shadow-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
             ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {product.origin}
              </div>
              <div className="flex items-center gap-1">
                <Store className="w-4 h-4" />
                库存: {product.stock} {product.unit}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {product.sellerName}
              </div>
            </div>

            {product.categoryName && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                  {product.categoryName}
                </span>
              </div>
            )}

            <div className="flex gap-4 text-sm text-gray-500 mb-4 border-b border-gray-100 pb-4">
               <div>
                 <span className="font-bold text-gray-900">{product.salesCount}</span> 已售
               </div>
               <div>
                 <span className="font-bold text-gray-900">{product.buyerCount}</span> 回头客
               </div>
            </div>

            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="mt-auto space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-red-600">
                {formatCurrency(product.price)}
              </span>
              <span className="text-gray-500">/{product.unit}</span>
              {showOriginalPrice && (
                <span className="text-lg text-gray-400 line-through ml-2">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">购买数量</span>
              <div className={`flex items-center border border-gray-300 rounded-lg ${isOffShelf ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOffShelf}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isOffShelf
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 transform active:scale-95 shadow-lg shadow-green-600/20'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOffShelf ? '商品已下架' : '加入购物车'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑商品"
      >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                  <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={editForm.categoryId}
                      onChange={e => setEditForm({...editForm, categoryId: e.target.value})}
                  >
                      <option value="">请选择分类</option>
                      {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                      <input
                          type="number"
                          required
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={editForm.price}
                          onChange={e => setEditForm({...editForm, price: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                      <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={editForm.unit}
                          onChange={e => setEditForm({...editForm, unit: e.target.value})}
                      />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                    <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg p-2"
                        value={editForm.stock}
                        onChange={e => setEditForm({...editForm, stock: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg p-2"
                        value={editForm.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value})}
                    >
                        <option value="ON_SALE">上架</option>
                        <option value="OFF_SHELF">下架</option>
                    </select>
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产地</label>
                  <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={editForm.origin}
                      onChange={e => setEditForm({...editForm, origin: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span key={tag} className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="输入标签后按回车添加"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                      required
                      className="w-full border border-gray-300 rounded-lg p-2"
                      rows={3}
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                  />
              </div>
              <div className="flex gap-3 mt-6">
                  <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                      取消
                  </button>
                  <button
                      type="submit"
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                      保存修改
                  </button>
              </div>
          </form>
      </Modal>

      {/* Custom Confirm Dialog */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title="提示"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{confirmDialog.title}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={confirmDialog.onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确定
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
