import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
  Loader2,
  FileText,
  HelpCircle,
  Activity,
  Layers,
  Save,
  ChevronRight,
  RotateCw,
  Copy,
} from "lucide-react";
import { fetchDmaErrorById, updateDmaError } from "../../API/dmaApi";
import DocumentManagerView from "../Documents/DocumentManagerView";
import IncidentTodoList from "./components/IncidentTodoList";
import CauseRemedyTree from "./components/CauseRemedyTree";
import { getCategoryIcon } from "../../lib/categoryIcons";

export default function IncidentDetail() {
  const { id, group, device } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Lấy tên nhóm và tên thiết bị từ incident hoặc từ params
  const groupName = incident?.loai_thiet_bi || (group ? decodeURIComponent(group) : "");
  const deviceName = incident?.ten_thiet_bi || (device ? decodeURIComponent(device) : "");

  // Tab: 'TinhTrang' (Đầu tiên) | 'NguyenNhan' (Xổ ra hướng khắc phục) | 'TaiLieu'
  const [activeTab, setActiveTab] = useState("TinhTrang");

  // State inline edit cho Tình trạng
  const [isEditingTinhTrang, setIsEditingTinhTrang] = useState(false);
  const [tinhTrangInput, setTinhTrangInput] = useState("");
  const [isSavingTinhTrang, setIsSavingTinhTrang] = useState(false);
  const [copiedTinhTrang, setCopiedTinhTrang] = useState(false);

  // State inline edit cho Số sự cố
  const [isEditingLoi, setIsEditingLoi] = useState(false);
  const [loiInput, setLoiInput] = useState(1);
  const [isSavingLoi, setIsSavingLoi] = useState(false);

  // State Modal chỉnh sửa sự cố
  const [openEditModal, setOpenEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    loi_so: 1,
    tinh_trang: "",
    nguyen_nhan: "",
    huong_khac_phuc: "",
  });

  // Tải chi tiết sự cố trực tiếp từ Supabase
  const loadIncidentDetail = async (isBackground = false) => {
    if (!id) return;
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const data = await fetchDmaErrorById(id);
      if (!data) {
        setError(`Không tìm thấy thông tin sự cố với mã #${id}`);
      } else {
        setIncident(data);
        setTinhTrangInput(data.tinh_trang || "");
        setLoiInput(data.loi_so || 1);
        setEditForm({
          loi_so: data.loi_so || 1,
          tinh_trang: data.tinh_trang || "",
          nguyen_nhan: data.nguyen_nhan || "",
          huong_khac_phuc: data.huong_khac_phuc || "",
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết sự cố:", err);
      setError("Không thể nạp dữ liệu sự cố từ hệ thống. Vui lòng thử lại.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Làm mới dữ liệu không tải lại trang
  const handleReloadIncident = async () => {
    try {
      setIsRefreshing(true);
      await loadIncidentDetail(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncidentDetail();
  }, [id]);

  // Xử lý quay lại danh sách nối tiếp
  const handleBack = () => {
    if (groupName && deviceName) {
      navigate(`/Library/${encodeURIComponent(groupName)}/${encodeURIComponent(deviceName)}`);
    } else if (groupName) {
      navigate(`/Library/${encodeURIComponent(groupName)}`);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/Library");
    }
  };

  // Lưu chỉnh sửa thông tin sự cố từ Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      await updateDmaError(id, {
        loi: editForm.loi_so,
        tinh_trang: editForm.tinh_trang,
        nguyen_nhan: editForm.nguyen_nhan,
        huong_khac_phuc: editForm.huong_khac_phuc,
      });

      setIncident((prev) => ({
        ...prev,
        loi_so: editForm.loi_so,
        tinh_trang: editForm.tinh_trang,
        nguyen_nhan: editForm.nguyen_nhan,
        huong_khac_phuc: editForm.huong_khac_phuc,
      }));
      setTinhTrangInput(editForm.tinh_trang);
      setLoiInput(editForm.loi_so);

      setOpenEditModal(false);
    } catch (err) {
      console.error("Lỗi cập nhật sự cố:", err);
      alert("Cập nhật thất bại: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Lưu riêng trường Số sự cố trực tiếp
  const handleSaveLoi = async () => {
    const val = parseInt(loiInput);
    if (isNaN(val) || val <= 0) {
      alert("Vui lòng nhập số sự cố hợp lệ (số nguyên > 0)");
      return;
    }
    try {
      setIsSavingLoi(true);
      await updateDmaError(id, { loi: val });
      setIncident((prev) => ({
        ...prev,
        loi_so: val,
      }));
      setEditForm((prev) => ({
        ...prev,
        loi_so: val,
      }));
      setLoiInput(val);
      setIsEditingLoi(false);
    } catch (err) {
      console.error("Lỗi cập nhật sự cố:", err);
      alert("Cập nhật số sự cố thất bại: " + err.message);
    } finally {
      setIsSavingLoi(false);
    }
  };

  // Lưu riêng trường Tình trạng trực tiếp
  const handleSaveTinhTrang = async () => {
    try {
      setIsSavingTinhTrang(true);
      await updateDmaError(id, { tinh_trang: tinhTrangInput });
      setIncident((prev) => ({
        ...prev,
        tinh_trang: tinhTrangInput,
      }));
      setEditForm((prev) => ({
        ...prev,
        tinh_trang: tinhTrangInput,
      }));
      setIsEditingTinhTrang(false);
    } catch (err) {
      console.error("Lỗi cập nhật tình trạng:", err);
      alert("Cập nhật tình trạng thất bại: " + err.message);
    } finally {
      setIsSavingTinhTrang(false);
    }
  };

  // Lưu đồng thời Nguyên nhân & Hướng khắc phục từ Tree Component
  const handleSaveCauseAndRemedy = async ({ nguyen_nhan, huong_khac_phuc }) => {
    try {
      await updateDmaError(id, { nguyen_nhan, huong_khac_phuc });
      setIncident((prev) => ({
        ...prev,
        nguyen_nhan,
        huong_khac_phuc,
      }));
      setEditForm((prev) => ({
        ...prev,
        nguyen_nhan,
        huong_khac_phuc,
      }));
    } catch (err) {
      console.error("Lỗi cập nhật nguyên nhân & hướng khắc phục:", err);
      throw err;
    }
  };

  const cardClass =
    "rounded-[26px] border border-[#8db0ee] bg-white p-5 md:p-6 shadow-[0_10px_25px_rgba(37,99,235,0.06)]";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-6 py-4 font-semibold text-slate-700 shadow-sm">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          Đang truy vấn chi tiết sự cố #{id}...
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg">
          <AlertTriangle size={40} className="mx-auto text-rose-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Thông báo</h2>
          <p className="mt-1 text-sm text-slate-600">{error || "Không tìm thấy dữ liệu"}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <ArrowLeft size={16} /> Quay lại thư viện
          </button>
        </div>
      </div>
    );
  }

  // 3 Tabs theo cấu trúc mới: Tình trạng (ở đầu) -> Nguyên nhân (xổ ra Hướng khắc phục) -> Tài liệu kỹ thuật
  const tabs = [
    {
      key: "TinhTrang",
      label: "Tình trạng",
      icon: <Activity size={18} strokeWidth={2.5} />,
      color: "text-blue-600",
    },
    {
      key: "NguyenNhan",
      label: "Nguyên nhân & Hướng khắc phục",
      icon: <HelpCircle size={18} strokeWidth={2.5} />,
      color: "text-amber-600",
    },
    {
      key: "TaiLieu",
      label: "Tài liệu kỹ thuật",
      icon: <Layers size={18} strokeWidth={2.5} />,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header Thông tin Sự cố */}
        <div className="rounded-[24px] border border-[#8db0ee] bg-white p-5 md:p-6 shadow-sm">
          {/* Breadcrumbs Path Nối tiếp */}
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => navigate("/Library")}
              className="transition hover:text-blue-600"
            >
              Thư viện kỹ thuật
            </button>
            {groupName && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <button
                  type="button"
                  onClick={() => navigate(`/Library/${encodeURIComponent(groupName)}`)}
                  className="transition text-[#244a8a] hover:text-blue-600"
                >
                  {groupName}
                </button>
              </>
            )}
            {deviceName && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/Library/${encodeURIComponent(groupName || "all")}/${encodeURIComponent(deviceName)}`
                    )
                  }
                  className="transition text-[#244a8a] hover:text-blue-600"
                >
                  {deviceName}
                </button>
              </>
            )}
            <ChevronRight size={13} className="text-slate-400" />
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800 font-bold">
              Sự cố: {incident.loi_so}
            </span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={handleBack}
                className="mb-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#4f72ad] transition hover:bg-[#f0f5ff] hover:text-[#1d478d]"
              >
                <ArrowLeft size={15} /> Quay lại danh sách
              </button>

              <div className="flex items-center gap-3.5 mt-2">
                <img
                  src={getCategoryIcon(
                    incident.loai_thiet_bi || groupName,
                    incident.id_pq,
                  )}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover border border-[#8db0ee] bg-white p-0.5 shadow-sm"
                />
                <div>
                  {isEditingLoi ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl md:text-3xl font-extrabold text-[#183f82]">
                        Sự cố:
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={loiInput}
                        onChange={(e) => setLoiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveLoi();
                          if (e.key === "Escape") {
                            setLoiInput(incident.loi_so || 1);
                            setIsEditingLoi(false);
                          }
                        }}
                        className="w-20 rounded-xl border-2 border-blue-500 bg-white px-2.5 py-1 text-xl md:text-2xl font-extrabold text-[#183f82] focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveLoi}
                        disabled={isSavingLoi}
                        title="Lưu số sự cố"
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingLoi ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={15} /> Lưu
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoiInput(incident.loi_so || 1);
                          setIsEditingLoi(false);
                        }}
                        title="Hủy"
                        className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 group">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-[#183f82]">
                        Sự cố: {incident.loi_so}
                      </h1>
                      <button
                        type="button"
                        onClick={() => {
                          setLoiInput(incident.loi_so || 1);
                          setIsEditingLoi(true);
                        }}
                        title="Chỉnh sửa số sự cố"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition active:scale-95"
                      >
                        <Edit3 size={18} />
                      </button>
                    </div>
                  )}

                  <p className="mt-1 text-sm text-[#4f72ad]">
                    Thiết bị: <b className="text-slate-800">{incident.ten_thiet_bi}</b>
                    {incident.loai_thiet_bi && (
                      <>
                        {" "}| Phân loại:{" "}
                        <b className="text-slate-800">{incident.loai_thiet_bi}</b>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Cụm nút thao tác Header */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReloadIncident}
                disabled={isRefreshing}
                title="Tải lại toàn bộ dữ liệu mới nhất từ CSDL"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 active:scale-95 disabled:opacity-50"
              >
                <RotateCw
                  size={15}
                  strokeWidth={2.5}
                  className={isRefreshing ? "animate-spin text-blue-600" : "text-blue-600"}
                />
                <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
              </button>

              <button
                type="button"
                onClick={() => setOpenEditModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95"
              >
                <Edit3 size={15} />
                Chỉnh sửa thông tin sự cố
              </button>
            </div>
          </div>

          {/* 3 Tabs Điều hướng Mới */}
          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-slate-100 pt-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs md:text-sm font-extrabold transition-all shadow-sm ${
                    isActive
                      ? "border-[#2f69d9] bg-[#2f69d9] text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-[#f4f8ff] hover:text-[#1d478d]"
                  }`}
                >
                  <span className={isActive ? "text-white" : tab.color}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung Nội dung Chi tiết theo Tab */}
        <div
          className={
            activeTab === "TaiLieu"
              ? "rounded-[26px] border border-[#8db0ee] bg-slate-50/70 p-4 md:p-6 shadow-[0_10px_25px_rgba(37,99,235,0.06)]"
              : cardClass
          }
        >
          {/* TAB 1: TÌNH TRẠNG (Ở ĐẦU TIÊN) */}
          {activeTab === "TinhTrang" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 p-4 md:p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-100">
                    <Activity size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-extrabold text-[#183f82]">
                      Tình trạng sự cố
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      Mô tả hiện tượng và ghi nhận ban đầu khi phát hiện sự cố thiết bị
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      if (incident.tinh_trang) {
                        navigator.clipboard.writeText(incident.tinh_trang);
                        setCopiedTinhTrang(true);
                        setTimeout(() => setCopiedTinhTrang(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-blue-700 shadow-sm transition hover:bg-blue-50 hover:border-blue-300 active:scale-95"
                  >
                    <Copy size={14} />
                    <span>{copiedTinhTrang ? "Đã sao chép!" : "Sao chép"}</span>
                  </button>

                  {!isEditingTinhTrang && (
                    <button
                      type="button"
                      onClick={() => {
                        setTinhTrangInput(incident.tinh_trang || "");
                        setIsEditingTinhTrang(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                    >
                      <Edit3 size={14} />
                      <span>Chỉnh sửa tình trạng</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Nội dung Tình trạng */}
              <div className="rounded-2xl border border-blue-100 bg-white p-5 md:p-6 shadow-sm">
                {isEditingTinhTrang ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Chỉnh sửa nội dung tình trạng:
                    </label>
                    <textarea
                      rows={4}
                      value={tinhTrangInput}
                      onChange={(e) => setTinhTrangInput(e.target.value)}
                      placeholder="Nhập mô tả chi tiết tình trạng sự cố khi phát hiện..."
                      className="w-full rounded-2xl border-2 border-blue-500 bg-white p-3 text-sm md:text-base font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/15 shadow-inner"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveTinhTrang}
                        disabled={isSavingTinhTrang}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                      >
                        {isSavingTinhTrang ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save size={14} /> Lưu tình trạng
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingTinhTrang(false)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-line text-sm md:text-base font-semibold leading-relaxed text-slate-800">
                        {incident.tinh_trang || "Chưa có thông tin mô tả tình trạng cho sự cố này."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NGUYÊN NHÂN (XỔ RA HƯỚNG KHẮC PHỤC DẠNG HƯỚNG 01, HƯỚNG 02...) */}
          {activeTab === "NguyenNhan" && (
            <CauseRemedyTree
              rawNguyenNhan={incident.nguyen_nhan || ""}
              rawHuongKhacPhuc={incident.huong_khac_phuc || ""}
              onSave={handleSaveCauseAndRemedy}
              onReload={handleReloadIncident}
              isReloading={isRefreshing}
              storageKey={`incident_tree_${incident.id}`}
            />
          )}

          {/* TAB 3: TÀI LIỆU KỸ THUẬT & MEDIA */}
          {activeTab === "TaiLieu" && (
            <DocumentManagerView
              su_co_id={incident.id}
              loi_so={incident.loi_so}
              thiet_bi_name={incident.ten_thiet_bi || deviceName}
              id_pq={incident.id_pq}
              category_name={groupName || incident.loai_thiet_bi || ""}
              isEmbedded={true}
            />
          )}
        </div>
      </div>

      {/* MODAL CHỈNH SỬA THÔNG TIN SỰ CỐ */}
      {openEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-[#9bb8ee] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#183f82]">
                Chỉnh sửa sự cố: {incident.loi_so || incident.id} ({incident.ten_thiet_bi})
              </h3>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Sự cố (Số thứ tự sự cố)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.loi_so}
                  onChange={(e) =>
                    setEditForm({ ...editForm, loi_so: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tình trạng
                </label>
                <textarea
                  rows={3}
                  value={editForm.tinh_trang}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tinh_trang: e.target.value })
                  }
                  placeholder="Mô tả chi tiết tình trạng sự cố khi xuất hiện..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nguyên nhân
                </label>
                <textarea
                  rows={3}
                  value={editForm.nguyen_nhan}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nguyen_nhan: e.target.value })
                  }
                  placeholder="Nguyên nhân kỹ thuật dẫn đến sự cố..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Hướng khắc phục
                </label>
                <textarea
                  rows={4}
                  value={editForm.huong_khac_phuc}
                  onChange={(e) =>
                    setEditForm({ ...editForm, huong_khac_phuc: e.target.value })
                  }
                  placeholder="Các bước và thao tác xử lý, khắc phục sự cố..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setOpenEditModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Lưu thay đổi
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
