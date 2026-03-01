import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatCurrency } from "../lib/utils";
import { ShoppingCart, Search, Filter, Plus, Trash2, X } from "lucide-react";
import { ImageUpload } from "../components/ui/ImageUpload";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    onConfirm: () => {}
  });

  const [flyingItem, setFlyingItem] = useState<{id: number, x: number, y: number, img: string} | null>(null);

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    unit: "kg",
    stock: "",
    description: "",
    origin: "",
    coverImage: "",
    categoryId: ""
  });

  const fetchProducts = async () => {
    try {
      const url = selectedCategory ? `/products?categoryId=${selectedCategory}` : "/products";
      const res = await api.get(url);
      setProducts(res.data?.data?.records || []);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Prevent navigation to detail page
    
    if (product.status === "OFF_SHELF") {
      addToast("该商品已下架", "error");
      return;
    }

    if (!userInfo) {
      setConfirmDialog({
        isOpen: true,
        title: "您需要登录才能添加到购物车。是否立即登录？",
        onConfirm: () => navigate("/login")
      });
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setFlyingItem({ id: Date.now(), x: rect.left, y: rect.top, img: product.coverImage });
    setTimeout(() => setFlyingItem(null), 800);

    addItem({
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      productImage: product.coverImage,
      unitPrice: product.price,
      quantity: 1,
      unit: product.unit,
      subtotal: product.price,
      selected: true,
      stock: product.stock,
      productStatus: product.status,
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "确定要删除这个商品吗？",
      onConfirm: async () => {
        try {
          const res = await api.delete(`/products/${id}`);
          if (res.data.code === 200) {
            addToast("删除成功", "success");
            fetchProducts();
          } else {
            addToast(res.data.message || "删除失败", "error");
          }
        } catch (err) {
          console.error(err);
          addToast("删除失败", "error");
        }
      }
    });
  };

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/products", {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        imageUrl: newProduct.coverImage || undefined,
        status: "ON_SALE",
        tags: tags.join(",")
      });
      
      if (res.data.code === 200) {
        addToast("添加成功", "success");
        setShowAddModal(false);
        fetchProducts();
        // Reset form
        setNewProduct({
          name: "",
          price: "",
          unit: "kg",
          stock: "",
          description: "",
          origin: "",
          coverImage: "",
          categoryId: ""
        });
        setTags([]);
      } else {
        addToast(res.data.message || "添加失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("添加失败", "error");
    }
  };

  const canManageProducts = userInfo && ["ADMIN", "FARMER", "MERCHANT"].includes(userInfo.role);

  return (
    <div className="space-y-6">
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

      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        title="提示"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{confirmDialog.title}</p>
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              确定
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农产品交易</h1>
          <p className="text-sm text-gray-500 mt-1">产地直发，新鲜到家</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索农产品..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          {canManageProducts && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              发布商品
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, idx) => {
            const isOffShelf = product.status === "OFF_SHELF";
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/products/${product.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col cursor-pointer relative"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.coverImage}
                  alt={product.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOffShelf ? 'grayscale opacity-60' : ''}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  {product.origin}
                </div>
                {isOffShelf && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="bg-black/70 text-white px-4 py-2 rounded-lg font-medium tracking-widest">已下架</span>
                  </div>
                )}
                {canManageProducts && userInfo?.id === product.sellerId && (
                  <button
                    onClick={(e) => handleDelete(e, product.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full hover:bg-red-50 transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className={`font-bold line-clamp-1 mb-1 ${isOffShelf ? 'text-gray-500' : 'text-gray-900'}`}>
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                  {product.description}
                </p>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <span className={`text-lg font-bold ${isOffShelf ? 'text-gray-400' : 'text-red-600'}`}>
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      /{product.unit}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={isOffShelf}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isOffShelf 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="发布新商品">
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={newProduct.categoryId}
                  onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})}
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
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                <input
                  type="number"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={newProduct.stock}
                  onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产地</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={newProduct.origin}
                  onChange={e => setNewProduct({...newProduct, origin: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">商品图片</label>
                <ImageUpload
                  value={newProduct.coverImage}
                  onChange={(url) => setNewProduct({...newProduct, coverImage: url})}
                  placeholder="上传商品图片"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  required
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  发布
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
