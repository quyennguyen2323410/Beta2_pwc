import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit3,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Lock,
} from "lucide-react";
import {
  getAuthUser,
  fetchUsers,
  createUser,
  toggleWordPermission,
  deleteUser,
} from "../../services/authService";

export default function UserManager() {
  const [currentUser, setCurrentUser] = useState(() => getAuthUser());
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    can_edit_word: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Lỗi tải users:", err);
      setError(
        "Chưa tải được danh sách tài khoản. Hãy chắc chắn bạn đã chạy script SQL 'implements/create_app_users.sql' trong Supabase."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password) {
      alert("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setFormSubmitting(true);
      setError(null);
      await createUser(newUser);
      setSuccessMsg(`Tạo tài khoản "${newUser.username.trim()}" thành công!`);
      setNewUser({ username: "", password: "", can_edit_word: false });
      setShowAddModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err.message || "Tạo người dùng thất bại.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePermission = async (user) => {
    if (user.role === "admin" || user.username === "admin") {
      alert("Tài khoản Quản trị viên (Admin) luôn có toàn quyền sửa Word!");
      return;
    }

    try {
      const updated = await toggleWordPermission(user.id, user.can_edit_word);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, can_edit_word: updated.can_edit_word } : u))
      );
      setSuccessMsg(
        `Đã ${updated.can_edit_word ? "CẤP QUYỀN SỬA WORD" : "THU HỒI QUYỀN SỬA WORD"} cho "${user.username}"`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message || "Lỗi cập nhật quyền.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === "admin" || user.username === "admin") {
      alert("Không thể xóa tài khoản Quản trị viên!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.username}"?`)) {
      return;
    }

    try {
      await deleteUser(user);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccessMsg(`Đã xóa tài khoản "${user.username}" thành công.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message || "Lỗi xóa người dùng.");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [users, searchTerm]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = users.length;
    const canEdit = users.filter((u) => u.role === "admin" || u.can_edit_word).length;
    const viewOnly = total - canEdit;
    return { total, canEdit, viewOnly };
  }, [users]);

  // Kiểm tra quyền Admin
  if (!currentUser?.isAdmin && currentUser?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Lock size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Truy cập bị từ chối
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Chỉ tài khoản <b>Quản trị viên (Admin)</b> mới có quyền quản lý người dùng, tạo tài khoản và phân quyền sửa file Word.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b8ea0] text-white shadow-md">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Quản lý Người dùng & Phân quyền Word
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Tạo tài khoản và phân 2 quyền cơ bản: <b>Được sửa Word</b> hoặc <b>Chỉ xem</b>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Làm mới danh sách"
            className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#0f8fad] px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0d7d97] transition active:scale-95"
          >
            <UserPlus size={18} />
            Thêm người dùng mới
          </button>
        </div>
      </div>

      {/* Thông báo Alert */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800 shadow-xs">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thẻ Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số tài khoản
            </span>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-800">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-slate-400">Người dùng trên hệ thống</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Có quyền sửa Word
            </span>
            <Edit3 size={18} className="text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-700">
            {stats.canEdit}
          </div>
          <p className="mt-1 text-xs text-emerald-600/80">Được soạn thảo, chỉnh sửa tệp Word</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chỉ được xem (View only)
            </span>
            <Eye size={18} className="text-slate-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-700">
            {stats.viewOnly}
          </div>
          <p className="mt-1 text-xs text-slate-500">Không có quyền chỉnh sửa file Word</p>
        </div>
      </div>

      {/* Bảng Danh sách Người dùng */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#0b8ea0] focus:bg-white focus:ring-2 focus:ring-[#0b8ea0]/20"
            />
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <b>{filteredUsers.length}</b> tài khoản
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Tài khoản</th>
                <th className="py-3.5 px-6">Vai trò</th>
                <th className="py-3.5 px-6">Quyền sửa file Word</th>
                <th className="py-3.5 px-6 text-center">Cấp / Thu hồi quyền</th>
                <th className="py-3.5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin" || u.username === "admin";
                  const canEditWord = isAdmin || u.can_edit_word;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Tài khoản */}
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.username}</div>
                            {isAdmin && (
                              <div className="text-[11px] text-blue-600 font-medium">
                                Quản trị hệ thống
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Vai trò */}
                      <td className="py-4 px-6">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            <Shield size={13} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Người dùng
                          </span>
                        )}
                      </td>

                      {/* Trạng thái quyền Word */}
                      <td className="py-4 px-6">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Toàn quyền (Admin)
                          </span>
                        ) : canEditWord ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Được sửa file Word
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            <Eye size={14} /> Chỉ xem (Không sửa)
                          </span>
                        )}
                      </td>

                      {/* Nút Cấp / Thu hồi quyền */}
                      <td className="py-4 px-6 text-center">
                        {isAdmin ? (
                          <span className="text-xs text-slate-400 font-medium">
                            Mặc định
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(u)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                              u.can_edit_word
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {u.can_edit_word ? (
                              <>
                                <Eye size={13} /> Thu hồi quyền sửa
                              </>
                            ) : (
                              <>
                                <Edit3 size={13} /> Cấp quyền sửa Word
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Thao tác xóa */}
                      <td className="py-4 px-6 text-right">
                        {isAdmin ? (
                          <span className="text-xs text-slate-300 font-mono">
                            Khóa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            title="Xóa tài khoản này"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm người dùng mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-[#0b8ea0]">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Thêm người dùng mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: kythuat1, nhanvien..."
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mật khẩu đăng nhập *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUser.can_edit_word}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        can_edit_word: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0b8ea0] focus:ring-[#0b8ea0]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-800">
                      Cho phép sửa file Word
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      Nếu tích chọn, người dùng này sẽ có quyền soạn thảo và chỉnh sửa file Word trực tuyến. Nếu không, tài khoản chỉ có quyền xem.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#0f8fad] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#0d7d97] disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} /> Tạo tài khoản
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
