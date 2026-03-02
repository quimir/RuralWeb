import { create } from "zustand";
import { api } from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  subtotal: number;
  selected: boolean;
  stock: number;
  productStatus: string;
}

interface CartState {
  items: CartItem[];
  totalCount: number;
  selectedCount: number;
  selectedAmount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleSelect: (id: number) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  syncProductStatus: (productId: number, status: string, stock: number, price: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  totalCount: 0,
  selectedCount: 0,
  selectedAmount: 0,
  loading: false,

  /**
   * Fetch cart items from backend API.
   * Called on login, Cart page mount, and manual refresh.
   */
  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/cart");
      const data = res.data?.data;
      if (data) {
        const items: CartItem[] = (data.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage || item.coverImage,
          unitPrice: item.unitPrice ?? item.price,
          quantity: item.quantity,
          unit: item.unit || "件",
          subtotal: (item.unitPrice ?? item.price) * item.quantity,
          selected: item.selected ?? true,
          stock: item.stock ?? 999,
          productStatus: item.productStatus || item.status || "ON_SALE",
        }));
        set(calculateTotals(items));
      }
    } catch {
      // Backend may not be available, keep local state
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Add item to cart.
   * Updates local state immediately (optimistic), then syncs to backend.
   */
  addItem: (item) => {
    // Optimistic local update
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i,
        );
      } else {
        newItems = [...state.items, item];
      }
      return calculateTotals(newItems);
    });

    // Sync to backend asynchronously
    api.post("/cart", {
      productId: item.productId,
      quantity: item.quantity,
    }).catch(() => {
      // Backend sync failed, local state already updated
    });
  },

  /**
   * Remove item from cart.
   * Optimistic local update + backend sync.
   */
  removeItem: (id) => {
    set((state) => calculateTotals(state.items.filter((i) => i.id !== id)));

    // Sync to backend
    api.delete(`/cart/${id}`).catch(() => {});
  },

  /**
   * Update item quantity.
   * Optimistic local update + backend sync.
   */
  updateQuantity: (id, quantity) => {
    set((state) =>
      calculateTotals(
        state.items.map((i) =>
          i.id === id
            ? { ...i, quantity, subtotal: quantity * i.unitPrice }
            : i,
        ),
      ),
    );

    // Sync to backend
    api.put(`/cart/${id}`, { quantity }).catch(() => {});
  },

  toggleSelect: (id) => {
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      const newSelected = item ? !item.selected : true;
      // Sync selected state to backend
      api.put(`/cart/${id}`, { selected: newSelected }).catch(() => {});
      return calculateTotals(
        state.items.map((i) =>
          i.id === id ? { ...i, selected: newSelected } : i,
        ),
      );
    });
  },

  selectAll: (selected) => {
    // Sync select-all state to backend
    api.put("/cart/select-all", { selected }).catch(() => {});
    set((state) =>
      calculateTotals(state.items.map((i) => ({ ...i, selected }))),
    );
  },

  clearCart: () =>
    set({ items: [], totalCount: 0, selectedCount: 0, selectedAmount: 0 }),

  syncProductStatus: (productId, status, stock, price) =>
    set((state) =>
      calculateTotals(
        state.items.map((i) =>
          i.productId === productId
            ? { ...i, productStatus: status, stock, unitPrice: price, subtotal: i.quantity * price }
            : i,
        ),
      ),
    ),
}));

function calculateTotals(items: CartItem[]) {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedItems = items.filter((i) => i.selected);
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const selectedAmount = selectedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  return { items, totalCount, selectedCount, selectedAmount };
}

/**
 * Auto-sync cart with user auth state:
 * - On logout: clear the local cart to prevent cross-user contamination
 * - On login: fetch the new user's cart from backend
 */
useAuthStore.subscribe((state, prevState) => {
  if (prevState.userInfo && !state.userInfo) {
    // User logged out → clear cart immediately
    useCartStore.getState().clearCart();
  } else if (!prevState.userInfo && state.userInfo) {
    // User logged in → fetch their cart from backend
    useCartStore.getState().fetchCart();
  }
});
