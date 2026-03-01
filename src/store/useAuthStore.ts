import { create } from "zustand";

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  role:
    | "TOURIST"
    | "FARMER"
    | "MERCHANT"
    | "FINANCIAL_PROVIDER"
    | "INSURANCE_PROVIDER"
    | "ADMIN";
  avatar: string | null;
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  userInfo: JSON.parse(localStorage.getItem("userInfo") || "null"),
  login: (token, userInfo) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    set({ token, userInfo });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    set({ token: null, userInfo: null });
  },
}));
