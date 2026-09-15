import React, { useState } from "react";
import {
  X,
  GitCommit,
  RefreshCw,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Tag,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  commitDocSpaceVersion,
  overwriteCurrentDocSpaceFile,
} from "../../services/docspaceService";

export default function CommitVersionModal({
  document: docItem,
  onClose,
  onSuccess,
}) {
  const currentVer = Number(docItem?.current_version) || 1;
  // "new_version": tạo phiên bản mới chính thức (mặc định); "overwrite": cập nhật đè phiên bản hiện tại
  const [syncMode, setSyncMode] = useState("new_version");
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

    try {
      setLoading(true);
      setError(null);

      let resultDoc;
      let alertMsg;

      if (syncMode === "overwrite") {
        // Cập nhật nội dung mới nhất vào phiên bản hiện tại
        const res = await overwriteCurrentDocSpaceFile(docItem);
        if (!res.success) {
          throw new Error(res.error || "Không thể đồng bộ tệp.");
        }
        resultDoc = res.doc;
        alertMsg = `Đã cập nhật nội dung mới nhất vào phiên bản hiện tại (v${currentVer})!`;
      } else {
        // Tạo phiên bản mới chính thức (Commit)
        if (!targetVersion || targetVersion <= currentVer) {
          setError(`Phiên bản mới (v${targetVersion}) phải lớn hơn phiên bản hiện tại (v${currentVer})`);
          setLoading(false);
          return;
        }

        const res = await commitDocSpaceVersion(docItem, {
          targetVersion: Number(targetVersion),
          commitMessage: commitMessage.trim() || `Commit phiên bản v${targetVersion}`,
        });
        resultDoc = res.doc;
        alertMsg = `Đã tạo thành công phiên bản mới v${res.newVersion}!`;
      }

      if (onSuccess) {
        onSuccess(resultDoc, alertMsg);
      }
      onClose();
    } catch (err) {
      console.error("Lỗi đồng bộ phiên bản:", err);
      setError(err.message || "Không thể đồng bộ tệp. Vui lòng thử lại.");
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
            <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Đồng bộ & Phát hành phiên bản
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Lấy nội dung mới nhất từ ONLYOFFICE và lưu thành phiên bản chính thức trên Supabase
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
            Bản hiện tại: <strong className="text-cyan-400">v{currentVer}</strong>
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
          {/* Lựa chọn cách thức đồng bộ */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Chọn hình thức đồng bộ:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSyncMode("new_version")}
                className={`p-3 rounded-xl border text-left transition ${
                  syncMode === "new_version"
                    ? "border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                  <GitCommit size={14} />
                  Tạo phiên bản mới (Khuyên dùng)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Tăng số version (v{currentVer + 1}) và lưu snapshot vào Supabase kèm ghi chú.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSyncMode("overwrite")}
                className={`p-3 rounded-xl border text-left transition ${
                  syncMode === "overwrite"
                    ? "border-cyan-500 bg-cyan-500/15 text-white ring-1 ring-cyan-500"
                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                  <RefreshCw size={14} />
                  Ghi đè bản hiện tại (v{currentVer})
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Chỉ cập nhật nội dung vào file hiện tại, không tăng số phiên bản.
                </p>
              </button>
            </div>
          </div>

          {/* Các tùy chọn khi chọn Tạo phiên bản mới */}
          {syncMode === "new_version" && (
            <div className="space-y-4 border-t border-slate-800 pt-3">
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
                    required={syncMode === "new_version"}
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
                  rows={2}
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung bạn đã chỉnh sửa..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Hộp giải thích quy trình */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-slate-400">
            💡 <b>Quy trình:</b> Hệ thống sẽ lưu bản soạn thảo mới nhất thành tài liệu chính thức. Sau khi đồng bộ, bất kỳ ai mở xem tài liệu cũng sẽ thấy nội dung mới này.
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
                  Đang đồng bộ dữ liệu...
                </>
              ) : syncMode === "overwrite" ? (
                <>
                  <RefreshCw size={14} />
                  Xác nhận cập nhật (v{currentVer})
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
