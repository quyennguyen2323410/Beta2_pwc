import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FileText,
  UploadCloud,
  File,
  Film,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Edit3,
  Eye,
  Download,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  History,
  Shield,
  Lock,
  User,
  Clock,
  GitCommit,
} from "lucide-react";
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  getFileType,
  getCurrentUser,
  checkUserPermission,
} from "../../services/documentService";
import {
  getDirectDocEditorUrl,
  syncDocSpaceFileToSupabase,
  overwriteCurrentDocSpaceFile,
} from "../../services/docspaceService";
import FilePreviewModal from "../../components/Preview/FilePreviewModal";
import VersionHistoryModal from "../../components/Versions/VersionHistoryModal";
import CommitVersionModal from "../../components/Versions/CommitVersionModal";
import PermissionModal from "../../components/Permissions/PermissionModal";

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openingDocId, setOpeningDocId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingDocId, setSyncingDocId] = useState(null);

  // Modal states
  const [previewDoc, setPreviewDoc] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [commitDoc, setCommitDoc] = useState(null);
  const [permissionDoc, setPermissionDoc] = useState(null);

  // Lưu quyền truy cập của từng tài liệu đối với user hiện tại: { [docId]: 'edit' | 'view' }
  const [userPermissions, setUserPermissions] = useState({});

  const currentUser = useMemo(() => getCurrentUser(), []);
  const fileInputRef = useRef(null);

  // Load danh sách tài liệu từ Supabase và kiểm tra quyền
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await fetchDocuments();
      setDocuments(docs);

      // Tính toán quyền cho từng tài liệu
      const perms = {};
      await Promise.all(
        docs.map(async (doc) => {
          const perm = await checkUserPermission(doc, currentUser);
          perms[doc.id] = perm;
        })
      );
      setUserPermissions(perms);
    } catch (err) {
      console.error("Lỗi tải documents:", err);
      setError(
        "Chưa thể kết nối tới bảng 'documents' trên Supabase. Hãy chạy script trong implements/upgrade_permissions_versions.sql"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Mở tệp để xem/chỉnh sửa (tự động chọn đúng trình xem theo loại tệp)
  const handleOpenFile = (doc) => {
    if (doc.file_type === "docx") {
      handleOpenWordEditor(doc);
    } else {
      setPreviewDoc(doc);
    }
  };

  // Mở hộp thoại tạo phiên bản mới (Commit version)
  const handleSyncSingle = (doc) => {
    setCommitDoc(doc);
  };

  // Kéo nội dung mới nhất từ ONLYOFFICE về ghi đè file hiện tại (không tăng version)
  const handleSyncFromOnlyOffice = async () => {
    try {
      setSyncing(true);
      let updatedCount = 0;
      for (const d of documents) {
        if (d.file_type === "docx") {
          const res = await overwriteCurrentDocSpaceFile(d);
          if (res.success) {
            updatedCount++;
          }
        }
      }
      await loadDocuments();
      if (updatedCount > 0) {
        alert(`Đã cập nhật nội dung mới nhất cho ${updatedCount} tài liệu từ ONLYOFFICE!`);
      } else {
        alert("Tất cả tài liệu đã ở trạng thái mới nhất!");
      }
    } catch (e) {
      console.error("Lỗi đồng bộ:", e);
      alert("Đồng bộ thất bại: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Mở thẳng trình soạn thảo Word trên tab mới (không qua modal)
  const handleOpenWordEditor = async (doc) => {
    try {
      setOpeningDocId(doc.id);
      const newTab = window.open("about:blank", "_blank");
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Đang mở Word - ${doc.name}</title>
              <meta charset="utf-8" />
            </head>
            <body style="background:#0f172a;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="text-align:center;padding:28px 36px;border-radius:20px;background:#1e293b;border:1px solid #334155;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                <div style="margin-bottom:12px;display:inline-block;width:24px;height:24px;border:3px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
                <h3 style="margin:0 0 8px 0;font-size:17px;font-weight:700;">Đang kết nối ONLYOFFICE Word Editor...</h3>
                <p style="margin:0 0 12px 0;color:#94a3b8;font-size:13px;">${doc.name}</p>
                <p style="margin:0;color:#38bdf8;font-size:12px;font-weight:500;">Tự động nạp tài liệu không cần đăng nhập...</p>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
              </div>
            </body>
          </html>
        `);
      }

      const editorUrl = await getDirectDocEditorUrl(doc);
      if (newTab) {
        newTab.location.href = editorUrl;
      } else {
        window.open(editorUrl, "_blank");
      }
    } catch (err) {
      console.error("Lỗi mở editor:", err);
      alert("Không thể mở trình soạn thảo: " + err.message);
    } finally {
      setOpeningDocId(null);
    }
  };

  // Xử lý upload file
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(`Đang tải lên Supabase: ${file.name}...`);

      const newDoc = await uploadDocument(file, "Khởi tạo tài liệu ban đầu");
      setDocuments((prev) => [newDoc, ...prev]);
      setUserPermissions((prev) => ({ ...prev, [newDoc.id]: "edit" }));
      setUploadProgress(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Lỗi trong quá trình tải file lên.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xử lý xóa file
  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa tệp "${doc.name}" cùng toàn bộ lịch sử phiên bản và bản lưu trên ONLYOFFICE không?`
      )
    ) {
      return;
    }

    try {
      await deleteDocument(doc.id, doc.storage_path, doc.name);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      alert(`Xóa thất bại: ${err.message}`);
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Lấy icon theo loại file
  const getFileBadge = (type) => {
    switch (type) {
      case "docx":
        return {
          icon: <FileText size={18} className="text-blue-500" />,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          label: "DOCX",
        };
      case "pdf":
        return {
          icon: <File size={18} className="text-rose-500" />,
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          label: "PDF",
        };
      case "image":
        return {
          icon: <ImageIcon size={18} className="text-emerald-500" />,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "IMAGE",
        };
      case "video":
        return {
          icon: <Film size={18} className="text-purple-500" />,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "VIDEO",
        };
      case "pptx":
        return {
          icon: <Layers size={18} className="text-amber-500" />,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          label: "PPTX",
        };
      default:
        return {
          icon: <File size={18} className="text-slate-500" />,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          label: type.toUpperCase(),
        };
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesType =
      filterType === "all" ? true : doc.file_type === filterType;
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      {/* Top Banner & Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                POC Cloud MVP
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Database size={13} /> Supabase PostgreSQL & Storage
              </span>
              <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Đăng nhập: <b>{currentUser}</b>
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Quản lý tài liệu, Phân quyền & Soạn thảo Word
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Hỗ trợ phân quyền chỉnh sửa • Lưu lịch sử phiên bản • ONLYOFFICE Docs trực tuyến
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncFromOnlyOffice}
              disabled={syncing || loading}
              title="Kéo phiên bản mới nhất vừa sửa từ ONLYOFFICE về lưu vào Supabase"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Đang đồng bộ..." : "Đồng bộ từ ONLYOFFICE"}
            </button>
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:brightness-105 active:scale-95 disabled:opacity-50"
            >
              <UploadCloud size={18} />
              {uploading ? "Đang tải lên..." : "Tải lên tệp"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".docx,.doc,.pdf,.pptx,.ppt,.jpg,.jpeg,.png,.webp,.mp4,.webm"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Alert lỗi nếu có */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
          <div className="flex-1 text-sm">
            <h4 className="font-bold">Lưu ý cấu hình Database</h4>
            <p className="mt-0.5 text-amber-800">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className="mb-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cyan-200 bg-gradient-to-b from-cyan-50/40 via-white to-transparent p-8 text-center transition hover:border-cyan-400"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
          <UploadCloud size={30} />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Kéo thả tệp vào đây hoặc nhấn để tải lên
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Hỗ trợ: Word (.docx), PDF (.pdf), PowerPoint (.pptx), Ảnh (.jpg, .png), Video (.mp4)
        </p>
        {uploadProgress && (
          <div className="mt-4 flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-semibold text-cyan-800 animate-pulse">
            <RefreshCw size={13} className="animate-spin" />
            {uploadProgress}
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {[
            { id: "all", label: "Tất cả" },
            { id: "docx", label: "Word (.docx)" },
            { id: "pdf", label: "PDF" },
            { id: "image", label: "Hình ảnh" },
            { id: "video", label: "Video" },
            { id: "pptx", label: "PowerPoint" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === tab.id
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search box */}
        <div className="relative min-w-[260px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Documents List / Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-cyan-600" />
            <p className="mt-3 text-sm font-medium">Đang tải danh sách từ Supabase...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <File size={26} />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Chưa có tài liệu nào
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Hãy bấm nút "Tải lên tệp" ở trên để đưa tệp DOCX, PDF, hoặc Media vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-4">Tên tệp</th>
                  <th className="px-4 py-3.5">Định dạng</th>
                  <th className="px-4 py-3.5">Kích thước</th>
                  <th className="px-4 py-3.5">Phiên bản</th>
                  <th className="px-4 py-3.5">Người tạo / Sửa</th>
                  <th className="px-4 py-3.5">Quyền của bạn</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocs.map((doc) => {
                  const badge = getFileBadge(doc.file_type);
                  const canEdit = userPermissions[doc.id] === "edit";

                  return (
                    <tr
                      key={doc.id}
                      className="group transition hover:bg-cyan-50/30"
                    >
                      {/* Name (Clickable để mở xem file) */}
                      <td className="py-4 pl-6 pr-4">
                        <div
                          onClick={() => handleOpenFile(doc)}
                          className="flex items-center gap-3 cursor-pointer group/name select-none"
                          title="Bấm để mở xem hoặc chỉnh sửa tệp này"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition group-hover/name:bg-cyan-100 group-hover/name:scale-105">
                            {badge.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 line-clamp-1 transition group-hover/name:text-cyan-600">
                              {doc.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {doc.storage_path}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-4 text-xs text-slate-600 font-mono">
                        {formatSize(doc.size)}
                      </td>

                      {/* Version (Clickable badge to open Version History) */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setHistoryDoc(doc)}
                          title="Bấm để xem lịch sử các phiên bản"
                          className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-800 transition hover:bg-cyan-100 active:scale-95"
                        >
                          <History size={12} />
                          v{doc.current_version || 1}
                        </button>
                      </td>

                      {/* Creator & Last Updater */}
                      <td className="px-4 py-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-700">
                          {doc.updated_by || doc.created_by || "Admin"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {doc.updated_at
                            ? new Date(doc.updated_at).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "---"}
                        </div>
                      </td>

                      {/* Permission Badge */}
                      <td className="px-4 py-4">
                        {canEdit ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <Edit3 size={11} /> Chỉnh sửa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                            <Lock size={11} /> Chỉ xem
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút thao tác chính: Mở Word trên tab mới */}
                          {doc.file_type === "docx" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenWordEditor(doc)}
                              disabled={openingDocId === doc.id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95 ${
                                canEdit
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-slate-700 hover:bg-slate-800"
                              }`}
                            >
                              {openingDocId === doc.id ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" />
                                  Đang nạp...
                                </>
                              ) : (
                                <>
                                  {canEdit ? <Edit3 size={13} /> : <Eye size={13} />}
                                  {canEdit ? "Sửa Word" : "Xem Word"}
                                  <ExternalLink size={12} className="opacity-80" />
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                            >
                              <Eye size={13} />
                              Xem
                            </button>
                          )}

                          {/* Nút Commit / Tạo phiên bản mới kiểu Git */}
                          {doc.file_type === "docx" && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleSyncSingle(doc)}
                              title="Tạo phiên bản mới (Commit version) từ ONLYOFFICE"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-600"
                            >
                              <GitCommit size={16} />
                            </button>
                          )}

                          {/* Lịch sử phiên bản */}
                          <button
                            type="button"
                            onClick={() => setHistoryDoc(doc)}
                            title="Lịch sử phiên bản"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-cyan-600"
                          >
                            <History size={15} />
                          </button>

                          {/* Phân quyền */}
                          <button
                            type="button"
                            onClick={() => setPermissionDoc(doc)}
                            title="Phân quyền truy cập"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                          >
                            <Shield size={15} />
                          </button>

                          {/* Tải về */}
                          <a
                            href={doc.file_url}
                            download
                            title="Tải tệp về máy"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Download size={15} />
                          </a>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            title="Xóa tệp"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lịch sử phiên bản */}
      {historyDoc && (
        <VersionHistoryModal
          document={historyDoc}
          canEdit={userPermissions[historyDoc.id] === "edit"}
          onClose={() => setHistoryDoc(null)}
          onVersionUpdated={(updatedDoc) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
            );
            setHistoryDoc(updatedDoc);
          }}
        />
      )}

      {/* Modal Đồng bộ & Commit phiên bản mới (Git-style) */}
      {commitDoc && (
        <CommitVersionModal
          document={commitDoc}
          onClose={() => setCommitDoc(null)}
          onSuccess={(updatedDoc) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
            );
            loadDocuments();
          }}
        />
      )}

      {/* Modal Phân quyền người dùng */}
      {permissionDoc && (
        <PermissionModal
          document={permissionDoc}
          onClose={() => {
            setPermissionDoc(null);
            loadDocuments();
          }}
        />
      )}

      {/* Modal Preview tệp (Image, Video, PDF, PPTX) */}
      {previewDoc && (
        <FilePreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
