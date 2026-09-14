import React, { useState } from "react";
import {
  X,
  GitCommit,
  Layers,
  Sparkles,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Tag,
  MessageSquare,
} from "lucide-react";
import { commitDocSpaceVersion } from "../../services/docspaceService";

export default function CommitVersionModal({
  document: docItem,
  onClose,
  onSuccess,
}) {
  const currentVer = Number(docItem?.current_version) || 1;
  const [targetVersion, setTargetVersion] = useState(currentVer + 1);
  const [commitMessage, setCommitMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestedVersions = [
    { label: `v${currentVer + 1} (Kế tiếp)`, value: currentVer + 1 },
    { label: `v${currentVer + 2}`, value: currentVer + 2 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetVersion || targetVersion <= currentVer) {
      setError(`Phiên bản mới (v${targetVersion}) phải lớn hơn phiên bản hiện tại (v${currentVer})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await commitDocSpaceVersion(docItem, {
        targetVersion: Number(targetVersion),
        commitMessage: commitMessage.trim() || `Commit phiên bản v${targetVersion}`,
      });

      if (onSuccess) {
        onSuccess(result.doc);
      }
      onClose();
    } catch (err) {
      console.error("Lỗi commit phiên bản:", err);
      setError(err.message || "Không thể tạo phiên bản mới. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <GitCommit size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Đồng bộ & Tạo phiên bản mới
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Đóng gói nội dung mới nhất từ ONLYOFFICE thành Snapshot lịch sử
            </p>
          </div>
        </div>

        {/* Thông tin tài liệu */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText size={18} className="text-blue-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-200 truncate">
              {docItem.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300 flex-shrink-0">
            Hiện tại: <strong className="text-cyan-400">v{currentVer}</strong>
          </span>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chọn số phiên bản */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-cyan-400" />
              Phiên bản mới mục tiêu:
            </label>
            <div className="flex items-center gap-2 mb-2">
              {suggestedVersions.map((sug) => (
                <button
                  key={sug.value}
                  type="button"
                  onClick={() => setTargetVersion(sug.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    targetVersion === sug.value
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm"
                      : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {sug.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">
                v
              </span>
              <input
                type="number"
                min={currentVer + 1}
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="2"
              />
            </div>
          </div>

          {/* Nhập ghi chú thay đổi (Commit message) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-cyan-400" />
              Ghi chú thay đổi (Commit message):
            </label>
            <textarea
              rows={3}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Mô tả tóm tắt nội dung bạn đã chỉnh sửa (vd: Sửa điều khoản thanh toán mục 4.2 và cập nhật bảng giá)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Ghi chú này sẽ được lưu lại trong lịch sử để cả nhóm dễ dàng theo dõi.
            </p>
          </div>

          {/* Hộp giải thích quy trình */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-slate-400">
            💡 <b>Quy trình:</b> Hệ thống sẽ kéo bản lưu mới nhất từ ONLYOFFICE DocSpace, sao lưu vào Storage dưới mã <b>v{targetVersion}</b> và thêm dòng lịch sử phiên bản mới vào Supabase.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang đóng gói phiên bản...
                </>
              ) : (
                <>
                  <GitCommit size={14} />
                  Xác nhận tạo phiên bản v{targetVersion}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
