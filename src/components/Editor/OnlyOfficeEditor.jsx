import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  Edit3,
  History,
  FileText,
  Download,
  Share2,
  GitCommit,
} from "lucide-react";
import CommitVersionModal from "../Versions/CommitVersionModal";
import {
  findOrCreateDocSpaceFile,
  getPublicRoomShareInfo,
  PWC_PUBLIC_SHARE_URL,
} from "../../services/docspaceService";

export default function OnlyOfficeEditor({
  document: docItem,
  canEdit = true,
  currentUser = "Admin",
  onClose,
  onOpenVersions,
}) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState(null);

  const [embedUrl, setEmbedUrl] = useState("");
  const [shareLink, setShareLink] = useState(PWC_PUBLIC_SHARE_URL);
  const [directEditorUrl, setDirectEditorUrl] = useState(null);
  const [docSpaceFileId, setDocSpaceFileId] = useState(null);
  const [showCommitModal, setShowCommitModal] = useState(false);

  // Khởi tạo phòng làm việc chung và đồng bộ file
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setSyncing(true);
        setError(null);

        // 1. Lấy thông tin chia sẻ phòng PWC và tìm/đồng bộ file
        const result = await findOrCreateDocSpaceFile(docItem);

        if (!isMounted) return;

        if (result.fileId) {
          setDocSpaceFileId(result.fileId);
          setDirectEditorUrl(result.editorUrl);
          // Mở đúng trình soạn thảo của file này, không mở danh sách phòng
          setEmbedUrl(result.sdkEditorUrl || result.editorUrl);
        } else if (result.shareInfo) {
          setEmbedUrl(result.shareInfo.embedUrl);
        }

        if (result.shareInfo) {
          setShareLink(result.shareInfo.shareLink);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo ONLYOFFICE Editor:", err);
        if (isMounted) {
          setError(
            "Không thể kết nối đến máy chủ ONLYOFFICE DocSpace. Vui lòng kiểm tra lại kết nối mạng."
          );
        }
      } finally {
        if (isMounted) {
          setSyncing(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [docItem]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
      {/* Header bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800/95 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/80 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600 hover:text-white"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white truncate max-w-md">
                {docItem.name}
              </h1>
              {canEdit ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <Edit3 size={11} /> Có quyền chỉnh sửa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                  <Lock size={11} /> Chế độ chỉ đọc
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Phòng làm việc chung PWC • Phiên bản v{docItem.current_version || 1} • Không cần đăng nhập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Nút mở riêng trình soạn thảo Word trên tab mới */}
          {directEditorUrl ? (
            <a
              href={directEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <ExternalLink size={14} />
              Mở Word trên tab mới
            </a>
          ) : (
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/20 px-3.5 py-2 text-xs font-bold text-blue-300 transition hover:bg-blue-500/30"
            >
              <ExternalLink size={14} />
              Mở toàn màn hình
            </a>
          )}

          {/* Nút Tạo phiên bản (Commit) trực tiếp khi đang soạn thảo */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowCommitModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30 shadow-sm"
            >
              <GitCommit size={14} className="text-emerald-400" />
              Tạo phiên bản (Commit)
            </button>
          )}

          {/* Lịch sử phiên bản */}
          {onOpenVersions && (
            <button
              type="button"
              onClick={() => onOpenVersions(docItem)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-600 hover:text-white"
            >
              <History size={14} className="text-cyan-400" />
              Lịch sử phiên bản
            </button>
          )}

          {/* Tải file gốc từ Supabase */}
          <a
            href={docItem.file_url}
            download
            className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
          >
            <Download size={14} />
            Tải file gốc
          </a>
        </div>
      </header>

      {/* Editor Main Canvas */}
      <main className="relative flex-1 bg-slate-950 flex flex-col">
        {/* Thanh hướng dẫn nhanh */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              Đang chỉnh sửa tệp Word: <b>{docItem.name}</b> (Chế độ phòng chung PWC - Tự động lưu)
            </span>
          </div>
          {directEditorUrl && (
            <a
              href={directEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              <ExternalLink size={12} />
              Mở rộng toàn màn hình
            </a>
          )}
        </div>

        {/* Loading overlay */}
        {(loading || syncing) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-sm">
            <Loader2 className="animate-spin text-cyan-400" size={36} />
            <p className="text-sm font-medium text-slate-200">
              {syncing
                ? "Đang đồng bộ tài liệu và xác thực phòng làm việc chung..."
                : "Đang tải giao diện ONLYOFFICE DocSpace..."}
            </p>
            <p className="text-xs text-slate-400">
              Tất cả thành viên có thể xem và sửa tài liệu này mà không cần đăng nhập.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Chưa thể tải phòng làm việc</h3>
            <p className="max-w-md text-sm text-slate-400">{error}</p>
            <div className="flex items-center gap-3">
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
              >
                <ExternalLink size={16} /> Mở liên kết trực tiếp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Khung iframe nhúng phòng Public PWC */}
        {embedUrl && (
          <div className="h-full w-full flex-1">
            <iframe
              id="onlyoffice-editor-frame"
              src={embedUrl}
              title={docItem.name}
              allow="clipboard-read; clipboard-write; fullscreen; storage-access *; camera; microphone"
              className="h-full w-full border-0"
              onLoad={() => setLoading(false)}
            />
          </div>
        )}
      </main>

      {/* Modal Commit Phiên bản mới kiểu Git */}
      {showCommitModal && (
        <CommitVersionModal
          document={docItem}
          onClose={() => setShowCommitModal(false)}
          onSuccess={(updatedDoc) => {
            setShowCommitModal(false);
            alert(`Đã commit thành công phiên bản v${updatedDoc.current_version}!`);
          }}
        />
      )}
    </div>
  );
}
