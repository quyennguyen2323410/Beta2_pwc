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
  History,
  Shield,
  Tag,
  Play,
  Maximize2,
  LayoutGrid,
  List,
  Camera,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  getCurrentUser,
  checkUserPermission,
} from "../../services/documentService";
import {
  getDirectDocEditorUrl,
  overwriteCurrentDocSpaceFile,
} from "../../services/docspaceService";
import FilePreviewModal from "../../components/Preview/FilePreviewModal";
import VersionHistoryModal from "../../components/Versions/VersionHistoryModal";
import CommitVersionModal from "../../components/Versions/CommitVersionModal";
import PermissionModal from "../../components/Permissions/PermissionModal";

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const isMediaFile = (fileType) => {
  if (!fileType) return false;
  return [
    "image",
    "video",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "mp4",
    "webm",
    "mov",
    "avi",
  ].includes(fileType.toLowerCase());
};

export default function DocumentManagerView({
  su_co_id = null,
  thiet_bi_name = "",
  id_pq = null,
  isEmbedded = false,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);

  // Search keyword
  const [searchTerm, setSearchTerm] = useState("");

  // Sub-filter cho Media Gallery ('all' | 'image' | 'video')
  const [mediaFilter, setMediaFilter] = useState("all");

  // Chỉ định file chủ đạo (Primary Document) và media tiêu biểu (Featured Media)
  const [primaryDocId, setPrimaryDocId] = useState(null);
  const [primaryMediaId, setPrimaryMediaId] = useState(null);

  const [openingDocId, setOpeningDocId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Modal states
  const [previewDoc, setPreviewDoc] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [commitDoc, setCommitDoc] = useState(null);
  const [permissionDoc, setPermissionDoc] = useState(null);

  // Lưu quyền truy cập của từng tài liệu đối với user hiện tại
  const [userPermissions, setUserPermissions] = useState({});

  const currentUser = useMemo(() => getCurrentUser(), []);

  // File input refs
  const docInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const generalDropInputRef = useRef(null);

  // Tải danh sách tài liệu từ Supabase
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await fetchDocuments(su_co_id ? { su_co_id } : {});
      setDocuments(docs);

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
      setError("Chưa thể kết nối tới cơ sở dữ liệu Supabase. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [su_co_id]);

  const handleOpenFile = (doc) => {
    setPreviewDoc(doc);
  };

  const handleSyncSingle = (doc) => {
    setCommitDoc(doc);
  };

  const handleSyncFromOnlyOffice = async () => {
    try {
      setSyncing(true);
      let updatedCount = 0;
      for (const d of documents) {
        if (d.file_type === "docx") {
          const res = await overwriteCurrentDocSpaceFile(d);
          if (res.success) updatedCount++;
        }
      }
      await loadDocuments();
      if (updatedCount > 0) {
        alert(`Đã cập nhật nội dung mới nhất cho ${updatedCount} tài liệu thành công!`);
      } else {
        alert("Tất cả tài liệu Word đã ở trạng thái mới nhất!");
      }
    } catch (e) {
      console.error("Lỗi đồng bộ:", e);
      alert("Đồng bộ thất bại: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenWordEditor = async (doc) => {
    if (userPermissions[doc.id] !== "edit") {
      alert("Tài khoản của bạn chỉ có quyền xem, không có quyền chỉnh sửa file Word.");
      return;
    }

    try {
      setOpeningDocId(doc.id);
      const newTab = window.open("about:blank", "_blank");
      if (newTab) {
        newTab.document.title = `Đang mở ${doc.name}...`;
      }

      const editorUrl = await getDirectDocEditorUrl(doc);
      if (newTab) {
        newTab.location.replace(editorUrl);
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

  const handleFileUpload = async (files, customCategory = "") => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const newDocs = [];
      const failedFiles = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(
          fileList.length > 1
            ? `Đang tải lên (${i + 1}/${fileList.length}): ${file.name}...`
            : `Đang tải lên: ${file.name}...`
        );

        try {
          const extraMeta = {};
          if (su_co_id) extraMeta.su_co_id = su_co_id;
          if (thiet_bi_name) extraMeta.thiet_bi_name = thiet_bi_name;
          if (id_pq) extraMeta.id_pq = id_pq;

          // Tự động phân loại danh mục nếu không truyền cứng
          let assignedCategory = customCategory;
          if (!assignedCategory) {
            const ext = file.name.split(".").pop().toLowerCase();
            assignedCategory = isMediaFile(ext)
              ? "Ảnh & Video sửa chữa"
              : "Tài liệu kỹ thuật";
          }

          const summaryText = su_co_id
            ? `${assignedCategory} (${thiet_bi_name || "Thiết bị"})`
            : "Khởi tạo tài liệu ban đầu";

          const newDoc = await uploadDocument(file, summaryText, extraMeta);
          newDocs.push(newDoc);
        } catch (fileErr) {
          console.error(`Lỗi tải tệp ${file.name}:`, fileErr);
          failedFiles.push(`${file.name} (${fileErr.message || "Lỗi"})`);
        }
      }

      if (newDocs.length > 0) {
        setDocuments((prev) => [...newDocs, ...prev]);
        setUserPermissions((prev) => {
          const next = { ...prev };
          newDocs.forEach((d) => {
            next[d.id] = "edit";
          });
          return next;
        });
      }

      if (failedFiles.length > 0) {
        setError(
          `Có ${failedFiles.length}/${fileList.length} tệp tải lên thất bại: ${failedFiles.join(", ")}`
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Lỗi trong quá trình tải file lên.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (docInputRef.current) docInputRef.current.value = "";
      if (mediaInputRef.current) mediaInputRef.current.value = "";
      if (generalDropInputRef.current) generalDropInputRef.current.value = "";
    }
  };

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa tệp "${doc.name}" cùng toàn bộ lịch sử các phiên bản không?`
      )
    ) {
      return;
    }

    try {
      await deleteDocument(doc.id, doc.storage_path, doc.name);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      if (primaryDocId === doc.id) setPrimaryDocId(null);
      if (primaryMediaId === doc.id) setPrimaryMediaId(null);
    } catch (err) {
      alert(`Xóa thất bại: ${err.message}`);
    }
  };

  // Lọc theo từ khóa tìm kiếm
  const matchedDocs = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const kw = searchTerm.toLowerCase().trim();
    return documents.filter(
      (d) =>
        d.name?.toLowerCase().includes(kw) ||
        d.thiet_bi_name?.toLowerCase().includes(kw) ||
        d.file_type?.toLowerCase().includes(kw)
    );
  }, [documents, searchTerm]);

  // Phân vùng 1: Danh sách tài liệu kỹ thuật
  const technicalDocs = useMemo(() => {
    return matchedDocs.filter((d) => !isMediaFile(d.file_type));
  }, [matchedDocs]);

  // Xác định file chủ đạo (Word ưu tiên, hoặc do user chọn)
  const primaryDoc = useMemo(() => {
    if (technicalDocs.length === 0) return null;
    if (primaryDocId) {
      const found = technicalDocs.find((d) => d.id === primaryDocId);
      if (found) return found;
    }
    // Mặc định: file docx đầu tiên, nếu không có thì lấy file đầu tiên
    return (
      technicalDocs.find((d) => ["docx", "doc"].includes(d.file_type?.toLowerCase())) ||
      technicalDocs[0]
    );
  }, [technicalDocs, primaryDocId]);

  // Danh sách tài liệu phụ trợ xung quanh (loại trừ file chủ đạo)
  const supportingDocs = useMemo(() => {
    if (!primaryDoc) return technicalDocs;
    return technicalDocs.filter((d) => d.id !== primaryDoc.id);
  }, [technicalDocs, primaryDoc]);

  // Phân vùng 2: Danh sách ảnh & video
  const mediaDocs = useMemo(() => {
    const list = matchedDocs.filter((d) => isMediaFile(d.file_type));
    if (mediaFilter === "image") {
      return list.filter((d) => d.file_type !== "video");
    }
    if (mediaFilter === "video") {
      return list.filter((d) => d.file_type === "video");
    }
    return list;
  }, [matchedDocs, mediaFilter]);

  // Xác định media tiêu biểu (Video ưu tiên, hoặc ảnh do user chọn)
  const featuredMedia = useMemo(() => {
    if (mediaDocs.length === 0) return null;
    if (primaryMediaId) {
      const found = mediaDocs.find((m) => m.id === primaryMediaId);
      if (found) return found;
    }
    // Mặc định: video đầu tiên (nếu có), hoặc ảnh đầu tiên
    return (
      mediaDocs.find((m) => m.file_type === "video") || mediaDocs[0]
    );
  }, [mediaDocs, primaryMediaId]);

  // Danh sách media phụ xung quanh (loại trừ media tiêu biểu)
  const surroundingMedia = useMemo(() => {
    if (!featuredMedia) return mediaDocs;
    return mediaDocs.filter((m) => m.id !== featuredMedia.id);
  }, [mediaDocs, featuredMedia]);

  const getDocTypeBadge = (type) => {
    switch (type) {
      case "docx":
      case "doc":
        return {
          icon: <FileText size={15} className="text-blue-600" />,
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          label: "DOCX",
        };
      case "pdf":
        return {
          icon: <File size={15} className="text-rose-600" />,
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          label: "PDF",
        };
      case "pptx":
      case "ppt":
        return {
          icon: <FileText size={15} className="text-amber-600" />,
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          label: "PPTX",
        };
      default:
        return {
          icon: <File size={15} className="text-slate-600" />,
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          label: (type || "FILE").toUpperCase(),
        };
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Hidden file inputs */}
      <input
        ref={docInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".docx,.doc,.pdf,.pptx,.ppt"
        onChange={(e) => handleFileUpload(e.target.files, "Tài liệu kỹ thuật")}
      />
      <input
        ref={mediaInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,.mov,.avi"
        onChange={(e) => handleFileUpload(e.target.files, "Ảnh & Video sửa chữa")}
      />
      <input
        ref={generalDropInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".docx,.doc,.pdf,.pptx,.ppt,.jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,.mov,.avi"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* TOP CONTROL BAR: Tinh tế, thanh lịch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-4 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2f69d9]">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#183f82]">
              Tài liệu kỹ thuật số & Đa phương tiện
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số {documents.length} tệp ({technicalDocs.length} tài liệu văn bản, {mediaDocs.length} ảnh/video)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu, ảnh, video..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#2f69d9] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2f69d9]"
            />
          </div>

          <button
            type="button"
            onClick={handleSyncFromOnlyOffice}
            disabled={syncing || loading}
            title="Đồng bộ nội dung Word mới nhất từ ONLYOFFICE"
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#2f69d9] hover:bg-blue-100 transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Đang đồng bộ..." : "Đồng bộ Word"}
          </button>

          <button
            type="button"
            onClick={loadDocuments}
            title="Làm mới danh sách"
            className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Progress alert */}
      {uploadProgress && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-semibold text-[#183f82] animate-pulse">
          <RefreshCw size={13} className="animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* Alert lỗi nếu có */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHÂN VÙNG 1: TÀI LIỆU KỸ THUẬT */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2f69d9]"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183f82]">
              Tài liệu kỹ thuật
            </h4>
            <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#2f69d9]">
              {technicalDocs.length} tệp
            </span>
          </div>

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            disabled={uploading}
            className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-[#2f69d9] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#2356b8] transition active:scale-95 disabled:opacity-50"
          >
            <Plus size={14} />
            Thêm tài liệu (Word, PDF, PPTX)
          </button>
        </div>

        {technicalDocs.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files, "Tài liệu kỹ thuật");
            }}
            onClick={() => docInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-center hover:border-blue-300 hover:bg-blue-50/20 transition"
          >
            <FileText size={22} className="text-slate-400 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">
              Chưa có tài liệu kỹ thuật nào
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nhấn vào đây để tải lên tài liệu Word (.docx), PDF (.pdf) hoặc Datasheet (.pptx)
            </p>
          </div>
        ) : (
          /* BỐ CỤC: TÀI LIỆU CHÍNH (TRÁI) & TỆP ĐÍNH KÈM KHÁC (PHẢI) */
          <div className="grid gap-4 lg:grid-cols-12 items-start">
            {/* CỘT 1 (5/12): THẺ TÀI LIỆU CHÍNH */}
            {primaryDoc && (
              <div className="lg:col-span-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/30 via-white to-slate-50 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-[#1e40af]">
                      <FileText size={12} />
                      Tài liệu chính
                    </span>

                    <button
                      type="button"
                      onClick={() => setHistoryDoc(primaryDoc)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs hover:bg-slate-50"
                    >
                      <History size={11} />
                      v{primaryDoc.current_version || 1}
                    </button>
                  </div>

                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h5
                        onClick={() => handleOpenFile(primaryDoc)}
                        className="cursor-pointer text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition"
                        title={primaryDoc.name}
                      >
                        {primaryDoc.name}
                      </h5>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{getDocTypeBadge(primaryDoc.file_type).label}</span>
                        <span>•</span>
                        <span>{formatSize(primaryDoc.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Cập nhật gần nhất:</span>
                      <span className="font-medium text-slate-700">
                        {primaryDoc.updated_at || primaryDoc.created_at
                          ? new Date(primaryDoc.updated_at || primaryDoc.created_at).toLocaleDateString("vi-VN")
                          : "---"}
                      </span>
                    </div>
                    {primaryDoc.summary && (
                      <div className="mt-1 text-[11px] text-slate-500 truncate" title={primaryDoc.summary}>
                        {primaryDoc.summary}
                      </div>
                    )}
                  </div>
                </div>

                {/* Các nút hành động lớn cho Tài liệu chủ đạo */}
                <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Chỉnh sửa Word trực tuyến */}
                    {["docx", "doc"].includes(primaryDoc.file_type?.toLowerCase()) &&
                      userPermissions[primaryDoc.id] === "edit" && (
                        <button
                          type="button"
                          onClick={() => handleOpenWordEditor(primaryDoc)}
                          disabled={openingDocId === primaryDoc.id}
                          className="h-8 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                          {openingDocId === primaryDoc.id ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" /> Mở...
                            </>
                          ) : (
                            <>
                              <Edit3 size={12} /> Soạn thảo Word
                            </>
                          )}
                        </button>
                      )}

                    {/* Xem tài liệu */}
                    <button
                      type="button"
                      onClick={() => handleOpenFile(primaryDoc)}
                      className="h-8 inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      <Eye size={12} /> Xem
                    </button>

                    {/* Đồng bộ commit */}
                    {["docx", "doc"].includes(primaryDoc.file_type?.toLowerCase()) &&
                      userPermissions[primaryDoc.id] === "edit" && (
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(primaryDoc)}
                          title="Tạo phiên bản mới (Commit)"
                          className="h-8 px-2 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPermissionDoc(primaryDoc)}
                      title="Phân quyền"
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                    >
                      <Shield size={14} />
                    </button>
                    <a
                      href={primaryDoc.file_url}
                      download
                      title="Tải về"
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(primaryDoc)}
                      title="Xóa"
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CỘT 2 (7/12): CÁC TỆP ĐÍNH KÈM KHÁC (PDF, PPTX, BẢN VẼ...) */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Tệp đính kèm khác ({supportingDocs.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  PDF, Word, Bản vẽ kỹ thuật
                </span>
              </div>

              {supportingDocs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
                  Không có tệp đính kèm nào khác. Nhấn <b>"Thêm tài liệu"</b> để tải thêm tệp.
                </div>
              ) : (
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  {supportingDocs.map((doc) => {
                    const badge = getDocTypeBadge(doc.file_type);
                    const canEdit = userPermissions[doc.id] === "edit";

                    return (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-blue-300 hover:shadow-sm transition"
                      >
                        <div
                          onClick={() => handleOpenFile(doc)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                        >
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.badge}`}
                          >
                            {badge.label}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                              <span>{formatSize(doc.size)}</span>
                              <span>•</span>
                              <span>v{doc.current_version || 1}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Đặt làm tài liệu chính */}
                          <button
                            type="button"
                            onClick={() => setPrimaryDocId(doc.id)}
                            title="Đặt làm tài liệu chính"
                            className="h-7 px-2 rounded text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span className="hidden sm:inline">Đặt làm chính</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenFile(doc)}
                            className="h-7 px-2.5 rounded bg-slate-800 text-[11px] font-semibold text-white hover:bg-slate-700"
                          >
                            Xem
                          </button>

                          {["docx", "doc"].includes(doc.file_type?.toLowerCase()) && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenWordEditor(doc)}
                              className="h-7 px-2 rounded bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-700"
                            >
                              Sửa
                            </button>
                          )}

                          <a
                            href={doc.file_url}
                            download
                            className="p-1.5 text-slate-400 hover:text-slate-700"
                          >
                            <Download size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PHÂN VÙNG 2: HÌNH ẢNH & VIDEO SỬA CHỮA */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-800"></span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183f82]">
              Hình ảnh & Video sửa chữa
            </h4>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {mediaDocs.length} tệp
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bộ lọc media */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {[
                { id: "all", label: "Tất cả" },
                { id: "image", label: "Ảnh" },
                { id: "video", label: "Video" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setMediaFilter(pill.id)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                    mediaFilter === pill.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploading}
              className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-xs font-bold text-white shadow-sm hover:bg-slate-900 transition active:scale-95 disabled:opacity-50"
            >
              <Plus size={14} />
              Thêm ảnh / Video
            </button>
          </div>
        </div>

        {mediaDocs.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files, "Ảnh & Video sửa chữa");
            }}
            onClick={() => mediaInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-center hover:border-slate-400 hover:bg-slate-100/50 transition"
          >
            <Camera size={22} className="text-slate-400 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">
              Chưa có hình ảnh hoặc video sửa chữa nào
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nhấn vào đây để tải lên hình ảnh chụp lỗi hiện trường (.jpg, .png) hoặc video clip sửa chữa (.mp4)
            </p>
          </div>
        ) : (
          /* BỐ CỤC: XEM TRƯỚC (TRÁI) & DANH SÁCH ẢNH/VIDEO (PHẢI) */
          <div className="grid gap-4 lg:grid-cols-12 items-start">
            {/* CỘT 1 (5/12): XEM TRƯỚC HÌNH ẢNH / VIDEO TRỌN VẸN */}
            {featuredMedia && (
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-900 text-white overflow-hidden shadow-sm flex flex-col">
                <div className="px-3.5 py-2.5 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-200 text-xs">
                    {featuredMedia.file_type === "video" ? (
                      <Film size={13} className="text-sky-400" />
                    ) : (
                      <ImageIcon size={13} className="text-emerald-400" />
                    )}
                    <span>Xem trước {featuredMedia.file_type === "video" ? "video" : "hình ảnh"}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatSize(featuredMedia.size)}
                  </span>
                </div>

                {/* Khung xem trọn vẹn không bị cắt hình ảnh (object-contain) */}
                <div
                  onClick={() => handleOpenFile(featuredMedia)}
                  className="relative aspect-video w-full cursor-pointer bg-black flex items-center justify-center overflow-hidden group select-none"
                >
                  {featuredMedia.file_type === "video" ? (
                    <>
                      <video
                        src={featuredMedia.file_url}
                        preload="metadata"
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl group-hover:scale-110 transition">
                          <Play size={20} className="ml-1 fill-slate-900" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={featuredMedia.file_url}
                        alt={featuredMedia.name}
                        className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-3 bg-slate-900 flex items-center justify-between text-xs border-t border-slate-800">
                  <div className="truncate mr-2">
                    <div className="font-semibold text-white truncate" title={featuredMedia.name}>
                      {featuredMedia.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {featuredMedia.created_at
                        ? new Date(featuredMedia.created_at).toLocaleDateString("vi-VN")
                        : "---"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenFile(featuredMedia)}
                      className="h-7 px-2.5 rounded bg-cyan-600 text-[11px] font-bold text-white hover:bg-cyan-500 transition"
                    >
                      {featuredMedia.file_type === "video" ? "Phát" : "Phóng to"}
                    </button>
                    <a
                      href={featuredMedia.file_url}
                      download
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <Download size={13} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(featuredMedia)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CỘT 2 (7/12): DANH SÁCH ẢNH & VIDEO */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Danh sách ảnh & video ({surroundingMedia.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Chọn để xem trước
                </span>
              </div>

              {surroundingMedia.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-400">
                  Không có tệp hình ảnh hoặc video nào khác.
                </div>
              ) : (
                <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 max-h-[300px] overflow-y-auto pr-1">
                  {surroundingMedia.map((item) => {
                    const isVid = item.file_type === "video";

                    return (
                      <div
                        key={item.id}
                        className="group relative flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-[#2f69d9] hover:shadow-sm transition"
                      >
                        {/* Thumbnail hiển thị trọn vẹn object-contain */}
                        <div
                          onClick={() => setPrimaryMediaId(item.id)}
                          className="relative aspect-video w-full cursor-pointer bg-slate-950 flex items-center justify-center overflow-hidden"
                          title="Bấm để xem trước"
                        >
                          {isVid ? (
                            <>
                              <video
                                src={item.file_url}
                                preload="metadata"
                                className="max-h-full max-w-full object-contain opacity-70 group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow">
                                  <Play size={12} className="ml-0.5 fill-slate-900" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-bold text-white">
                                VID
                              </span>
                            </>
                          ) : (
                            <>
                              <img
                                src={item.file_url}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                              />
                              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-bold text-white">
                                ẢNH
                              </span>
                            </>
                          )}
                        </div>

                        {/* Caption & Actions */}
                        <div className="p-2 flex items-center justify-between text-[11px] bg-white">
                          <div
                            onClick={() => setPrimaryMediaId(item.id)}
                            className="cursor-pointer font-medium text-slate-700 truncate mr-1 hover:text-[#2f69d9]"
                            title={item.name}
                          >
                            {item.name}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenFile(item)}
                              title="Mở xem đầy đủ"
                              className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <Maximize2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              title="Xóa"
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VÙNG KÉO THẢ TỆP TINH GỌN */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => generalDropInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 py-3.5 px-6 text-center hover:border-[#2f69d9] hover:bg-blue-50/20 transition shadow-sm"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <UploadCloud size={16} className="text-[#2f69d9]" />
          <span>Kéo thả hoặc nhấn để chọn tải lên nhiều tệp cùng lúc</span>
          <span className="text-[11px] text-slate-400 font-normal">
            (Hỗ trợ tải lên nhiều tệp đồng thời: Word, PDF, PPTX, hình ảnh, video...)
          </span>
        </div>
      </div>

      {/* MODALS */}
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

      {permissionDoc && (
        <PermissionModal
          document={permissionDoc}
          onClose={() => {
            setPermissionDoc(null);
            loadDocuments();
          }}
        />
      )}

      {previewDoc && (
        <FilePreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
