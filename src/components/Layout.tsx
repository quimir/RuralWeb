import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Map, Wallet, User, LogOut, ShoppingCart, Shield } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { cn } from "../lib/utils";

export default function Layout() {
  const { userInfo, logout } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = userInfo?.role;
  const isAdmin = role === "ADMIN";
  const isFinancialProvider = role === "FINANCIAL_PROVIDER";
  const isInsuranceProvider = role === "INSURANCE_PROVIDER";
  // Only consumers (TOURIST/FARMER/MERCHANT) should see cart
  const showCart = role && ["TOURIST", "FARMER", "MERCHANT"].includes(role);

  const navItems = [
    { to: "/", icon: Home, label: "首页" },
    { to: "/products", icon: ShoppingBag, label: "农产品" },
    { to: "/tourism", icon: Map, label: "乡村游" },
    { to: "/finance", icon: Wallet, label: "金融服务" },
    { to: "/profile", icon: User, label: "我的" },
  ];

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">乡</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">乡村振兴管理系统</h1>
        </div>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-green-600",
                  isActive ? "text-green-600" : "text-gray-600",
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-green-600",
                  isActive ? "text-green-600" : "text-gray-600",
                )
              }
            >
              <Shield className="w-4 h-4" />
              管理
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {showCart && (
            <NavLink
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </NavLink>
          )}

          {userInfo ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                欢迎, {userInfo.nickname}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              登录 / 注册
            </NavLink>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-center px-4 py-3 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">乡</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">乡村振兴</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                isActive
                  ? "text-green-600"
                  : "text-gray-500 hover:text-gray-900",
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
