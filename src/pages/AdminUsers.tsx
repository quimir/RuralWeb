import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "../store/useToast";
import { Modal } from "../components/ui/Modal";
import {
  Search, Users, Shield, UserCheck, UserX, Key, Trash2,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";

const ROLE_MAP: Record<string, string> = {
  TOURIST: "游客",
  FARMER: "农户",
  MERCHANT: "商家",
  FINANCIAL_PROVIDER: "金融服务商",
  INSURANCE_PROVIDER: "保险服务商",
  ADMIN: "管理员",
};

const ROLE_COLORS: Record<string, string> = {
  TOURIST: "bg-gray-100 text-gray-700",
  FARMER: "bg-green-100 text-green-700",
  MERCHANT: "bg-blue-100 text-blue-700",
  FINANCIAL_PROVIDER: "bg-purple-100 text-purple-700",
  INSURANCE_PROVIDER: "bg-orange-100 text-orange-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default function AdminUsers() {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!userInfo || userInfo.role !== "ADMIN") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${page}&size=${size}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      const res = await api.get(url);
      const data = res.data?.data;
      if (data?.records) {
        setUsers(data.records);
        setTotal(data.total || 0);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      }
    } catch (err) {
      console.error(err);
      addToast("获取用户列表失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = (user: any) => {
    const isEnabled = user.enabled !== false;
    const action = isEnabled ? "禁用" : "启用";
    setConfirmDialog({
      isOpen: true,
      title: `确定要${action}用户 "${user.nickname || user.username}" 吗？`,
      onConfirm: async () => {
        try {
          const res = await api.put(`/admin/users/${user.id}`, {
            enabled: !isEnabled,
          });
          if (res.data.code === 200) {
            addToast(`已${action}用户`, "success");
            fetchUsers();
          } else {
            addToast(res.data.message || "操作失败", "error");
          }
        } catch (err) {
          addToast("操作失败", "error");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleResetPassword = (user: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `确定要重置用户 "${user.nickname || user.username}" 的密码为 123456 吗？`,
      onConfirm: async () => {
        try {
          const res = await api.put(`/admin/users/${user.id}/reset-pwd`);
          if (res.data.code === 200) {
            addToast("密码已重置为 123456", "success");
          } else {
            addToast(res.data.message || "重置失败", "error");
          }
        } catch (err) {
          addToast("重置失败", "error");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteUser = (user: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `确定要删除用户 "${user.nickname || user.username}" 吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/admin/users/${user.id}`);
          if (res.data.code === 200) {
            addToast("用户已删除", "success");
            fetchUsers();
          } else {
            addToast(res.data.message || "删除失败", "error");
          }
        } catch (err) {
          addToast("删除失败", "error");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const totalPages = Math.ceil(total / size);

  if (!userInfo || userInfo.role !== "ADMIN") return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            用户管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 位注册用户</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名或昵称..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="">全部角色</option>
            {Object.entries(ROLE_MAP).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无匹配用户</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">用户</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">角色</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">状态</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">注册时间</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => {
                    const isEnabled = user.enabled !== false;
                    return (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                (user.nickname || user.username)?.[0] || "U"
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.nickname || user.username}</div>
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                            {ROLE_MAP[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isEnabled ? 'text-green-600' : 'text-red-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {isEnabled ? '正常' : '已禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {user.createdAt || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isEnabled
                                  ? 'text-orange-500 hover:bg-orange-50'
                                  : 'text-green-500 hover:bg-green-50'
                              }`}
                              title={isEnabled ? '禁用' : '启用'}
                            >
                              {isEnabled ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="重置密码"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {users.map((user: any) => {
                const isEnabled = user.enabled !== false;
                return (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                          {(user.nickname || user.username)?.[0] || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.nickname || user.username}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                        {ROLE_MAP[user.role] || user.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${isEnabled ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {isEnabled ? '正常' : '已禁用'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg ${isEnabled ? 'text-orange-500 bg-orange-50' : 'text-green-500 bg-green-50'}`}
                        >
                          {isEnabled ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 text-blue-500 bg-blue-50 rounded-lg"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-500 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title="确认操作"
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              确定
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
