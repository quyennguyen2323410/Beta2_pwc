import React, { useEffect, useState, useRef } from "react";
import {
  X,
  History,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  fetchDocumentVersions,
  createNewVersion,
} from "../../services/documentService";
import FilePreviewModal from "../Preview/FilePreviewModal";

export default function VersionHistoryModal({
  document,
  onClose,
  onVersionUpdated,
  canEdit,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState(null);
  const [previewVersionDoc, setPreviewVersionDoc] = useState(null);

  const fileInputRef = useRef(null);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDocumentVersions(document.id);
      setVersions(data);
    } catch (err) {
      console.error("Lỗi tải lịch sử phiên bản:", err);
      setError("Chưa thể tải lịch sử phiên bản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (document?.id) {
      loadVersions();
    }
  }, [document?.id]);

  const handleUploadNewVersion = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setUploading(true);
      setError(null);
      const updatedDoc = await createNewVersion(
        document.id,
        document,
        file,
        changeNote.trim() || "Cập nhật tài liệu bản mới"
      );

      setChangeNote("");
      setShowUploadForm(false);
      await loadVersions();
      if (onVersionUpdated) onVersionUpdated(updatedDoc);
    } catch (err) {
      console.error("Lỗi cập nhật phiên bản mới:", err);
      setError(err.message || "Không thể cập nhật phiên bản mới.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Lịch sử phiên bản
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {document.name} • Hiện tại: v{document.current_version || 1}
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
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action to upload new version */}
          {canEdit && (
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
              {!showUploadForm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Cập nhật phiên bản mới (v{(document.current_version || 1) + 1})
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tải lên file mới để ghi nhận vào lịch sử phiên bản
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-cyan-500"
                  >
                    <UploadCloud size={15} />
                    Tải bản mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Tải lên phiên bản v{(document.current_version || 1) + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ghi chú thay đổi (ví dụ: Chỉnh sửa điều 3 hợp đồng...)"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />

                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                    >
                      {uploading ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <UploadCloud size={14} />
                      )}
                      {uploading ? "Đang lưu phiên bản mới..." : "Chọn file cập nhật"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleUploadNewVersion(e.target.files)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline of versions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lịch sử các lần lưu
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-cyan-400" />
                <p className="mt-2 text-xs">Đang tải các phiên bản...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                Chưa có lịch sử phiên bản nào được ghi nhận cho tài liệu này.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 pl-6">
                {versions.map((ver, index) => {
                  const isLatest = index === 0;
                  return (
                    <div key={ver.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          isLatest
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-slate-600 bg-slate-900 group-hover:border-cyan-400"
                        }`}
                      />

                      {/* Card Content */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition hover:border-slate-700 hover:bg-slate-800/70">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                  isLatest
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                Phiên bản v{ver.version}
                              </span>
                              {isLatest && (
                                <span className="text-[11px] font-semibold text-emerald-400">
                                  (Bản hiện tại)
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm font-medium text-slate-200">
                              {ver.change_summary || "Cập nhật tài liệu"}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-500" />
                                Người sửa:{" "}
                                <b className="text-slate-300">
                                  {ver.modified_by}
                                </b>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-slate-500" />
                                {ver.created_at
                                  ? new Date(ver.created_at).toLocaleString(
                                      "vi-VN"
                                    )
                                  : "---"}
                              </span>
                              <span className="font-mono text-slate-400">
                                {formatSize(ver.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewVersionDoc({
                                  ...document,
                                  name: `${document.name} (v${ver.version})`,
                                  file_url: ver.file_url,
                                  current_version: ver.version,
                                  updated_at: ver.created_at,
                                })
                              }
                              title={`Xem trước phiên bản v${ver.version}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-cyan-600 hover:border-cyan-500 hover:text-white"
                            >
                              <Eye size={15} />
                            </button>

                            <a
                              href={ver.file_url}
                              download
                              title="Tải bản này về máy"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-cyan-600 hover:border-cyan-500 hover:text-white"
                            >
                              <Download size={15} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {previewVersionDoc && (
        <FilePreviewModal
          document={previewVersionDoc}
          onClose={() => setPreviewVersionDoc(null)}
        />
      )}
    </div>
  );
}
