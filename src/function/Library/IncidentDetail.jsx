import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
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
} from "lucide-react";
import { fetchDmaErrorById, updateDmaError } from "../../API/dmaApi";
import DocumentManagerView from "../Documents/DocumentManagerView";
import IncidentTodoList from "./components/IncidentTodoList";

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

  // Tab: 'HuongKhacPhuc' | 'NguyenNhan' | 'TinhTrang' | 'TaiLieu'
  const [activeTab, setActiveTab] = useState("HuongKhacPhuc");

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

  // Lưu chỉnh sửa thông tin sự cố
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

      setOpenEditModal(false);
    } catch (err) {
      console.error("Lỗi cập nhật sự cố:", err);
      alert("Cập nhật thất bại: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Lưu thay đổi từ TodoList (Thêm / Sửa / Xóa / Đổi thứ tự)
  const handleSaveField = async (field, newText) => {
    try {
      await updateDmaError(id, { [field]: newText });
      setIncident((prev) => ({
        ...prev,
        [field]: newText,
      }));
      setEditForm((prev) => ({
        ...prev,
        [field]: newText,
      }));
    } catch (err) {
      console.error(`Lỗi cập nhật ${field}:`, err);
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

  const tabs = [
    {
      key: "HuongKhacPhuc",
      label: "Hướng khắc phục",
      icon: <Wrench size={18} strokeWidth={2.5} />,
      color: "text-blue-600",
    },
    {
      key: "NguyenNhan",
      label: "Nguyên nhân",
      icon: <HelpCircle size={18} strokeWidth={2.5} />,
      color: "text-amber-600",
    },
    {
      key: "TinhTrang",
      label: "Tình trạng ban đầu",
      icon: <Activity size={18} strokeWidth={2.5} />,
      color: "text-rose-600",
    },
    {
      key: "TaiLieu",
      label: "Tài liệu kỹ thuật số",
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
                className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#4f72ad] transition hover:bg-[#f0f5ff] hover:text-[#1d478d]"
              >
                <ArrowLeft size={15} /> Quay lại danh sách
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">
                  Mã sự cố #{incident.id}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600">
                  Lỗi số: {incident.loi_so}
                </span>
              </div>

              <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-[#183f82]">
                Sự cố: {incident.loi_so}
              </h1>

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

          {/* 4 Tabs Điều hướng */}
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
          {activeTab === "HuongKhacPhuc" && (
            <IncidentTodoList
              title="Quy trình hướng dẫn xử lý sự cố"
              icon={<Wrench size={18} />}
              badgePrefix="Bước"
              rawText={incident.huong_khac_phuc || ""}
              onSave={(newText) => handleSaveField("huong_khac_phuc", newText)}
              onReload={handleReloadIncident}
              isReloading={isRefreshing}
              storageKey={`huong_khac_phuc_${incident.id}`}
              placeholder="Nhập bước xử lý tiếp theo... (VD: Kiểm tra nguồn điện, reset module truyền thông...)"
              emptyMessage="Chưa có quy trình xử lý cho sự cố này. Hãy thêm các bước ở bên dưới!"
            />
          )}

          {activeTab === "NguyenNhan" && (
            <IncidentTodoList
              title="Phân tích nguyên nhân gây ra sự cố"
              icon={<HelpCircle size={18} />}
              badgePrefix="Nguyên nhân"
              rawText={incident.nguyen_nhan || ""}
              onSave={(newText) => handleSaveField("nguyen_nhan", newText)}
              onReload={handleReloadIncident}
              isReloading={isRefreshing}
              storageKey={`nguyen_nhan_${incident.id}`}
              placeholder="Nhập nguyên nhân khả dĩ tiếp theo... (VD: Ăn mòn tiếp điểm, Mất sóng mạng viễn thông...)"
              emptyMessage="Chưa có phân tích nguyên nhân cho sự cố này. Hãy thêm các nguyên nhân ở bên dưới!"
            />
          )}

          {activeTab === "TinhTrang" && (
            <div className="rounded-2xl border border-blue-100 bg-[#f4f8ff] p-5 md:p-6 leading-relaxed">
              <div className="flex items-center gap-2 text-base font-bold text-[#1d478d] mb-3">
                <Activity size={18} />
                Mô tả tình trạng ban đầu khi phát hiện:
              </div>
              <p className="whitespace-pre-line text-sm md:text-base text-slate-800 font-medium">
                {incident.tinh_trang || "Chưa có thông tin tình trạng ban đầu."}
              </p>
            </div>
          )}

          {/* TAB THỨ 4: TÀI LIỆU KỸ THUẬT SỐ & MEDIA */}
          {activeTab === "TaiLieu" && (
            <DocumentManagerView
              su_co_id={incident.id}
              thiet_bi_name={incident.ten_thiet_bi}
              id_pq={incident.id_pq}
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
                Chỉnh sửa sự cố #{incident.id} ({incident.ten_thiet_bi})
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
                  Lỗi số / Mã lỗi
                </label>
                <input
                  type="number"
                  value={editForm.loi_so}
                  onChange={(e) =>
                    setEditForm({ ...editForm, loi_so: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tình trạng ban đầu
                </label>
                <textarea
                  rows={3}
                  value={editForm.tinh_trang}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tinh_trang: e.target.value })
                  }
                  placeholder="Mô tả chi tiết tình trạng lỗi khi xuất hiện..."
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
                  placeholder="Nguyên nhân kỹ thuật dẫn đến lỗi..."
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
