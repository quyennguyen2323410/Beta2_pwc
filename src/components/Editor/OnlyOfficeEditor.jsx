import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  Edit3,
  History,
  ShieldAlert,
} from "lucide-react";

export default function OnlyOfficeEditor({
  document,
  canEdit = true,
  currentUser = "Admin",
  onClose,
  onOpenVersions,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const editorInstanceRef = useRef(null);
  const containerId = "onlyoffice-editor-frame";

  const serverUrl =
    import.meta.env.VITE_ONLYOFFICE_URL || "https://documentserver.onlyoffice.com";

  useEffect(() => {
    let scriptElement = null;

    const loadOnlyOffice = () => {
      const existingScript = document.getElementById("onlyoffice-api-script");

      const initEditor = () => {
        if (!window.DocsAPI) {
          setError("Không thể tải thư viện DocsAPI từ ONLYOFFICE Server.");
          setLoading(false);
          return;
        }

        try {
          if (editorInstanceRef.current) {
            try {
              editorInstanceRef.current.destroyEditor();
            } catch (e) {
              console.warn("Lỗi hủy editor cũ:", e);
            }
          }

          // Cấu hình ONLYOFFICE Docs
          const config = {
            document: {
              fileType: "docx",
              key: `doc_${document.id}_v${document.current_version}_${Date.now()}`,
              title: document.name,
              url: document.file_url,
              permissions: {
                download: true,
                edit: Boolean(canEdit),
                print: true,
                review: Boolean(canEdit),
                comment: Boolean(canEdit),
              },
            },
            documentType: "word",
            editorConfig: {
              lang: "vi",
              mode: canEdit ? "edit" : "view", // Nếu không có quyền edit, ONLYOFFICE chạy chế độ Read-Only View
              user: {
                id: `pwc_${currentUser.toLowerCase().replace(/\s+/g, "_")}`,
                name: currentUser,
              },
              customization: {
                autosave: true,
                forcesave: true,
                compactToolbar: false,
                feedback: false,
              },
            },
            height: "100%",
            width: "100%",
            events: {
              onAppReady: () => {
                setLoading(false);
              },
              onDocumentReady: () => {
                setLoading(false);
              },
              onError: (event) => {
                console.error("ONLYOFFICE Error Event:", event);
                setError(
                  `Lỗi ONLYOFFICE: ${event?.data?.errorDescription || "Không thể kết nối đến Document Server"}`
                );
                setLoading(false);
              },
            },
          };

          // Khởi tạo Document Editor
          editorInstanceRef.current = new window.DocsAPI.DocEditor(
            containerId,
            config
          );
        } catch (err) {
          console.error("Lỗi khởi tạo DocsAPI:", err);
          setError(`Lỗi khởi tạo Editor: ${err.message}`);
          setLoading(false);
        }
      };

      if (window.DocsAPI) {
        initEditor();
        return;
      }

      if (!existingScript) {
        scriptElement = window.document.createElement("script");
        scriptElement.id = "onlyoffice-api-script";
        scriptElement.src = `${serverUrl}/web-apps/apps/api/documents/api.js`;
        scriptElement.async = true;
        scriptElement.onload = initEditor;
        scriptElement.onerror = () => {
          setError(
            `Không thể tải api.js từ ONLYOFFICE Document Server (${serverUrl}). Vui lòng kiểm tra kết nối mạng.`
          );
          setLoading(false);
        };
        window.document.body.appendChild(scriptElement);
      } else {
        existingScript.onload = initEditor;
      }
    };

    loadOnlyOffice();

    return () => {
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroyEditor();
        } catch (e) {
          console.warn("Lỗi cleanup editor:", e);
        }
      }
    };
  }, [document, serverUrl, canEdit, currentUser]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
      {/* Header bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800/90 px-6 backdrop-blur">
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
              <h1 className="text-base font-semibold text-white">
                {document.name}
              </h1>
              {/* Badge phân quyền */}
              {canEdit ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <Edit3 size={11} /> Có quyền chỉnh sửa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                  <Lock size={11} /> Chế độ chỉ đọc (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              ONLYOFFICE Docs • Phiên bản v{document.current_version || 1} • Tài khoản: {currentUser}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenVersions && (
            <button
              type="button"
              onClick={() => onOpenVersions(document)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-600 hover:text-white"
            >
              <History size={14} className="text-cyan-400" />
              Lịch sử phiên bản
            </button>
          )}

          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
          >
            <ExternalLink size={14} />
            Tải file
          </a>
        </div>
      </header>

      {/* Editor Main Canvas */}
      <main className="relative flex-1 bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/90">
            <Loader2 className="animate-spin text-cyan-400" size={36} />
            <p className="text-sm font-medium text-slate-300">
              Đang kết nối ONLYOFFICE Document Server ({canEdit ? "Chế độ Soạn thảo" : "Chế độ Chỉ xem"})...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-200">
              <AlertCircle className="mx-auto mb-3 text-amber-400" size={40} />
              <h3 className="mb-2 text-base font-bold text-white">
                Không thể mở trình soạn thảo ONLYOFFICE
              </h3>
              <p className="mb-4 text-xs text-amber-200/90">{error}</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-amber-400"
                >
                  <RefreshCw size={14} /> Thử lại
                </button>
                <a
                  href={document.file_url}
                  download
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Tải file về máy
                </a>
              </div>
            </div>
          </div>
        )}

        <div id={containerId} className="h-full w-full" />
      </main>
    </div>
  );
}
