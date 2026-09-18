import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowLeft,
  X,
  Wrench,
  ChevronRight,
  ChevronDown,
  Layers,
  FileQuestion,
  RotateCw,
  BookOpen,
  Database,
  Edit2,
  Trash2,
} from "lucide-react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { getCategoryIcon } from "../lib/categoryIcons";

import {
  fetchAllDmaData,
  createDmaError,
  updateDmaError,
  createDeviceOption,
  renameDeviceOption,
  deleteDeviceOption,
  createDmaDevice,
  updateDmaDevice,
  deleteDmaDevice,
} from "../API/dmaApi";
import IncidentTodoList from "./Library/components/IncidentTodoList";
import DocumentManagerView from "./Documents/DocumentManagerView";

const initialNewErrorState = {
  ten_thiet_bi: "",
  loi: "",
  tinh_trang: "",
  nguyen_nhan: "",
  huong_khac_phuc: "",
};

// Helper highlight từ khóa tìm kiếm
function HighlightText({ text, query }) {
  if (!text || !query || !query.trim()) return <>{text}</>;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.toString().split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="rounded bg-amber-200/90 px-0.5 font-semibold text-amber-950 dark:bg-amber-300 dark:text-amber-900"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const { group: routeGroup, device: routeDevice } = useParams();
  const [searchParams] = useSearchParams();

  // Raw API Data
  const [locations, setLocations] = useState([]); // Luồng 1
  const [troubleList, setTroubleList] = useState([]); // Luồng 2

  // State quản lý UI & Bộ lọc
  const [selectedPq, setSelectedPq] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // State Tìm kiếm toàn cục
  const [search, setSearch] = useState(
    () => searchParams.get("q") || searchParams.get("search") || "",
  );
  const [searchFilterType, setSearchFilterType] = useState("all"); // 'all' | 'errors' | 'dmas'

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search");
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
  }, [searchParams]);

  const [selectedDmaId, setSelectedDmaId] = useState("");
  const [selectedDeviceName, setSelectedDeviceName] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState(null);

  const [activeTab, setActiveTab] = useState("HuongKhacPhuc"); // 'HuongKhacPhuc' | 'NguyenNhan' | 'TinhTrang'
  const [activeMainTab, setActiveMainTab] = useState("incidents"); // 'incidents' | 'documents'
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'detail'
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newError, setNewError] = useState(initialNewErrorState);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLuongDma = Number(selectedPq) <= 2; // Luồng 1: DMA & GPS
  const isLuongSuCo = Number(selectedPq) >= 3; // Luồng 2: Sự cố thiết bị
  const [isRefreshingLibrary, setIsRefreshingLibrary] = useState(false);

  // 1. Tải toàn bộ dữ liệu khi khởi chạy trang
  const loadAllData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setApiError(null);
      const { locations: locs, troubleList: troubles } =
        await fetchAllDmaData();

      setLocations(locs);
      setTroubleList(troubles);

      // Tự động thiết lập tab đầu tiên dựa vào URL route params hoặc search params
      const urlGroup = routeGroup
        ? decodeURIComponent(routeGroup)
        : searchParams.get("group");
      const urlDevice = routeDevice
        ? decodeURIComponent(routeDevice)
        : searchParams.get("device");
      if (urlGroup) {
        const foundLoc = locs.find((l) => l.loai_thiet_bi === urlGroup);
        const foundTrouble = troubles.find((t) => t.loai_thiet_bi === urlGroup);
        if (foundLoc) {
          setSelectedPq(foundLoc.id_pq);
          if (urlDevice) setSelectedDmaId(urlDevice);
        } else if (foundTrouble) {
          setSelectedPq(foundTrouble.id_pq);
          if (urlDevice) setSelectedDeviceName(urlDevice);
        }
      } else if (locs.length > 0) {
        setSelectedPq(locs[0].id_pq || 1);
      } else if (troubles.length > 0) {
        setSelectedPq(troubles[0].id_pq || 3);
      }
    } catch (err) {
      console.error("Lỗi khi nạp dữ liệu:", err);
      setApiError(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.",
      );
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Làm mới dữ liệu không tải lại trang
  const handleReloadLibrary = async () => {
    try {
      setIsRefreshingLibrary(true);
      await loadAllData(true);
    } finally {
      setIsRefreshingLibrary(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 2. Danh sách Dropdown 1: Tự động tổng hợp từ cả 2 luồng dữ liệu
  const categories = useMemo(() => {
    const list = [];
    const addedPq = new Set();

    // Lấy danh mục từ Luồng 1
    locations.forEach((item) => {
      const pq = item.id_pq || 1;
      if (!addedPq.has(pq)) {
        addedPq.add(pq);
        list.push({
          id_pq: pq,
          loai_thiet_bi: item.loai_thiet_bi || `DMA Vùng ${pq}`,
        });
      }
    });

    // Lấy danh mục từ Luồng 2
    troubleList.forEach((item) => {
      const pq = item.id_pq || 3;
      if (!addedPq.has(pq)) {
        addedPq.add(pq);
        list.push({
          id_pq: pq,
          loai_thiet_bi: item.loai_thiet_bi || `Thiết bị nhóm ${pq}`,
        });
      }
    });

    return list.sort((a, b) => a.id_pq - b.id_pq);
  }, [locations, troubleList]);

  // Cập nhật mặc định khi thay đổi Dropdown 1
  useEffect(() => {
    setViewMode("list");

    if (isLuongDma) {
      const currentDmas = locations.filter(
        (loc) => (loc.id_pq || 1) === Number(selectedPq),
      );
      if (currentDmas.length > 0) {
        setSelectedDmaId(currentDmas[0].ten_dma);
      }
    } else if (isLuongSuCo) {
      const currentCategory = troubleList.find(
        (t) => (t.id_pq || 3) === Number(selectedPq),
      );
      if (currentCategory && currentCategory.devices?.length > 0) {
        setSelectedDeviceName(currentCategory.devices[0].ten_thiet_bi);
      }
    }
  }, [selectedPq, isLuongDma, isLuongSuCo, locations, troubleList]);

  // Xử lý chuyển Dropdown 1
  const handleCategoryChange = (idPq) => {
    const numPq = Number(idPq);
    setSelectedPq(numPq);

    const catObj = categories.find((c) => c.id_pq === numPq);
    if (catObj) {
      navigate(`/Library/${encodeURIComponent(catObj.loai_thiet_bi)}`);
    }
  };

  // Đồng bộ lại state khi route params thay đổi từ ngoài vào
  useEffect(() => {
    if (routeGroup) {
      const g = decodeURIComponent(routeGroup);
      const foundLoc = locations.find((l) => l.loai_thiet_bi === g);
      const foundTrouble = troubleList.find((t) => t.loai_thiet_bi === g);
      if (foundLoc && foundLoc.id_pq !== selectedPq) {
        setSelectedPq(foundLoc.id_pq);
      } else if (foundTrouble && foundTrouble.id_pq !== selectedPq) {
        setSelectedPq(foundTrouble.id_pq);
      }
    }
    if (routeDevice) {
      const d = decodeURIComponent(routeDevice);
      if (isLuongDma) setSelectedDmaId(d);
      else if (isLuongSuCo) setSelectedDeviceName(d);
    }
  }, [routeGroup, routeDevice, locations, troubleList, isLuongDma, isLuongSuCo, selectedPq]);

  // =========================================================================
  // TỔNG HỢP VÀ TÌM KIẾM TOÀN CỤC (GLOBAL SEARCH)
  // =========================================================================
  const allErrorsList = useMemo(() => {
    const list = [];
    troubleList.forEach((cat) => {
      const catName = cat.loai_thiet_bi || `Danh mục ${cat.id_pq}`;
      (cat.devices || []).forEach((dev) => {
        const devName = dev.ten_thiet_bi || "Chung";
        (dev.errors || []).forEach((err) => {
          list.push({
            ...err,
            id_pq: cat.id_pq,
            loai_thiet_bi: catName,
            ten_thiet_bi: devName,
          });
        });
      });
    });
    return list;
  }, [troubleList]);

  const allDmaList = useMemo(() => {
    return locations.map((loc) => ({
      ...loc,
      loai_thiet_bi: loc.loai_thiet_bi || `DMA Vùng ${loc.id_pq}`,
    }));
  }, [locations]);

  // Kết quả tìm kiếm toàn cục
  const globalSearchResults = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return { errors: [], dmas: [], total: 0 };

    const matchedErrors = allErrorsList.filter((item) => {
      const loiMatch = item.loi_so?.toString().toLowerCase().includes(kw);
      const tinhTrangMatch = item.tinh_trang?.toLowerCase().includes(kw);
      const nguyenNhanMatch = item.nguyen_nhan?.toLowerCase().includes(kw);
      const huongKhacPhucMatch = item.huong_khac_phuc?.toLowerCase().includes(kw);
      const devMatch = item.ten_thiet_bi?.toLowerCase().includes(kw);
      const catMatch = item.loai_thiet_bi?.toLowerCase().includes(kw);

      return (
        loiMatch ||
        tinhTrangMatch ||
        nguyenNhanMatch ||
        huongKhacPhucMatch ||
        devMatch ||
        catMatch
      );
    });

    const matchedDmas = allDmaList.filter((loc) => {
      const dmaMatch = loc.ten_dma?.toString().toLowerCase().includes(kw);
      const viTriMatch = loc.vi_tri_dma?.toLowerCase().includes(kw);
      const thietBiMatch = loc.thiet_bi?.toLowerCase().includes(kw);
      const catMatch = loc.loai_thiet_bi?.toLowerCase().includes(kw);

      return dmaMatch || viTriMatch || thietBiMatch || catMatch;
    });

    return {
      errors: matchedErrors,
      dmas: matchedDmas,
      total: matchedErrors.length + matchedDmas.length,
    };
  }, [search, allErrorsList, allDmaList]);

  const hasSearchKeyword = search.trim().length > 0;

  // Xử lý khi bấm vào 1 kết quả tìm kiếm sự cố
  const handleSelectSearchResultIncident = (item) => {
    navigate(
      `/Library/${encodeURIComponent(item.loai_thiet_bi)}/${encodeURIComponent(item.ten_thiet_bi)}/detail/${item.id}`
    );
  };

  // Xử lý khi bấm vào 1 kết quả DMA
  const handleSelectSearchResultDma = (loc) => {
    setSelectedPq(loc.id_pq || 1);
    setSelectedDmaId(loc.ten_dma);
    setSearch("");
    navigate(
      `/Library/${encodeURIComponent(loc.loai_thiet_bi)}/${encodeURIComponent(loc.ten_dma)}`
    );
  };

  // --- LUỒNG 1: XỬ LÝ DỮ LIỆU DMA & GPS (KHI KHÔNG TÌM KIẾM HOẶC DUYỆT BÌNH THƯỜNG) ---
  const filteredDmaList = useMemo(() => {
    if (!isLuongDma) return [];
    return locations.filter(
      (item) => (item.id_pq || 1) === Number(selectedPq),
    );
  }, [locations, selectedPq, isLuongDma]);

  const selectedDma = useMemo(() => {
    return (
      filteredDmaList.find((item) => item.ten_dma === selectedDmaId) ||
      filteredDmaList[0] ||
      null
    );
  }, [filteredDmaList, selectedDmaId]);

  // --- LUỒNG 2: XỬ LÝ DỮ LIỆU SỰ CỐ THIẾT BỊ ---
  const currentCategorySuCo = useMemo(() => {
    if (!isLuongSuCo) return null;
    return (
      troubleList.find((t) => (t.id_pq || 3) === Number(selectedPq)) ||
      troubleList[0]
    );
  }, [troubleList, selectedPq, isLuongSuCo]);

  const currentDeviceList = useMemo(() => {
    return currentCategorySuCo?.devices || [];
  }, [currentCategorySuCo]);

  const selectedDeviceObj = useMemo(() => {
    return (
      currentDeviceList.find((d) => d.ten_thiet_bi === selectedDeviceName) ||
      currentDeviceList[0] ||
      null
    );
  }, [currentDeviceList, selectedDeviceName]);

  const filteredErrors = useMemo(() => {
    if (!selectedDeviceObj) return [];
    return selectedDeviceObj.errors || [];
  }, [selectedDeviceObj]);

  const selectedErrorObj = useMemo(() => {
    return (
      filteredErrors.find((e) => e.id === selectedErrorId) ||
      filteredErrors[0] ||
      null
    );
  }, [filteredErrors, selectedErrorId]);

  // Mở Google Maps
  const handleOpenMap = (lat, lng) => {
    if (!lat || !lng) {
      alert("Chưa có dữ liệu tọa độ GPS cho vị trí này!");
      return;
    }
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  // Gửi dữ liệu tạo báo cáo lỗi mới qua API
  const handleSaveNewError = async () => {
    if (!newError.loi.trim()) {
      alert("Vui lòng nhập tiêu đề lỗi!");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id_pq: Number(selectedPq),
        ten_thiet_bi: selectedDeviceObj?.ten_thiet_bi || newError.ten_thiet_bi,
        loi_so: newError.loi.trim(),
        tinh_trang: newError.tinh_trang.trim() || "Ghi nhận từ hệ thống",
        nguyen_nhan: newError.nguyen_nhan.trim() || "Đang kiểm tra",
        huong_khac_phuc:
          newError.huong_khac_phuc.trim() || "Kiểm tra quy trình vận hành",
      };

      await createDmaError(payload);
      alert("Thêm báo cáo lỗi thành công!");

      // Tải lại dữ liệu mới từ backend
      await loadAllData();

      setNewError(initialNewErrorState);
      setOpenAddModal(false);
    } catch (err) {
      alert("Không thể thêm lỗi mới. Vui lòng thử lại!");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // THAO TÁC QUẢN LÝ NHANH OPTION (THÊM / ĐỔI TÊN / XÓA) TRỰC TIẾP TRÊN DROPDOWN 2
  // =========================================================================
  const [optionModal, setOptionModal] = useState(null); // 'add' | 'rename'
  const [optionInputName, setOptionInputName] = useState("");
  const [optionSubmitting, setOptionSubmitting] = useState(false);

  const currentCatObj = categories.find((c) => c.id_pq === Number(selectedPq));
  const currentCatName = currentCatObj?.loai_thiet_bi || "";
  const currentOptionName = isLuongDma ? selectedDma?.ten_dma : selectedDeviceName;

  const handleQuickAddOption = async (e) => {
    e.preventDefault();
    if (!optionInputName.trim()) return;
    try {
      setOptionSubmitting(true);
      const name = optionInputName.trim();
      if (isLuongDma) {
        await createDmaDevice({
          id_pq: Number(selectedPq),
          dma_code: name,
          vi_tri: "",
          thiet_bi: "Bộ mạch PHT",
        });
        await loadAllData(true);
        setSelectedDmaId(name);
        navigate(`/Library/${encodeURIComponent(currentCatName)}/${encodeURIComponent(name)}`);
      } else {
        await createDeviceOption(Number(selectedPq), name);
        await loadAllData(true);
        setSelectedDeviceName(name);
        navigate(`/Library/${encodeURIComponent(currentCatName)}/${encodeURIComponent(name)}`);
      }
      setOptionModal(null);
      setOptionInputName("");
    } catch (err) {
      alert("Lỗi khi thêm Option: " + err.message);
    } finally {
      setOptionSubmitting(false);
    }
  };

  const handleQuickRenameOption = async (e) => {
    e.preventDefault();
    if (!optionInputName.trim()) return;
    try {
      setOptionSubmitting(true);
      const newName = optionInputName.trim();
      if (isLuongDma) {
        if (selectedDma?.stt) {
          await updateDmaDevice(selectedDma.stt, { dma_code: newName });
        }
        await loadAllData(true);
        setSelectedDmaId(newName);
        navigate(`/Library/${encodeURIComponent(currentCatName)}/${encodeURIComponent(newName)}`);
      } else {
        await renameDeviceOption(Number(selectedPq), currentOptionName, newName);
        await loadAllData(true);
        setSelectedDeviceName(newName);
        navigate(`/Library/${encodeURIComponent(currentCatName)}/${encodeURIComponent(newName)}`);
      }
      setOptionModal(null);
      setOptionInputName("");
    } catch (err) {
      alert("Lỗi khi đổi tên Option: " + err.message);
    } finally {
      setOptionSubmitting(false);
    }
  };

  const handleQuickDeleteOption = async () => {
    if (!currentOptionName) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa Option "${currentOptionName}" khỏi danh mục "${currentCatName}"?\nToàn bộ các sự cố hoặc điểm đo thuộc Option này sẽ bị xóa vĩnh viễn!`
      )
    ) {
      return;
    }
    try {
      setOptionSubmitting(true);
      if (isLuongDma) {
        if (selectedDma?.stt) {
          await deleteDmaDevice(selectedDma.stt);
        }
      } else {
        await deleteDeviceOption(Number(selectedPq), currentOptionName);
      }
      await loadAllData(true);
      navigate(`/Library/${encodeURIComponent(currentCatName)}`);
    } catch (err) {
      alert("Lỗi khi xóa Option: " + err.message);
    } finally {
      setOptionSubmitting(false);
    }
  };

  const cardClass =
    "rounded-[20px] border border-[#8db0ee] bg-white/90 p-4 shadow-[0_10px_30px_rgba(34,73,137,0.08)] backdrop-blur-sm transition-all duration-300";

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center gap-3 text-[#2f69d9]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-lg font-semibold">
          Đang nạp dữ liệu hệ thống...
        </span>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-red-500">
        <AlertCircle className="h-10 w-10" />
        <span className="text-lg font-semibold">{apiError}</span>
        <button
          type="button"
          onClick={loadAllData}
          className="mt-2 rounded-lg bg-[#2f69d9] px-4 py-2 text-white shadow transition hover:bg-[#1d478d]"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800">
      <div className="w-full px-3 py-3 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <main className="rounded-[28px] border border-[#7ba2e6]/80 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef5ff] p-4 shadow-[0_18px_40px_rgba(35,72,138,0.10)] lg:p-5">
          {/* THANH ĐIỀU HƯỚNG & LỌC */}
          <section className="grid gap-3 lg:grid-cols-[220px_340px_1fr]">
            {/* DROPDOWN 1: Chọn Phân quyền / Loại Thiết bị kèm Icon */}
            <div ref={categoryDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between gap-2 rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none transition hover:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getCategoryIcon(
                      categories.find((c) => c.id_pq === Number(selectedPq))
                        ?.loai_thiet_bi,
                      selectedPq,
                    )}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover border border-blue-200 bg-white"
                  />
                  <span className="truncate text-sm font-bold text-[#183f82]">
                    {categories.find((c) => c.id_pq === Number(selectedPq))
                      ?.loai_thiet_bi || "Chọn danh mục"}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-blue-500 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[250px] rounded-2xl border border-[#8db0ee]/80 bg-white/95 p-1.5 shadow-[0_16px_35px_rgba(30,64,175,0.18)] backdrop-blur-xl">
                  <div className="max-h-[340px] overflow-y-auto space-y-1">
                    {categories.map((item) => {
                      const isSelected =
                        Number(item.id_pq) === Number(selectedPq);
                      const iconSrc = getCategoryIcon(
                        item.loai_thiet_bi,
                        item.id_pq,
                      );
                      return (
                        <button
                          key={item.id_pq}
                          type="button"
                          onClick={() => {
                            handleCategoryChange(item.id_pq);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "bg-blue-600 font-bold text-white shadow-xs"
                              : "text-[#183f82] hover:bg-blue-50/80 font-medium"
                          }`}
                        >
                          <img
                            src={iconSrc}
                            alt=""
                            className={`h-7 w-7 shrink-0 rounded-full object-cover border ${
                              isSelected
                                ? "border-white/50 bg-white"
                                : "border-blue-100 bg-white"
                            }`}
                          />
                          <span className="truncate flex-1">
                            {item.loai_thiet_bi}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-black">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DROPDOWN 2: Linh hoạt theo Luồng DMA hoặc Sự cố kèm Nút Quản lý Option */}
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                {isLuongDma ? (
                  <select
                    value={selectedDma?.ten_dma || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDmaId(val);
                      const catObj = categories.find(
                        (c) => c.id_pq === Number(selectedPq),
                      );
                      const catName = catObj?.loai_thiet_bi || `DMA`;
                      navigate(
                        `/Library/${encodeURIComponent(catName)}/${encodeURIComponent(val)}`,
                      );
                    }}
                    className="h-11 w-full truncate rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
                  >
                    {filteredDmaList.map((item) => (
                      <option key={item.stt || item.ten_dma} value={item.ten_dma}>
                        DMA: {item.ten_dma}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedDeviceName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDeviceName(val);
                      const catName =
                        currentCategorySuCo?.loai_thiet_bi || "ThietBi";
                      navigate(
                        `/Library/${encodeURIComponent(catName)}/${encodeURIComponent(val)}`,
                      );
                    }}
                    className="h-11 w-full truncate rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
                  >
                    {currentDeviceList.map((dev) => (
                      <option key={dev.ten_thiet_bi} value={dev.ten_thiet_bi}>
                        Thiết bị: {dev.ten_thiet_bi}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nút thao tác CRUD nhanh trên Option */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOptionInputName("");
                    setOptionModal("add");
                  }}
                  title="Thêm Option / Thiết bị mới cho danh mục này"
                  className="flex h-11 w-9 items-center justify-center rounded-[12px] border border-[#8db0ee] bg-white text-[#244a8a] shadow-sm transition hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>

                {currentOptionName && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionInputName(currentOptionName);
                        setOptionModal("rename");
                      }}
                      title="Đổi tên Option / Thiết bị này"
                      className="flex h-11 w-9 items-center justify-center rounded-[12px] border border-[#8db0ee] bg-white text-[#244a8a] shadow-sm transition hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickDeleteOption}
                      disabled={optionSubmitting}
                      title="Xóa Option / Thiết bị này khỏi danh mục"
                      className="flex h-11 w-9 items-center justify-center rounded-[12px] border border-[#8db0ee] bg-white text-slate-500 shadow-sm transition hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Ô TÌM KIẾM TOÀN CỤC & NÚT LÀM MỚI */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="relative flex items-center">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 text-[#4f72ad]"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm toàn cục (Tên lỗi, tình trạng, hướng khắc phục, thiết bị, DMA)..."
                    className="h-11 w-full rounded-[12px] border border-[#8db0ee] bg-white pl-10 pr-10 text-[14px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#2f69d9] focus:ring-4 focus:ring-[#4f80de]/15 placeholder:text-slate-400"
                  />

                  {hasSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      title="Xóa tìm kiếm"
                      className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleReloadLibrary}
                disabled={isRefreshingLibrary}
                title="Tải lại toàn bộ dữ liệu mới nhất từ CSDL"
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] border border-[#8db0ee] bg-white px-3.5 text-xs font-bold text-[#244a8a] shadow-sm transition hover:bg-blue-50 hover:text-[#1d478d] hover:border-blue-400 active:scale-95 disabled:opacity-50"
              >
                <RotateCw
                  size={16}
                  strokeWidth={2.5}
                  className={isRefreshingLibrary ? "animate-spin text-blue-600" : "text-blue-600"}
                />
                <span className="hidden sm:inline">
                  {isRefreshingLibrary ? "Đang tải..." : "Làm mới"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/Admin")}
                title="Quản trị nội dung: Danh mục, Điểm đo DMA & GPS, Sự cố thiết bị"
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] border border-cyan-500/30 bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:from-cyan-700 hover:to-blue-700 active:scale-95"
              >
                <Database size={16} strokeWidth={2.2} />
                <span className="hidden sm:inline">Quản trị dữ liệu</span>
              </button>
            </div>
          </section>

          {/* ========================================================= */}
          {/* KHU VỰC HIỂN THỊ: CHẾ ĐỘ TÌM KIẾM TOÀN CỤC vs CHẾ ĐỘ DUYỆT */}
          {/* ========================================================= */}
          <section className="mt-5">
            {hasSearchKeyword ? (
              /* ===================================================== */
              /* GIAO DIỆN KẾT QUẢ TÌM KIẾM TOÀN CỤC (GLOBAL SEARCH VIEW) */
              /* ===================================================== */
              <div className="space-y-4">
                {/* Banner thống kê tìm kiếm */}
                <div className="rounded-[22px] border border-[#8db0ee] bg-gradient-to-r from-[#eff6ff] via-white to-[#eef4ff] p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f69d9] text-white shadow">
                        <Search size={18} />
                      </div>
                      <div>
                        <h1 className="text-[19px] font-bold text-[#183f82]">
                          Kết quả tìm kiếm toàn cục cho: "
                          <span className="text-[#2f69d9]">{search}</span>"
                        </h1>
                        <p className="text-sm text-[#4f72ad]">
                          Tìm thấy <b>{globalSearchResults.total}</b> kết quả
                          trên toàn bộ hệ thống
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filter tabs */}
                      <div className="flex rounded-xl bg-[#e3ecfc] p-1 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setSearchFilterType("all")}
                          className={`rounded-lg px-3 py-1.5 transition ${
                            searchFilterType === "all"
                              ? "bg-white text-[#183f82] shadow-sm font-bold"
                              : "text-[#4c6898] hover:text-[#183f82]"
                          }`}
                        >
                          Tất cả ({globalSearchResults.total})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFilterType("errors")}
                          className={`rounded-lg px-3 py-1.5 transition ${
                            searchFilterType === "errors"
                              ? "bg-white text-[#183f82] shadow-sm font-bold"
                              : "text-[#4c6898] hover:text-[#183f82]"
                          }`}
                        >
                          Sự cố ({globalSearchResults.errors.length})
                        </button>
                        {globalSearchResults.dmas.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSearchFilterType("dmas")}
                            className={`rounded-lg px-3 py-1.5 transition ${
                              searchFilterType === "dmas"
                                ? "bg-white text-[#183f82] shadow-sm font-bold"
                                : "text-[#4c6898] hover:text-[#183f82]"
                            }`}
                          >
                            Vị trí DMA ({globalSearchResults.dmas.length})
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                      >
                        <X size={14} /> Thoát tìm kiếm
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danh sách kết quả */}
                {globalSearchResults.total === 0 ? (
                  <div className={`${cardClass} py-14 text-center`}>
                    <FileQuestion className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-700">
                      Không tìm thấy dữ liệu phù hợp
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                      Không có sự cố, thiết bị hoặc DMA nào khớp với từ khóa "
                      <b>{search}</b>". Vui lòng thử từ khóa khác hoặc kiểm tra
                      lại chính tả.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2f69d9] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1d478d] transition"
                    >
                      Quay lại danh mục
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Render thẻ sự cố */}
                    {(searchFilterType === "all" ||
                      searchFilterType === "errors") &&
                      globalSearchResults.errors.map((item) => {
                        return (
                          <div
                            key={`search-err-${item.id}`}
                            onClick={() =>
                              handleSelectSearchResultIncident(item)
                            }
                            className="group flex flex-col justify-between rounded-2xl border border-[#8db0ee]/70 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2f69d9] hover:shadow-lg cursor-pointer"
                          >
                            <div>
                              {/* Header thẻ: Phân loại & Tên thiết bị */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef4ff] px-2.5 py-1 text-xs font-bold text-[#2b59b3]">
                                  <img
                                    src={getCategoryIcon(item.loai_thiet_bi, item.id_pq)}
                                    alt=""
                                    className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                                  />
                                  <span>{item.loai_thiet_bi}</span>
                                </span>
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-md px-2 py-0.5">
                                  {item.ten_thiet_bi}
                                </span>
                              </div>

                              {/* Tên lỗi */}
                              <h3 className="mt-3 text-base font-bold text-[#183f82] group-hover:text-[#2f69d9] transition">
                                <HighlightText
                                  text={item.loi_so}
                                  query={search}
                                />
                              </h3>

                              {/* Trích đoạn tình trạng & khắc phục */}
                              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                                {item.tinh_trang && (
                                  <div className="line-clamp-2 rounded-lg bg-slate-50 p-2 text-slate-600">
                                    <b className="text-slate-800">
                                      Tình trạng:
                                    </b>{" "}
                                    <HighlightText
                                      text={item.tinh_trang}
                                      query={search}
                                    />
                                  </div>
                                )}
                                {item.huong_khac_phuc && (
                                  <div className="line-clamp-2 rounded-lg bg-emerald-50/70 p-2 text-emerald-900 border border-emerald-100">
                                    <b className="text-emerald-800">
                                      Khắc phục:
                                    </b>{" "}
                                    <HighlightText
                                      text={item.huong_khac_phuc}
                                      query={search}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Nút xem chi tiết dưới chân thẻ */}
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-[#2f69d9] group-hover:text-[#183f82]">
                              <span>Xem hướng dẫn xử lý</span>
                              <ChevronRight
                                size={16}
                                className="transition group-hover:translate-x-1"
                              />
                            </div>
                          </div>
                        );
                      })}

                    {/* Render thẻ DMA nếu có */}
                    {(searchFilterType === "all" ||
                      searchFilterType === "dmas") &&
                      globalSearchResults.dmas.map((loc) => (
                        <div
                          key={`search-dma-${loc.stt || loc.ten_dma}`}
                          onClick={() => handleSelectSearchResultDma(loc)}
                          className="group flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-lg cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                  <img
                                    src={getCategoryIcon(loc.loai_thiet_bi, loc.id_pq)}
                                    alt=""
                                    className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                                  />
                                  <span>{loc.loai_thiet_bi}</span>
                                </span>
                              <span className="text-xs font-semibold text-slate-500">
                                DMA #{loc.ten_dma}
                              </span>
                            </div>

                            <h3 className="mt-3 text-base font-bold text-emerald-900 group-hover:text-emerald-700 transition">
                              Vị trí:{" "}
                              <HighlightText
                                text={loc.vi_tri_dma || "Chưa xác định"}
                                query={search}
                              />
                            </h3>

                            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                              <div className="rounded-lg bg-slate-50 p-2">
                                <b>Thiết bị kèm theo:</b>{" "}
                                <HighlightText
                                  text={loc.thiet_bi || "N/A"}
                                  query={search}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-emerald-700">
                            <span>Xem vị trí & GPS</span>
                            <ChevronRight
                              size={16}
                              className="transition group-hover:translate-x-1"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* ===================================================== */
              /* GIAO DIỆN DUYỆT THƯỜNG (KHI KHÔNG CÓ TỪ KHÓA TÌM KIẾM) */
              /* ===================================================== */
              <div>
                {/* ========================================================= */}
                {/* LUỒNG 1: BẢN ĐỒ & TỌA ĐỘ DMA (id_pq = 1, 2) */}
                {/* ========================================================= */}
                {isLuongDma && (
                  <div className="space-y-4">
                    {/* Switcher Tab: Vị trí DMA vs Tài liệu chung */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveMainTab("incidents")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                          activeMainTab === "incidents"
                            ? "bg-[#183f82] text-white shadow-blue-900/20 ring-2 ring-blue-400/40"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <MapPin size={15} />
                        <span>Vị trí DMA & Tọa độ GPS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMainTab("documents")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                          activeMainTab === "documents"
                            ? "bg-emerald-700 text-white shadow-emerald-900/20 ring-2 ring-emerald-400/40"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <BookOpen
                          size={15}
                          className={
                            activeMainTab === "documents"
                              ? "text-emerald-200"
                              : "text-emerald-600"
                          }
                        />
                        <span>
                          Hồ sơ Kỹ thuật Tiêu chuẩn DMA (
                          {selectedDma?.ten_dma || `Vùng ${selectedPq}`})
                        </span>
                      </button>
                    </div>

                    {activeMainTab === "documents" ? (
                      <DocumentManagerView
                        su_co_id={null}
                        thiet_bi_name={selectedDma?.ten_dma || ""}
                        id_pq={selectedPq}
                        category_name={
                          selectedDma?.loai_thiet_bi || `DMA Vùng ${selectedPq}`
                        }
                        isEmbedded={true}
                        defaultScope="general"
                      />
                    ) : (
                      <>
                        {/* Banner Thông tin DMA */}
                        <div className="rounded-[22px] border border-[#8db0ee] bg-gradient-to-br from-[#eff6ff] via-white to-[#eef4ff] p-4 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <img
                                src={getCategoryIcon(
                                  selectedDma?.loai_thiet_bi,
                                  selectedPq,
                                )}
                                alt=""
                                className="mt-0.5 h-11 w-11 shrink-0 rounded-full object-cover border border-[#8db0ee] bg-white p-0.5 shadow-sm"
                              />
                              <div>
                                <h1 className="text-[22px] font-bold text-[#183f82]">
                                  DMA {selectedDma?.ten_dma || "---"} (
                                  {selectedDma?.loai_thiet_bi})
                                </h1>
                                <p className="mt-1 text-sm text-[#4f72ad]">
                                  Vị trí:{" "}
                                  <b>{selectedDma?.vi_tri_dma || "Chưa xác định"}</b>{" "}
                                  | Thiết bị:{" "}
                                  <b>{selectedDma?.thiet_bi || "N/A"}</b>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMap(
                                  selectedDma?.vi_do,
                                  selectedDma?.kinh_do,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-[12px] bg-[#2f69d9] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#1d478d]"
                            >
                              <MapPin size={16} /> Mở Google Maps GPS
                            </button>
                          </div>
                        </div>

                        {/* Chi tiết vị trí & Tọa độ */}
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className={cardClass}>
                            <h2 className="mb-3 text-[18px] font-bold text-[#183f82]">
                              Thông tin kỹ thuật vị trí DMA
                            </h2>
                            <div className="space-y-2 text-[#4c6898]">
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Mã DMA:</b> {selectedDma?.ten_dma || "---"}
                              </div>
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Vùng Phân Quyền:</b>{" "}
                                {selectedDma?.loai_thiet_bi || "---"}
                              </div>
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Vị trí chi tiết:</b>{" "}
                                {selectedDma?.vi_tri_dma || "---"}
                              </div>
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Thiết bị kèm theo:</b>{" "}
                                {selectedDma?.thiet_bi || "---"}
                              </div>
                            </div>
                          </div>

                          <div className={cardClass}>
                            <h2 className="mb-3 text-[18px] font-bold text-[#183f82]">
                              Tọa độ địa lý GPS
                            </h2>
                            <div className="space-y-2 text-[#4c6898]">
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Kinh độ (Longitude):</b>{" "}
                                {selectedDma?.kinh_do || "---"}
                              </div>
                              <div className="rounded-lg bg-[#f4f8ff] p-3">
                                <b>Vĩ độ (Latitude):</b>{" "}
                                {selectedDma?.vi_do || "---"}
                              </div>
                              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-700">
                                * Tọa độ GPS đồng bộ trực tiếp từ Supabase Database.
                                Nhấn "Mở Google Maps GPS" để xem bản đồ thực địa.
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* LUỒNG 2: SỰ CỐ & KHẮC PHỤC THIẾT BỊ (id_pq >= 3) */}
                {/* ========================================================= */}
                {isLuongSuCo && (
                  <div className="space-y-4">
                    {/* Switcher Tab: Danh sách sự cố vs Kho tài liệu chung */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveMainTab("incidents")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                          activeMainTab === "incidents"
                            ? "bg-[#183f82] text-white shadow-blue-900/20 ring-2 ring-blue-400/40"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <Wrench size={15} />
                        <span>Danh sách sự cố & Khắc phục</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            activeMainTab === "incidents"
                              ? "bg-white/20 text-white"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {filteredErrors.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMainTab("documents")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs ${
                          activeMainTab === "documents"
                            ? "bg-emerald-700 text-white shadow-emerald-900/20 ring-2 ring-emerald-400/40"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <BookOpen
                          size={15}
                          className={
                            activeMainTab === "documents"
                              ? "text-emerald-200"
                              : "text-emerald-600"
                          }
                        />
                        <span>
                          Hồ sơ Kỹ thuật Tiêu chuẩn (
                          {selectedDeviceObj?.ten_thiet_bi ||
                            currentCategorySuCo?.loai_thiet_bi ||
                            "Hạng mục"}
                          )
                        </span>
                      </button>
                    </div>

                    {activeMainTab === "documents" ? (
                      <DocumentManagerView
                        su_co_id={null}
                        thiet_bi_name={selectedDeviceObj?.ten_thiet_bi || ""}
                        id_pq={selectedPq}
                        category_name={currentCategorySuCo?.loai_thiet_bi || ""}
                        isEmbedded={true}
                        defaultScope="general"
                      />
                    ) : viewMode === "list" ? (
                      <div className="space-y-4">
                        {/* Header thông tin thiết bị */}
                        <div className="rounded-[22px] border border-[#8db0ee] bg-gradient-to-br from-[#eff6ff] via-white to-[#eef4ff] p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={getCategoryIcon(
                                  currentCategorySuCo?.loai_thiet_bi,
                                  selectedPq,
                                )}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full object-cover border border-[#8db0ee] bg-white p-0.5 shadow-sm"
                              />
                              <div>
                                <h1 className="text-[20px] font-bold text-[#183f82]">
                                  Loại thiết bị:{" "}
                                  {currentCategorySuCo?.loai_thiet_bi}
                                </h1>
                                <p className="text-sm text-[#4f72ad]">
                                  Danh sách sự cố:{" "}
                                  <b>
                                    {selectedDeviceObj?.ten_thiet_bi || "---"}
                                  </b>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setOpenAddModal(true)}
                              className="inline-flex items-center gap-2 rounded-[12px] bg-[#2f69d9] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1d478d]"
                            >
                              <Plus size={16} /> Thêm báo cáo lỗi
                            </button>
                          </div>
                        </div>

                        {/* Danh sách lỗi */}
                        <div className={cardClass}>
                          <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-[18px] font-bold text-[#183f82]">
                              Sự cố ghi nhận
                            </h2>
                            <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2d5ab2]">
                              {filteredErrors.length} sự cố
                            </span>
                          </div>

                          <div className="space-y-3">
                            {filteredErrors.length === 0 ? (
                              <div className="py-8 text-center text-slate-400">
                                Không tìm thấy dữ liệu sự cố phù hợp.
                              </div>
                            ) : (
                              filteredErrors.map((err, idx) => {
                                const catName =
                                  currentCategorySuCo?.loai_thiet_bi ||
                                  "ThietBi";
                                const devName =
                                  selectedDeviceObj?.ten_thiet_bi || "Chung";
                                const incidentPath = `/Library/${encodeURIComponent(catName)}/${encodeURIComponent(devName)}/detail/${err.id}`;

                                return (
                                  <div
                                    key={err.id || idx}
                                    onClick={() => navigate(incidentPath)}
                                    className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#8db0ee]/60 bg-white p-4 transition hover:border-[#2f69d9] hover:shadow-md"
                                  >
                                    <div>
                                      <div className="text-xs font-bold uppercase tracking-wider text-[#6c8ec3]">
                                        Mã Lỗi #{idx + 1}
                                      </div>
                                      <div className="mt-1 text-base font-bold text-[#1d478d]">
                                        {err.loi_so}
                                      </div>
                                      <div className="mt-1 text-sm text-slate-600">
                                        <b>Tình trạng:</b> {err.tinh_trang}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(incidentPath);
                                      }}
                                      className="rounded-lg bg-[#f4f8ff] px-3 py-1.5 text-xs font-semibold text-[#2d5ab2] group-hover:bg-[#2f69d9] group-hover:text-white transition"
                                    >
                                      Xem hướng xử lý
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* CHI TIẾT SỰ CỐ */
                      <div className="space-y-4">
                        <div className="rounded-[22px] border border-[#8db0ee] bg-white p-4 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-[#4f72ad] hover:text-[#1d478d]"
                          >
                            <ArrowLeft size={16} /> Quay lại danh sách
                          </button>
                          <div className="flex items-center gap-3">
                            <img
                              src={getCategoryIcon(
                                currentCategorySuCo?.loai_thiet_bi,
                                selectedPq,
                              )}
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-full object-cover border border-[#8db0ee] bg-white p-0.5 shadow-sm"
                            />
                            <div>
                              <h1 className="text-[22px] font-bold text-[#183f82]">
                                Mã lỗi: {selectedErrorObj?.loi_so}
                              </h1>
                              <p className="text-sm text-[#4f72ad]">
                                Thiết bị: <b>{selectedDeviceObj?.ten_thiet_bi}</b> |{" "}
                                Phân loại: <b>{currentCategorySuCo?.loai_thiet_bi}</b>
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            {[
                              {
                                key: "HuongKhacPhuc",
                                label: "Hướng khắc phục",
                              },
                              { key: "NguyenNhan", label: "Nguyên nhân" },
                              { key: "TinhTrang", label: "Tình trạng ban đầu" },
                            ].map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                  activeTab === tab.key
                                    ? "border-[#4f80de] bg-[#2f69d9] text-white"
                                    : "border-[#9bb8ee] bg-white text-[#5d77a8] hover:bg-[#f4f8ff]"
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={cardClass}>
                          <div className="text-base text-slate-700">
                            {activeTab === "HuongKhacPhuc" && (
                              <IncidentTodoList
                                title="Quy trình hướng dẫn xử lý sự cố"
                                icon={<Wrench size={18} />}
                                badgePrefix="Bước"
                                rawText={selectedErrorObj?.huong_khac_phuc || ""}
                                onSave={async (newText) => {
                                  if (!selectedErrorObj?.id) return;
                                  await updateDmaError(selectedErrorObj.id, { huong_khac_phuc: newText });
                                  setTroubleList((prev) =>
                                    prev.map((cat) => ({
                                      ...cat,
                                      devices: cat.devices.map((dev) => ({
                                        ...dev,
                                        errors: dev.errors.map((err) =>
                                          err.id === selectedErrorObj.id
                                            ? { ...err, huong_khac_phuc: newText }
                                            : err
                                        ),
                                      })),
                                    }))
                                  );
                                }}
                                storageKey={`huong_khac_phuc_${selectedErrorObj?.id}`}
                                placeholder="Nhập bước xử lý tiếp theo..."
                                emptyMessage="Chưa có quy trình xử lý sự cố. Hãy thêm các bước ở bên dưới!"
                              />
                            )}

                            {activeTab === "NguyenNhan" && (
                              <IncidentTodoList
                                title="Phân tích nguyên nhân gây ra sự cố"
                                icon={<HelpCircle size={18} />}
                                badgePrefix="Nguyên nhân"
                                rawText={selectedErrorObj?.nguyen_nhan || ""}
                                onSave={async (newText) => {
                                  if (!selectedErrorObj?.id) return;
                                  await updateDmaError(selectedErrorObj.id, { nguyen_nhan: newText });
                                  setTroubleList((prev) =>
                                    prev.map((cat) => ({
                                      ...cat,
                                      devices: cat.devices.map((dev) => ({
                                        ...dev,
                                        errors: dev.errors.map((err) =>
                                          err.id === selectedErrorObj.id
                                            ? { ...err, nguyen_nhan: newText }
                                            : err
                                        ),
                                      })),
                                    }))
                                  );
                                }}
                                storageKey={`nguyen_nhan_${selectedErrorObj?.id}`}
                                placeholder="Nhập nguyên nhân tiếp theo..."
                                emptyMessage="Chưa có phân tích nguyên nhân. Hãy thêm các nguyên nhân ở bên dưới!"
                              />
                            )}

                            {activeTab === "TinhTrang" && (
                              <div className="rounded-xl border border-blue-100 bg-[#f4f8ff] p-4 leading-relaxed">
                                <h3 className="mb-2 font-bold text-[#1d478d]">
                                  Mô tả tình trạng ban đầu:
                                </h3>
                                <p className="whitespace-pre-line">
                                  {selectedErrorObj?.tinh_trang}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* MODAL THÊM LỖI MỚI */}
      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] border border-[#9bb8ee] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#183f82]">
                Thêm lỗi mới ({selectedDeviceObj?.ten_thiet_bi})
              </h3>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Tên / Tiêu đề lỗi *
                </label>
                <input
                  value={newError.loi}
                  onChange={(e) =>
                    setNewError({ ...newError, loi: e.target.value })
                  }
                  placeholder="Ví dụ: Lỗi mất kết nối RS485"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Tình trạng ghi nhận
                </label>
                <input
                  value={newError.tinh_trang}
                  onChange={(e) =>
                    setNewError({ ...newError, tinh_trang: e.target.value })
                  }
                  placeholder="Ví dụ: Đèn nguồn chớp đỏ liên tục"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Nguyên nhân
                </label>
                <textarea
                  rows={2}
                  value={newError.nguyen_nhan}
                  onChange={(e) =>
                    setNewError({ ...newError, nguyen_nhan: e.target.value })
                  }
                  placeholder="Nhập nguyên nhân nghi ngờ..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Hướng khắc phục
                </label>
                <textarea
                  rows={3}
                  value={newError.huong_khac_phuc}
                  onChange={(e) =>
                    setNewError({
                      ...newError,
                      huong_khac_phuc: e.target.value,
                    })
                  }
                  placeholder="Nhập hướng dẫn khắc phục..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNewError}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2f69d9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d478d]"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / ĐỔI TÊN OPTION TRỰC TIẾP TRÊN DROPDOWN 2 */}
      {optionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {optionModal === "add"
                    ? `Thêm Option vào "${currentCatName}"`
                    : `Đổi tên Option "${currentOptionName}"`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {optionModal === "add"
                    ? "Tạo một mục con mới để hiển thị trong Dropdown 2."
                    : "Cập nhật tên hiển thị trong Dropdown 2."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOptionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                optionModal === "add"
                  ? handleQuickAddOption
                  : handleQuickRenameOption
              }
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  {isLuongDma ? "Mã trạm DMA mới" : "Tên Option / Thiết bị mới"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={optionInputName}
                  onChange={(e) => setOptionInputName(e.target.value)}
                  placeholder={isLuongDma ? "Ví dụ: 1125, 1030..." : "Ví dụ: Van NeoFlow GF, Sofrel 4G..."}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOptionModal(null)}
                  disabled={optionSubmitting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={optionSubmitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50"
                >
                  {optionSubmitting
                    ? "Đang lưu..."
                    : optionModal === "add"
                    ? "Thêm Option"
                    : "Lưu tên mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
