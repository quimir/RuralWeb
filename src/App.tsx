import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Tourism from "./pages/Tourism";
import TourismDetail from "./pages/TourismDetail";
import TourismRoutes from "./pages/TourismRoutes";
import Finance from "./pages/Finance";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import { ToastContainer } from "./components/ui/ToastContainer";

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="tourism" element={<Tourism />} />
          <Route path="tourism/routes" element={<TourismRoutes />} />
          <Route path="tourism/:id" element={<TourismDetail />} />
          <Route path="finance" element={<Finance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
