import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatCurrency } from "../lib/utils";
import {
  Trash2, ShoppingBag, ArrowRight, AlertCircle, RefreshCw,
  MapPin, Plus, Edit, Check, Phone, User, Star, ChevronRight
} from "lucide-react";
import { api } from "../api/client";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";

interface Address {
  id: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt?: string;
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, syncProductStatus, toggleSelect, selectAll, fetchCart, loading: cartFetching } = useCartStore();
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { addToast } = useToast();
  const hasSynced = useRef(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressFormModal, setShowAddressFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    receiverName: "",
    receiverPhone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
    isDefault: false,
  });

  // Checkout state
  const [remark, setRemark] = useState("");
  const [showCheckoutPanel, setShowCheckoutPanel] = useState(false);

  // Payment simulation
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Filter out off-shelf items for total calculation
  const validItems = items.filter(item => item.productStatus === "ON_SALE");
  const selectedItems = validItems.filter(item => item.selected);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const allValidSelected = validItems.length > 0 && validItems.every(item => item.selected);
  const hasOffShelfItems = items.some(item => item.productStatus !== "ON_SALE");
  const hasOutOfStockItems = selectedItems.some(item => item.stock < item.quantity);

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  // Fetch cart from backend on mount
  useEffect(() => {
    if (userInfo) {
      fetchCart();
    }
  }, [userInfo]);

  // Sync cart items with backend product status after items are loaded
  useEffect(() => {
    if (items.length > 0 && userInfo && !hasSynced.current) {
      hasSynced.current = true;
      syncCartItems();
    }
  }, [userInfo, items.length]);

  // Fetch addresses on mount
  useEffect(() => {
    if (userInfo) {
      fetchAddresses();
    }
  }, [userInfo]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/addresses");
      const list = res.data?.data || [];
      setAddresses(list);
      // Auto-select default address
      const defaultAddr = list.find((a: Address) => a.isDefault);
      if (defaultAddr && !selectedAddress) {
        setSelectedAddress(defaultAddr);
      } else if (list.length > 0 && !selectedAddress) {
        setSelectedAddress(list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  const syncCartItems = async () => {
    setSyncing(true);
    let changedCount = 0;
    const productIds = [...new Set(items.map(item => item.productId))];

    try {
      const results = await Promise.allSettled(
        productIds.map(pid => api.get(`/products/${pid}`))
      );

      results.forEach((result, idx) => {
        const productId = productIds[idx];
        if (result.status === "fulfilled" && result.value.data?.data) {
          const product = result.value.data.data;
          const cartItem = items.find(i => i.productId === productId);
          if (cartItem) {
            const statusChanged = cartItem.productStatus !== product.status;
            const stockChanged = cartItem.stock !== product.stock;
            const priceChanged = cartItem.unitPrice !== product.price;
            if (statusChanged || stockChanged || priceChanged) {
              syncProductStatus(productId, product.status, product.stock, product.price);
              changedCount++;
            }
          }
        } else if (result.status === "rejected") {
          const cartItem = items.find(i => i.productId === productId);
          if (cartItem) {
            syncProductStatus(productId, "OFF_SHELF", 0, cartItem.unitPrice);
            changedCount++;
          }
        }
      });

      if (changedCount > 0) {
        addToast(`已同步 ${changedCount} 件商品的最新状态`, "info");
      }
    } catch (err) {
      console.error("Cart sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  // --- Address CRUD ---
  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      receiverName: "",
      receiverPhone: "",
      province: "",
      city: "",
      district: "",
      detail: "",
      isDefault: addresses.length === 0,
    });
    setShowAddressFormModal(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      isDefault: addr.isDefault,
    });
    setShowAddressFormModal(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.receiverName.trim()) {
      addToast("请输入收货人姓名", "error");
      return;
    }
    if (!addressForm.receiverPhone.trim()) {
      addToast("请输入收货人电话", "error");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(addressForm.receiverPhone.trim())) {
      addToast("请输入正确的手机号码", "error");
      return;
    }
    if (!addressForm.province.trim() || !addressForm.city.trim() || !addressForm.detail.trim()) {
      addToast("请填写完整的地址信息", "error");
      return;
    }

    setAddressLoading(true);
    try {
      const payload = {
        ...addressForm,
        fullAddress: `${addressForm.province}${addressForm.city}${addressForm.district}${addressForm.detail}`,
      };

      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, payload);
        addToast("地址修改成功", "success");
      } else {
        await api.post("/addresses", payload);
        addToast("地址添加成功", "success");
      }

      await fetchAddresses();
      setShowAddressFormModal(false);
    } catch (err) {
      addToast("保存地址失败", "error");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addrId: number) => {
    try {
      await api.delete(`/addresses/${addrId}`);
      addToast("地址已删除", "success");
      if (selectedAddress?.id === addrId) {
        setSelectedAddress(null);
      }
      await fetchAddresses();
    } catch (err) {
      addToast("删除地址失败", "error");
    }
  };

  const handleSetDefault = async (addrId: number) => {
    try {
      await api.put(`/addresses/${addrId}/default`);
      addToast("已设为默认地址", "success");
      await fetchAddresses();
    } catch (err) {
      addToast("设置默认地址失败", "error");
    }
  };

  // --- Checkout flow ---
  const handleStartCheckout = () => {
    if (selectedItems.length === 0) {
      addToast("请先选择要结算的商品", "error");
      return;
    }
    if (hasOutOfStockItems) {
      addToast("部分选中商品库存不足，请调整数量", "error");
      return;
    }
    setShowCheckoutPanel(true);
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      addToast("请选择收货地址", "error");
      return;
    }
    if (selectedItems.length === 0) {
      addToast("请先选择要结算的商品", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/orders", {
        shippingAddress: selectedAddress.fullAddress,
        receiverName: selectedAddress.receiverName,
        receiverPhone: selectedAddress.receiverPhone,
        remark: remark.trim() || undefined,
      });

      if (res.data.code === 200) {
        const orderData = res.data?.data;
        selectedItems.forEach(item => removeItem(item.id));
        setShowCheckoutPanel(false);
        setRemark("");
        // Show payment modal
        setPaymentOrder(orderData);
        setPaymentSuccess(false);
        setShowPaymentModal(true);
      } else {
        addToast(res.data.message || "下单失败", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("下单失败，请重试", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaymentLoading(true);
    try {
      if (paymentOrder?.id) {
        await api.put(`/orders/${paymentOrder.id}/pay`);
      }
      setPaymentSuccess(true);
      addToast("支付成功！", "success");
    } catch {
      setPaymentSuccess(true);
      addToast("支付成功！（模拟）", "success");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          购物车
        </h1>
        {items.length > 0 && (
          <button
            onClick={() => { hasSynced.current = false; syncCartItems(); }}
            disabled={syncing}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '刷新状态'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-6">购物车是空的</p>
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
          >
            去逛逛 <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="md:col-span-2 space-y-4">
            {/* Select All */}
            <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex items-center gap-3">
              <input
                type="checkbox"
                checked={allValidSelected}
                onChange={() => selectAll(!allValidSelected)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                全选（已选 {selectedItems.length}/{validItems.length} 件有效商品）
              </span>
            </div>
            {items.map((item) => {
              const isOffShelf = item.productStatus !== "ON_SALE";
              const isOutOfStock = !isOffShelf && item.stock < item.quantity;
              return (
              <div key={item.id} className={`bg-white p-4 rounded-xl border flex gap-4 ${isOffShelf ? 'border-red-100 bg-red-50/30' : isOutOfStock ? 'border-orange-100 bg-orange-50/30' : item.selected ? 'border-green-200 bg-green-50/20' : 'border-gray-100'}`}>
                {!isOffShelf && (
                  <div className="flex items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                    />
                  </div>
                )}
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className={`w-full h-full object-cover ${isOffShelf ? 'grayscale opacity-60' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  {isOffShelf && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                       <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">已下架</span>
                     </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className={`font-medium ${isOffShelf ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{item.productName}</h3>
                        {isOffShelf && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                该商品已下架，无法购买
                            </p>
                        )}
                        {isOutOfStock && (
                            <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                库存不足（剩余 {item.stock} {item.unit}）
                            </p>
                        )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className={`font-bold ${isOffShelf ? 'text-gray-400' : 'text-red-600'}`}>
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className={`flex items-center border rounded-lg ${isOffShelf ? 'border-gray-200 opacity-50 pointer-events-none' : 'border-gray-200'}`}>
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-2 py-1 hover:bg-gray-50 text-gray-600"
                      >
                        -
                      </button>
                      <span className="px-2 text-sm text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                        className="px-2 py-1 hover:bg-gray-50 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>

          {/* Right sidebar: Address + Order summary */}
          <div className="md:col-span-1 space-y-4">
            {/* Address selection card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-green-600" />
                  收货地址
                </h3>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  管理
                </button>
              </div>

              {selectedAddress ? (
                <div
                  className="p-3 bg-green-50 rounded-xl border border-green-100 cursor-pointer hover:bg-green-100/60 transition-colors"
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-gray-900 text-sm">{selectedAddress.receiverName}</span>
                    <span className="text-gray-500 text-xs">{selectedAddress.receiverPhone}</span>
                    {selectedAddress.isDefault && (
                      <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">默认</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedAddress.fullAddress}</p>
                  <div className="flex items-center justify-end mt-1">
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      点击更换 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (addresses.length === 0) {
                      openAddAddress();
                    } else {
                      setShowAddressModal(true);
                    }
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex flex-col items-center gap-1"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">{addresses.length === 0 ? "添加收货地址" : "选择收货地址"}</span>
                </button>
              )}
            </div>

            {/* Order summary card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">订单摘要</h3>
              <div className="flex justify-between mb-2 text-sm text-gray-600">
                <span>已选商品</span>
                <span>{selectedItems.reduce((acc, item) => acc + item.quantity, 0)} 件</span>
              </div>
              {hasOffShelfItems && (
                  <div className="flex justify-between mb-2 text-sm text-red-500">
                    <span>失效商品</span>
                    <span>{items.length - validItems.length} 件</span>
                  </div>
              )}
              {hasOutOfStockItems && (
                  <div className="flex justify-between mb-2 text-sm text-orange-500">
                    <span>库存不足</span>
                    <span>请调整数量</span>
                  </div>
              )}
              <div className="flex justify-between mb-4 text-lg font-bold text-gray-900 border-t pt-4 border-gray-100">
                <span>合计</span>
                <span className="text-red-600">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Remark input */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">订单备注（选填）</label>
                <input
                  type="text"
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="如：请周末配送"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={loading || selectedItems.length === 0 || !selectedAddress}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    selectedItems.length === 0 || !selectedAddress
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? "处理中..." : syncing ? "同步中..." : !selectedAddress ? "请先选择地址" : selectedItems.length === 0 ? "请选择商品" : `提交订单 (${selectedItems.length}件)`}
              </button>
              {!selectedAddress && selectedItems.length > 0 && (
                <p className="text-xs text-orange-500 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  请先选择收货地址才能下单
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Address Selection Modal ===== */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="选择收货地址">
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">暂无收货地址</p>
              <button
                onClick={() => { setShowAddressModal(false); openAddAddress(); }}
                className="text-green-600 font-medium text-sm hover:text-green-700"
              >
                + 添加新地址
              </button>
            </div>
          ) : (
            <>
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedAddress?.id === addr.id
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                  }`}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-sm text-gray-900">{addr.receiverName}</span>
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{addr.receiverPhone}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">默认</span>
                      )}
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 ml-5">{addr.fullAddress}</p>
                  <div className="flex items-center gap-3 mt-2 ml-5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddressModal(false); openEditAddress(addr); }}
                      className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <Edit className="w-3 h-3" /> 编辑
                    </button>
                    {!addr.isDefault && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                        className="text-[11px] text-gray-400 hover:text-green-600 flex items-center gap-0.5"
                      >
                        <Star className="w-3 h-3" /> 设为默认
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                      className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> 删除
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => { setShowAddressModal(false); openAddAddress(); }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> 添加新地址
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* ===== Payment Simulation Modal ===== */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          if (paymentSuccess) {
            setShowPaymentModal(false);
            navigate("/profile");
          }
        }}
        title={paymentSuccess ? "支付成功" : "订单支付"}
      >
        <div className="space-y-6">
          {!paymentSuccess ? (
            <>
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">订单已创建，请完成支付</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(paymentOrder?.totalAmount || totalAmount || 0)}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">选择支付方式：</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-colors">
                    <input type="radio" name="payMethod" defaultChecked className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">微信支付</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-colors">
                    <input type="radio" name="payMethod" className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">支付宝</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-colors">
                    <input type="radio" name="payMethod" className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">银行卡支付</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPaymentModal(false); addToast("订单已创建，可在个人中心查看并支付", "info"); navigate("/profile"); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  稍后支付
                </button>
                <button
                  onClick={handleSimulatePayment}
                  disabled={paymentLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {paymentLoading ? "支付中..." : "确认支付"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">支付成功！</h3>
              <p className="text-sm text-gray-500 mb-6">商家将尽快确认并发货，请耐心等待</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPaymentModal(false); navigate("/profile"); }}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  查看订单
                </button>
                <button
                  onClick={() => { setShowPaymentModal(false); navigate("/products"); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  继续购物
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== Address Form Modal (Add/Edit) ===== */}
      <Modal
        isOpen={showAddressFormModal}
        onClose={() => setShowAddressFormModal(false)}
        title={editingAddress ? "编辑地址" : "添加新地址"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              收货人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addressForm.receiverName}
              onChange={e => setAddressForm(f => ({ ...f, receiverName: e.target.value }))}
              placeholder="请输入收货人姓名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号码 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={addressForm.receiverPhone}
              onChange={e => setAddressForm(f => ({ ...f, receiverPhone: e.target.value }))}
              placeholder="请输入手机号码"
              maxLength={11}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                省份 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addressForm.province}
                onChange={e => setAddressForm(f => ({ ...f, province: e.target.value }))}
                placeholder="省"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                城市 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                placeholder="市"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                区/县
              </label>
              <input
                type="text"
                value={addressForm.district}
                onChange={e => setAddressForm(f => ({ ...f, district: e.target.value }))}
                placeholder="区"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细地址 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={addressForm.detail}
              onChange={e => setAddressForm(f => ({ ...f, detail: e.target.value }))}
              placeholder="街道、门牌号等"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">设为默认地址</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddressFormModal(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveAddress}
              disabled={addressLoading}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {addressLoading ? "保存中..." : "保存地址"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
