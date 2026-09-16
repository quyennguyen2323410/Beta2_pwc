import React, { useEffect, useState, useMemo } from "react";
import {
  Layers,
  MapPin,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  RotateCw,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Database,
  Eye,
  X,
  Compass,
  ChevronRight,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchDeviceTypesAdmin,
  createDeviceType,
  updateDeviceType,
  deleteDeviceType,
  fetchDmaDevicesAdmin,
  createDmaDevice,
  updateDmaDevice,
  deleteDmaDevice,
  fetchErrorsAdmin,
  createDmaError,
  updateDmaError,
  deleteDmaError,
  createDeviceOption,
  renameDeviceOption,
  deleteDeviceOption,
} from "../../API/dmaApi";

export default function ContentManager() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Raw data
  const [categories, setCategories] = useState([]);
  const [dmaDevices, setDmaDevices] = useState([]);
  const [errors, setErrors] = useState([]);

  // Selection states (Hierarchy 3-levels)
  const [selectedPq, setSelectedPq] = useState(null); // Level 1: Category id_pq
  const [selectedOptionId, setSelectedOptionId] = useState(null); // Level 2: Option (dma item or device name)

  // Loading & Alerts
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Searches
  const [catSearch, setCatSearch] = useState("");
  const [optionSearch, setOptionSearch] = useState("");

  // Modals state
  const [modalType, setModalType] = useState(null);
  // 'cat_add' | 'cat_edit' | 'option_add' | 'option_rename' | 'option_delete' | 'error_add' | 'error_edit' | 'error_delete' | 'dma_edit' | 'dma_delete'
  const [modalData, setModalData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load all data
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [catsRes, dmasRes, errorsRes] = await Promise.all([
        fetchDeviceTypesAdmin().catch(() => []),
        fetchDmaDevicesAdmin().catch(() => []),
        fetchErrorsAdmin().catch(() => []),
      ]);

      setCategories(catsRes);
      setDmaDevices(dmasRes);
      setErrors(errorsRes);

      // Auto select first category if none selected
      if (catsRes.length > 0 && selectedPq === null) {
        setSelectedPq(catsRes[0].id_pq);
      }
    } catch (err) {
      console.error("Lỗi nạp dữ liệu quản trị:", err);
      showAlert("error", "Không thể nạp dữ liệu từ máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Active Category Object
  const currentCategory = useMemo(() => {
    return categories.find((c) => Number(c.id_pq) === Number(selectedPq)) || categories[0] || null;
  }, [categories, selectedPq]);

  const isDmaCategory = Number(currentCategory?.id_pq) <= 2;

  // Options list under current category
  const currentOptions = useMemo(() => {
    if (!currentCategory) return [];
    const idPq = Number(currentCategory.id_pq);

    if (isDmaCategory) {
      // Return list of DMA items
      return dmaDevices.filter((d) => Number(d.id_pq) === idPq);
    } else {
      // Group errors by device name
      const typeErrors = errors.filter((e) => Number(e.id_pq) === idPq);
      const map = new Map();
      typeErrors.forEach((e) => {
        const name = (e.name || "Chung").trim();
        if (!map.has(name)) {
          map.set(name, []);
        }
        map.get(name).push(e);
      });

      return Array.from(map.entries()).map(([name, errs]) => ({
        name,
        count: errs.length,
        errors: errs,
      }));
    }
  }, [currentCategory, isDmaCategory, dmaDevices, errors]);

  // Ensure an option is selected when category changes
  useEffect(() => {
    if (currentOptions.length > 0) {
      if (isDmaCategory) {
        const exists = currentOptions.some((o) => o.id === selectedOptionId);
        if (!exists) setSelectedOptionId(currentOptions[0].id);
      } else {
        const exists = currentOptions.some((o) => o.name === selectedOptionId);
        if (!exists) setSelectedOptionId(currentOptions[0].name);
      }
    } else {
      setSelectedOptionId(null);
    }
  }, [currentCategory, currentOptions, isDmaCategory]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return categories;
    const q = catSearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.loai_thiet_bi?.toLowerCase().includes(q) ||
        c.id_pq?.toString().includes(q)
    );
  }, [categories, catSearch]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!optionSearch.trim()) return currentOptions;
    const q = optionSearch.toLowerCase();
    if (isDmaCategory) {
      return currentOptions.filter(
        (o) =>
          o.dma_code?.toLowerCase().includes(q) ||
          o.vi_tri?.toLowerCase().includes(q) ||
          o.thiet_bi?.toLowerCase().includes(q)
      );
    } else {
      return currentOptions.filter((o) => o.name?.toLowerCase().includes(q));
    }
  }, [currentOptions, optionSearch, isDmaCategory]);

  // Active Option Details (Level 3)
  const currentOptionDetail = useMemo(() => {
    if (!selectedOptionId || currentOptions.length === 0) return null;
    if (isDmaCategory) {
      return currentOptions.find((o) => o.id === selectedOptionId) || null;
    } else {
      return currentOptions.find((o) => o.name === selectedOptionId) || null;
    }
  }, [selectedOptionId, currentOptions, isDmaCategory]);

  // ==========================================
  // HANDLERS: CATEGORY (LEVEL 1)
  // ==========================================
  const handleOpenCatModal = (type, cat = null) => {
    if (type === "cat_edit" && cat) {
      setModalData({
        oldIdPq: cat.id_pq,
        id_pq: cat.id_pq,
        loai_thiet_bi: cat.loai_thiet_bi || "",
      });
    } else {
      const maxPq = categories.reduce(
        (max, c) => Math.max(max, Number(c.id_pq) || 0),
        0
      );
      setModalData({
        id_pq: Math.max(maxPq + 1, 3),
        loai_thiet_bi: "",
      });
    }
    setModalType(type);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!modalData.loai_thiet_bi?.trim()) {
      alert("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      setSubmitting(true);
      if (modalType === "cat_add") {
        const created = await createDeviceType({
          id_pq: modalData.id_pq,
          loai_thiet_bi: modalData.loai_thiet_bi,
        });
        showAlert("success", `Thêm danh mục "${modalData.loai_thiet_bi}" thành công!`);
        setSelectedPq(modalData.id_pq);
      } else if (modalType === "cat_edit") {
        await updateDeviceType(modalData.oldIdPq, {
          id_pq: modalData.id_pq,
          loai_thiet_bi: modalData.loai_thiet_bi,
        });
        showAlert("success", `Cập nhật danh mục thành công!`);
        setSelectedPq(modalData.id_pq);
      }
      setModalType(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Danh mục "${cat.loai_thiet_bi}"? Mọi thiết bị và dữ liệu liên quan sẽ bị ảnh hưởng!`)) {
      return;
    }
    try {
      setSubmitting(true);
      await deleteDeviceType(cat.id_pq);
      showAlert("success", `Đã xóa danh mục "${cat.loai_thiet_bi}"`);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Xóa danh mục thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // HANDLERS: OPTION (LEVEL 2 - THÊM / SỬA / XÓA OPTION CỦA CATEGORY)
  // ==========================================
  const handleOpenAddOption = () => {
    setModalData({
      idPq: currentCategory?.id_pq,
      categoryName: currentCategory?.loai_thiet_bi,
      optionName: "",
      // If DMA:
      dma_code: "",
      vi_tri: "",
      thiet_bi: "Bộ mạch PHT",
      kinh_do: "",
      vi_do: "",
    });
    setModalType("option_add");
  };

  const handleSaveNewOption = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const idPq = Number(currentCategory.id_pq);

      if (isDmaCategory) {
        if (!modalData.dma_code?.trim()) {
          alert("Vui lòng nhập mã DMA.");
          return;
        }
        const created = await createDmaDevice({
          id_pq: idPq,
          dma_code: modalData.dma_code,
          vi_tri: modalData.vi_tri,
          thiet_bi: modalData.thiet_bi,
          kinh_do: modalData.kinh_do,
          vi_do: modalData.vi_do,
        });
        showAlert("success", `Thêm điểm đo DMA "${modalData.dma_code}" thành công!`);
        setSelectedOptionId(created?.id);
      } else {
        if (!modalData.optionName?.trim()) {
          alert("Vui lòng nhập tên Option / Thiết bị.");
          return;
        }
        await createDeviceOption(idPq, modalData.optionName);
        showAlert("success", `Thêm Option "${modalData.optionName}" vào danh mục thành công!`);
        setSelectedOptionId(modalData.optionName.trim());
      }

      setModalType(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Thêm Option thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRenameOption = (option) => {
    if (isDmaCategory) {
      setModalData({
        id: option.id,
        idPq: option.id_pq,
        oldName: option.dma_code,
        newName: option.dma_code,
        vi_tri: option.vi_tri || "",
        thiet_bi: option.thiet_bi || "",
        kinh_do: option.kinh_do ?? "",
        vi_do: option.vi_do ?? "",
      });
      setModalType("dma_edit");
    } else {
      setModalData({
        idPq: currentCategory.id_pq,
        oldName: option.name,
        newName: option.name,
      });
      setModalType("option_rename");
    }
  };

  const handleSaveRenameOption = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (isDmaCategory) {
        await updateDmaDevice(modalData.id, {
          dma_code: modalData.newName,
          vi_tri: modalData.vi_tri,
          thiet_bi: modalData.thiet_bi,
          kinh_do: modalData.kinh_do,
          vi_do: modalData.vi_do,
        });
        showAlert("success", `Cập nhật thông tin điểm DMA "${modalData.newName}" thành công!`);
      } else {
        if (!modalData.newName?.trim()) {
          alert("Vui lòng nhập tên mới cho Option.");
          return;
        }
        await renameDeviceOption(modalData.idPq, modalData.oldName, modalData.newName);
        showAlert("success", `Đổi tên Option thành "${modalData.newName}" thành công!`);
        setSelectedOptionId(modalData.newName.trim());
      }

      setModalType(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Cập nhật thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOption = async (option) => {
    const optName = isDmaCategory ? `DMA "${option.dma_code}"` : `Option "${option.name}"`;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${optName} khỏi danh mục "${currentCategory?.loai_thiet_bi}"? Toàn bộ các thông tin và sự cố liên quan sẽ bị xóa vĩnh viễn!`)) {
      return;
    }

    try {
      setSubmitting(true);
      if (isDmaCategory) {
        await deleteDmaDevice(option.id);
      } else {
        await deleteDeviceOption(currentCategory.id_pq, option.name);
      }
      showAlert("success", `Đã xóa ${optName} thành công!`);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Xóa Option thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // HANDLERS: ERROR DETAILS (LEVEL 3)
  // ==========================================
  const handleOpenErrorModal = (type, errItem = null) => {
    if (type === "error_edit" && errItem) {
      setModalData({
        id: errItem.id,
        id_pq: errItem.id_pq,
        name: errItem.name,
        loi: errItem.loi || 1,
        tinh_trang: errItem.tinh_trang || "",
        nguyen_nhan: errItem.nguyen_nhan || "",
        huong_khac_phuc: errItem.huong_khac_phuc || "",
      });
    } else {
      // Auto count next error number
      const existingErrors = currentOptionDetail?.errors || [];
      const nextLoi = existingErrors.length + 1;

      setModalData({
        id_pq: currentCategory.id_pq,
        name: currentOptionDetail?.name || "",
        loi: nextLoi,
        tinh_trang: "",
        nguyen_nhan: "",
        huong_khac_phuc: "",
      });
    }
    setModalType(type);
  };

  const handleSaveError = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (modalType === "error_add") {
        await createDmaError({
          id_pq: modalData.id_pq,
          ten_thiet_bi: modalData.name,
          loi_so: modalData.loi,
          tinh_trang: modalData.tinh_trang,
          nguyen_nhan: modalData.nguyen_nhan,
          huong_khac_phuc: modalData.huong_khac_phuc,
        });
        showAlert("success", `Thêm sự cố cho Option "${modalData.name}" thành công!`);
      } else if (modalType === "error_edit") {
        await updateDmaError(modalData.id, {
          loi: modalData.loi,
          tinh_trang: modalData.tinh_trang,
          nguyen_nhan: modalData.nguyen_nhan,
          huong_khac_phuc: modalData.huong_khac_phuc,
        });
        showAlert("success", `Cập nhật sự cố thành công!`);
      }
      setModalType(null);
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteError = async (errItem) => {
    if (!window.confirm(`Xác nhận xóa sự cố (Lỗi ${errItem.loi}) của Option "${errItem.name}"?`)) {
      return;
    }
    try {
      setSubmitting(true);
      await deleteDmaError(errItem.id);
      showAlert("success", "Đã xóa sự cố thành công!");
      await loadData(true);
    } catch (err) {
      console.error(err);
      showAlert("error", err.message || "Xóa thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 md:p-6 lg:p-8">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md transition-all ${
            alert.type === "success"
              ? "border border-emerald-500/30 bg-emerald-600 text-white"
              : "border border-rose-500/30 bg-rose-600 text-white"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle2 size={20} className="shrink-0" />
          ) : (
            <AlertCircle size={20} className="shrink-0" />
          )}
          <span className="text-sm font-semibold">{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            className="ml-2 rounded-lg p-1 hover:bg-white/20"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Container */}
      <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/Library")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100/80 text-slate-700 transition hover:bg-slate-200"
              title="Quay lại Thư viện"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
                  <Database size={18} />
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">
                  Quản trị Cấu trúc Danh mục & Option
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý toàn bộ 3 cấp phân tầng: <strong>1. Danh mục</strong> ➔ <strong>2. Danh sách Option / Thiết bị con</strong> ➔ <strong>3. Nội dung & Sự cố</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCw
                size={16}
                className={refreshing ? "animate-spin text-cyan-600" : ""}
              />
              <span>Làm mới</span>
            </button>
            <button
              onClick={() => navigate("/Library")}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700"
            >
              <Eye size={16} />
              <span>Xem Thư viện</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
          <RotateCw size={36} className="animate-spin text-cyan-600" />
          <p className="mt-4 font-semibold text-slate-600">
            Đang tải dữ liệu cấu trúc danh mục từ Supabase...
          </p>
        </div>
      ) : (
        /* ==================================================== */
        /* 3-COLUMN HIERARCHY MANAGER:                          */
        /* Col 1: Categories -> Col 2: Options -> Col 3: Details */
        /* ==================================================== */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* ==================================================== */}
          {/* CỘT 1 (LEVEL 1): DANH MỤC (CATEGORIES - DROPDOWN 1)  */}
          {/* ==================================================== */}
          <div className="lg:col-span-3 flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-cyan-600" />
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  1. Danh mục ({categories.length})
                </h2>
              </div>
              <button
                onClick={() => handleOpenCatModal("cat_add")}
                className="inline-flex items-center gap-1 rounded-xl bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition"
                title="Thêm danh mục mới"
              >
                <Plus size={14} /> Thêm
              </button>
            </div>

            {/* Tìm danh mục */}
            <div className="mt-3 relative">
              <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Tìm danh mục..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Danh sách categories */}
            <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[600px] pr-1">
              {filteredCategories.map((cat) => {
                const isActive = Number(cat.id_pq) === Number(selectedPq);
                const isDma = Number(cat.id_pq) <= 2;
                const optCount = isDma
                  ? dmaDevices.filter((d) => Number(d.id_pq) === Number(cat.id_pq)).length
                  : new Set(errors.filter((e) => Number(e.id_pq) === Number(cat.id_pq)).map((e) => e.name)).size;

                return (
                  <div
                    key={cat.id_pq}
                    onClick={() => setSelectedPq(cat.id_pq)}
                    className={`group flex items-center justify-between rounded-2xl p-2.5 text-xs font-medium cursor-pointer transition ${
                      isActive
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {cat.id_pq}
                      </span>
                      <span className="truncate font-semibold">{cat.loai_thiet_bi}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        {optCount} opts
                      </span>

                      {/* Nút sửa/xóa category */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCatModal("cat_edit", cat);
                        }}
                        className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition ${
                          isActive ? "hover:bg-white/20 text-white" : "hover:bg-slate-200 text-slate-600"
                        }`}
                        title="Đổi tên danh mục"
                      >
                        <Edit2 size={12} />
                      </button>

                      {Number(cat.id_pq) >= 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition ${
                            isActive ? "hover:bg-rose-500 text-white" : "hover:bg-rose-100 text-rose-600"
                          }`}
                          title="Xóa danh mục"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==================================================== */}
          {/* CỘT 2 (LEVEL 2): DANH SÁCH OPTION CỦA CATEGORY (DROPDOWN 2) */}
          {/* ==================================================== */}
          <div className="lg:col-span-4 flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-amber-600" />
                  <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                    2. Option / Thiết bị ({currentOptions.length})
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                  Thuộc: <strong>{currentCategory?.loai_thiet_bi}</strong>
                </p>
              </div>

              <button
                onClick={handleOpenAddOption}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition"
              >
                <Plus size={14} /> Thêm Option
              </button>
            </div>

            {/* Tìm Option */}
            <div className="mt-3 relative">
              <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="Tìm Option trong danh mục..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Danh sách các Option */}
            <div className="mt-3 space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {filteredOptions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có Option nào trong danh mục này.
                  <div className="mt-2">
                    <button
                      onClick={handleOpenAddOption}
                      className="inline-flex items-center gap-1 text-amber-600 font-bold hover:underline"
                    >
                      <Plus size={12} /> Bấm vào đây để thêm Option đầu tiên
                    </button>
                  </div>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = isDmaCategory
                    ? opt.id === selectedOptionId
                    : opt.name === selectedOptionId;

                  const optTitle = isDmaCategory ? `DMA: ${opt.dma_code}` : opt.name;
                  const subText = isDmaCategory
                    ? opt.vi_tri || opt.thiet_bi || "Chưa có vị trí"
                    : `${opt.count} mục sự cố kỹ thuật`;

                  return (
                    <div
                      key={isDmaCategory ? opt.id : opt.name}
                      onClick={() =>
                        setSelectedOptionId(isDmaCategory ? opt.id : opt.name)
                      }
                      className={`group relative rounded-2xl border p-3 cursor-pointer transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-500/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-sm truncate">
                            {optTitle}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 truncate">
                            {subText}
                          </div>
                        </div>

                        {/* Thao tác Option: Đổi tên & Xóa */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRenameOption(opt);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-100 hover:text-amber-800 transition"
                            title="Đổi tên Option"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOption(opt);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                            title="Xóa Option này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* CỘT 3 (LEVEL 3): NỘI DUNG & SỰ CỐ CỦA OPTION ĐANG CHỌN */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            {!currentOptionDetail ? (
              <div className="flex h-96 flex-col items-center justify-center text-slate-400 text-center">
                <HelpCircle size={36} className="text-slate-300 mb-2" />
                <p className="font-semibold">Chưa chọn Option nào</p>
                <p className="text-xs mt-1 max-w-xs">
                  Vui lòng chọn hoặc thêm một Option ở Cột 2 để quản lý nội dung chi tiết.
                </p>
              </div>
            ) : isDmaCategory ? (
              /* Chi tiết Option DMA */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-cyan-600 uppercase">
                      Chi tiết Điểm đo DMA
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      DMA: {currentOptionDetail.dma_code}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleOpenRenameOption(currentOptionDetail)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit2 size={14} /> Chỉnh sửa
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Vị trí lắp đặt</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {currentOptionDetail.vi_tri || "— Chưa cập nhật địa chỉ —"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Thiết bị kèm theo</div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {currentOptionDetail.thiet_bi || "Bộ mạch PHT"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Kinh độ (Lng)</div>
                      <div className="font-mono text-sm font-bold text-cyan-800">
                        {currentOptionDetail.kinh_do || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Vĩ độ (Lat)</div>
                      <div className="font-mono text-sm font-bold text-cyan-800">
                        {currentOptionDetail.vi_do || "—"}
                      </div>
                    </div>
                  </div>

                  {currentOptionDetail.kinh_do && currentOptionDetail.vi_do && (
                    <div className="pt-2">
                      <a
                        href={`https://www.google.com/maps?q=${currentOptionDetail.vi_do},${currentOptionDetail.kinh_do}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:underline"
                      >
                        <Compass size={14} /> Mở xem trên Google Maps thực tế <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chi tiết Option Thiết bị kỹ thuật: Danh sách Lỗi & Khắc phục */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase">
                      Danh sách Lỗi & Khắc phục
                    </span>
                    <h2 className="text-xl font-black text-slate-900 truncate max-w-xs">
                      {currentOptionDetail.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleOpenErrorModal("error_add")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-cyan-800 transition"
                  >
                    <Plus size={14} /> Thêm Lỗi
                  </button>
                </div>

                {/* Danh sách các lỗi của thiết bị này */}
                <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
                  {currentOptionDetail.errors.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Thiết bị này chưa ghi nhận sự cố nào.
                    </div>
                  ) : (
                    currentOptionDetail.errors.map((err) => (
                      <div
                        key={err.id}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2 transition hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                            Lỗi #{err.loi || 1}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenErrorModal("error_edit", err)}
                              className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 transition"
                              title="Sửa sự cố"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteError(err)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                              title="Xóa sự cố"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase">
                            Tình trạng:
                          </div>
                          <div className="text-xs font-semibold text-slate-800">
                            {err.tinh_trang || "—"}
                          </div>
                        </div>

                        {err.nguyen_nhan && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase">
                              Nguyên nhân:
                            </div>
                            <div className="text-xs text-slate-600">
                              {err.nguyen_nhan}
                            </div>
                          </div>
                        )}

                        {err.huong_khac_phuc && (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-700 uppercase">
                              Hướng khắc phục:
                            </div>
                            <div className="text-xs font-medium text-emerald-900 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                              {err.huong_khac_phuc}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: THÊM / SỬA DANH MỤC (CATEGORY)             */}
      {/* ==================================================== */}
      {(modalType === "cat_add" || modalType === "cat_edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {modalType === "cat_add" ? "Thêm Danh mục mới (Dropdown 1)" : "Đổi tên Danh mục"}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Tên loại thiết bị / Danh mục</label>
                <input
                  type="text"
                  required
                  value={modalData.loai_thiet_bi || ""}
                  onChange={(e) => setModalData({ ...modalData, loai_thiet_bi: e.target.value })}
                  placeholder="Ví dụ: Van điều áp, Đồng hồ điện từ, Pin..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Mã nhóm (id_pq)</label>
                <input
                  type="number"
                  required
                  value={modalData.id_pq ?? ""}
                  onChange={(e) => setModalData({ ...modalData, id_pq: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-700"
                >
                  {submitting ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: THÊM OPTION MỚI CHO CATEGORY               */}
      {/* ==================================================== */}
      {modalType === "option_add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Thêm Option mới vào "{currentCategory?.loai_thiet_bi}"
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Option này sẽ xuất hiện trong Dropdown 2 của danh mục.
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewOption} className="mt-4 space-y-3">
              {isDmaCategory ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Mã DMA <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={modalData.dma_code || ""}
                      onChange={(e) => setModalData({ ...modalData, dma_code: e.target.value })}
                      placeholder="Ví dụ: 1001, 1125"
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">Vị trí lắp đặt</label>
                    <input
                      type="text"
                      value={modalData.vi_tri || ""}
                      onChange={(e) => setModalData({ ...modalData, vi_tri: e.target.value })}
                      placeholder="Địa chỉ hoặc giao lộ..."
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase">Thiết bị kèm theo</label>
                    <input
                      type="text"
                      value={modalData.thiet_bi || ""}
                      onChange={(e) => setModalData({ ...modalData, thiet_bi: e.target.value })}
                      placeholder="Bộ mạch PHT, Cello 4S, Pegasus..."
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase">Kinh độ</label>
                      <input
                        type="number"
                        step="any"
                        value={modalData.kinh_do || ""}
                        onChange={(e) => setModalData({ ...modalData, kinh_do: e.target.value })}
                        placeholder="106.676346"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-800 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase">Vĩ độ</label>
                      <input
                        type="number"
                        step="any"
                        value={modalData.vi_do || ""}
                        onChange={(e) => setModalData({ ...modalData, vi_do: e.target.value })}
                        placeholder="10.766989"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-800 focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Tên Option / Thiết bị mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalData.optionName || ""}
                    onChange={(e) => setModalData({ ...modalData, optionName: e.target.value })}
                    placeholder="Ví dụ: Van NeoFlow, Sofrel DL4W, Đồng hồ ABB..."
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-amber-500 focus:outline-hidden"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Option này sẽ là 1 lựa chọn mới trong Dropdown 2. Sau khi thêm, bạn có thể thêm các mã lỗi và hướng dẫn xử lý cho Option này.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600"
                >
                  {submitting ? "Đang lưu..." : "Thêm Option"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ĐỔI TÊN OPTION (RENAME OPTION)               */}
      {/* ==================================================== */}
      {modalType === "option_rename" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Đổi tên Option / Thiết bị
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRenameOption} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Tên hiện tại</label>
                <div className="mt-1 text-sm font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl">
                  {modalData.oldName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Tên mới <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={modalData.newName || ""}
                  onChange={(e) => setModalData({ ...modalData, newName: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                >
                  {submitting ? "Đang lưu..." : "Cập nhật tên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CHỈNH SỬA ĐIỂM DMA (DMA_EDIT)               */}
      {/* ==================================================== */}
      {modalType === "dma_edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Chỉnh sửa Điểm đo DMA & Tọa độ GPS
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRenameOption} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Mã DMA <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={modalData.newName || ""}
                  onChange={(e) => setModalData({ ...modalData, newName: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Vị trí lắp đặt</label>
                <input
                  type="text"
                  value={modalData.vi_tri || ""}
                  onChange={(e) => setModalData({ ...modalData, vi_tri: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Thiết bị kèm theo</label>
                <input
                  type="text"
                  value={modalData.thiet_bi || ""}
                  onChange={(e) => setModalData({ ...modalData, thiet_bi: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="any"
                    value={modalData.kinh_do ?? ""}
                    onChange={(e) => setModalData({ ...modalData, kinh_do: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    value={modalData.vi_do ?? ""}
                    onChange={(e) => setModalData({ ...modalData, vi_do: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-cyan-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-800"
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: THÊM / SỬA SỰ CỐ (ERROR_ADD / ERROR_EDIT)  */}
      {/* ==================================================== */}
      {(modalType === "error_add" || modalType === "error_edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {modalType === "error_add" ? `Thêm sự cố cho "${modalData.name}"` : `Chỉnh sửa sự cố`}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveError} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Mã lỗi số</label>
                <input
                  type="number"
                  min={1}
                  value={modalData.loi || 1}
                  onChange={(e) => setModalData({ ...modalData, loi: parseInt(e.target.value) || 1 })}
                  className="mt-1 w-24 rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Tình trạng / Hiện tượng lỗi</label>
                <textarea
                  rows={2}
                  value={modalData.tinh_trang || ""}
                  onChange={(e) => setModalData({ ...modalData, tinh_trang: e.target.value })}
                  placeholder="Mô tả hiện tượng lỗi quan sát được..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Nguyên nhân</label>
                <textarea
                  rows={2}
                  value={modalData.nguyen_nhan || ""}
                  onChange={(e) => setModalData({ ...modalData, nguyen_nhan: e.target.value })}
                  placeholder="Nguyên nhân phát sinh..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">Hướng khắc phục & Quy trình</label>
                <textarea
                  rows={3}
                  value={modalData.huong_khac_phuc || ""}
                  onChange={(e) => setModalData({ ...modalData, huong_khac_phuc: e.target.value })}
                  placeholder="Các bước thao tác để xử lý dứt điểm sự cố..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-cyan-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-800"
                >
                  {submitting ? "Đang lưu..." : "Lưu sự cố"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
