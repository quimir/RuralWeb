import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { Leaf, Lock, User, Mail, Phone } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone: "",
    email: "",
    role: "TOURIST", // Default role
    orgName: "",
    licenseNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        phone: formData.phone,
        email: formData.email,
        role: formData.role,
        orgName: formData.orgName,
        licenseNo: formData.licenseNo,
      });
      
      if (res.data.code === 200) {
        alert("注册成功，请登录");
        navigate("/login");
      } else {
        setError(res.data.message || "注册失败");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">用户注册</h2>
          <p className="text-sm text-gray-500 mt-2">加入乡村振兴平台</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="username"
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="nickname"
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请输入昵称"
                value={formData.nickname}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="phone"
                type="tel"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请输入邮箱 (可选)"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="TOURIST">普通游客</option>
              <option value="FARMER">农户</option>
              <option value="MERCHANT">商家</option>
              <option value="FINANCIAL_PROVIDER">金融机构</option>
              <option value="INSURANCE_PROVIDER">保险机构</option>
            </select>
          </div>

          {(formData.role === "FINANCIAL_PROVIDER" || formData.role === "INSURANCE_PROVIDER") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">机构名称</label>
                <input
                  name="orgName"
                  type="text"
                  required
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="请输入机构名称"
                  value={formData.orgName || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">营业执照号</label>
                <input
                  name="licenseNo"
                  type="text"
                  required
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="请输入营业执照号"
                  value={formData.licenseNo || ""}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "注册中..." : "注 册"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          已有账号?{" "}
          <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
