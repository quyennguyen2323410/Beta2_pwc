import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  Lock,
  Edit3,
  Eye,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react";
import {
  fetchDocumentPermissions,
  grantDocumentPermission,
  removeDocumentPermission,
  getCurrentUser,
} from "../../services/documentService";

export default function PermissionModal({ document, onClose }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("edit");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUser = getCurrentUser();

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDocumentPermissions(document.id);
      setPermissions(data);
    } catch (err) {
      console.error("Lỗi tải phân quyền:", err);
      setError("Chưa thể tải danh sách phân quyền.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document?.id) {
      loadPermissions();
    }
  }, [document?.id]);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await grantDocumentPermission(
        document.id,
        userEmail.trim(),
        selectedRole
      );

      setSuccess(`Đã cấp quyền "${selectedRole === "edit" ? "Chỉnh sửa" : "Chỉ xem"}" cho ${userEmail.trim()}`);
      setUserEmail("");
      await loadPermissions();
    } catch (err) {
      setError(err.message || "Không thể cấp quyền.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (permId, targetUser) => {
    if (!window.confirm(`Bạn có chắc muốn thu hồi quyền của ${targetUser}?`)) return;

    try {
      await removeDocumentPermission(permId);
      setPermissions((prev) => prev.filter((p) => p.id !== permId));
    } catch (err) {
      alert(`Lỗi thu hồi quyền: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Phân quyền tài liệu
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {document.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Form cấp quyền */}
          <form onSubmit={handleGrant} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Cấp quyền mới cho người dùng
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Tên tài khoản hoặc Email (VD: kythuat1)..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="edit">Được chỉnh sửa (Edit)</option>
                <option value="view">Chỉ xem (Read-Only)</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Cấp quyền
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              * Người có quyền <b>"Chỉnh sửa"</b> mới có thể mở ONLYOFFICE để sửa nội dung và lưu phiên bản mới.
            </p>
          </form>

          {/* Danh sách người có quyền */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách quyền truy cập
            </h4>

            {/* Chủ sở hữu / Người tạo */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/20 px-4 py-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">
                  <User size={14} />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {document.created_by || "Admin"}
                  </div>
                  <div className="text-[11px] text-slate-400">Người tạo tài liệu</div>
                </div>
              </div>
              <span className="rounded-md bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                Toàn quyền (Owner)
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <RefreshCw size={20} className="animate-spin text-blue-400" />
              </div>
            ) : permissions.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                Chưa có tài khoản nào được phân quyền riêng biệt. Mọi người dùng khác mặc định ở chế độ{" "}
                <b className="text-slate-300">"{document.default_permission === "edit" ? "Chỉnh sửa" : "Chỉ xem"}"</b>.
              </p>
            ) : (
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 overflow-hidden">
                {permissions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-900/60 px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {p.user_email}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Cấp bởi: {p.granted_by || "Admin"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                          p.permission === "edit"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {p.permission === "edit" ? (
                          <>
                            <Edit3 size={11} /> Chỉnh sửa
                          </>
                        ) : (
                          <>
                            <Eye size={11} /> Chỉ xem
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemove(p.id, p.user_email)}
                        title="Thu hồi quyền"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
