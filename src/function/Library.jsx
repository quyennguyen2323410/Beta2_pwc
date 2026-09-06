import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowLeft,
  X,
  Wrench,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { fetchAllDmaData, createDmaError } from "../API/dmaApi";

const initialNewErrorState = {
  ten_thiet_bi: "",
  loi: "",
  tinh_trang: "",
  nguyen_nhan: "",
  huong_khac_phuc: "",
};

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Raw API Data
  const [locations, setLocations] = useState([]); // Luồng 1
  const [troubleList, setTroubleList] = useState([]); // Luồng 2

  // State quản lý UI & Bộ lọc
  const [selectedPq, setSelectedPq] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedDmaId, setSelectedDmaId] = useState("");
  const [selectedDeviceName, setSelectedDeviceName] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState(null);

  const [activeTab, setActiveTab] = useState("HuongKhacPhuc"); // 'HuongKhacPhuc' | 'NguyenNhan' | 'TinhTrang'
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'detail'
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newError, setNewError] = useState(initialNewErrorState);

  // Phân loại luồng dựa vào id_pq
  const isLuongDma = Number(selectedPq) <= 2; // Luồng 1: DMA & GPS
  const isLuongSuCo = Number(selectedPq) >= 3; // Luồng 2: Sự cố thiết bị

  // 1. Tải toàn bộ dữ liệu khi khởi chạy trang
  const loadAllData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const { locations: locs, troubleList: troubles } =
        await fetchAllDmaData();

      setLocations(locs);
      setTroubleList(troubles);

      // Tự động thiết lập tab đầu tiên dựa vào URL hoặc mặc định
      const urlGroup = searchParams.get("group");
      if (urlGroup) {
        const foundLoc = locs.find((l) => l.loai_thiet_bi === urlGroup);
        const foundTrouble = troubles.find((t) => t.loai_thiet_bi === urlGroup);
        if (foundLoc) setSelectedPq(foundLoc.id_pq);
        else if (foundTrouble) setSelectedPq(foundTrouble.id_pq);
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
      setLoading(false);
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
    setSearch("");

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
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("group", catObj.loai_thiet_bi);
      setSearchParams(nextParams);
    }
  };

  // --- LUỒNG 1: XỬ LÝ DỮ LIỆU DMA & GPS ---
  const filteredDmaList = useMemo(() => {
    if (!isLuongDma) return [];
    const kw = search.trim().toLowerCase();
    return locations.filter((item) => {
      const isMatchPq = (item.id_pq || 1) === Number(selectedPq);
      const isMatchKw =
        !kw ||
        item.ten_dma?.toString().toLowerCase().includes(kw) ||
        item.vi_tri_dma?.toLowerCase().includes(kw) ||
        item.thiet_bi?.toLowerCase().includes(kw);
      return isMatchPq && isMatchKw;
    });
  }, [locations, selectedPq, search, isLuongDma]);

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
    const kw = search.trim().toLowerCase();
    const errors = selectedDeviceObj.errors || [];
    return errors.filter(
      (err) =>
        !kw ||
        err.loi_so?.toLowerCase().includes(kw) ||
        err.tinh_trang?.toLowerCase().includes(kw) ||
        err.nguyen_nhan?.toLowerCase().includes(kw) ||
        err.huong_khac_phuc?.toLowerCase().includes(kw),
    );
  }, [selectedDeviceObj, search]);

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
          <section className="grid gap-3 lg:grid-cols-[240px_240px_1fr]">
            {/* DROPDOWN 1: Chọn Phân quyền / Loại Thiết bị */}
            <select
              value={selectedPq}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
            >
              {categories.map((item) => (
                <option key={item.id_pq} value={item.id_pq}>
                  {item.loai_thiet_bi}
                </option>
              ))}
            </select>

            {/* DROPDOWN 2: Linh hoạt theo Luồng DMA hoặc Sự cố */}
            {isLuongDma ? (
              <select
                value={selectedDma?.ten_dma || ""}
                onChange={(e) => setSelectedDmaId(e.target.value)}
                className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
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
                onChange={(e) => setSelectedDeviceName(e.target.value)}
                className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 font-medium text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
              >
                {currentDeviceList.map((dev) => (
                  <option key={dev.ten_thiet_bi} value={dev.ten_thiet_bi}>
                    Thiết bị: {dev.ten_thiet_bi}
                  </option>
                ))}
              </select>
            )}

            {/* Ô TÌM KIẾM */}
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4f72ad]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isLuongDma
                    ? "Tìm mã DMA, vị trí, thiết bị..."
                    : "Tìm tên lỗi, tình trạng, hướng khắc phục..."
                }
                className="h-11 w-full rounded-[12px] border border-[#8db0ee] bg-white px-3 pr-11 text-[15px] text-[#244a8a] shadow-sm outline-none focus:ring-4 focus:ring-[#4f80de]/10"
              />
            </div>
          </section>

          {/* KHU VỰC HIỂN THỊ NỘI DUNG */}
          <section className="mt-5">
            {/* ========================================================= */}
            {/* LUỒNG 1: BẢN ĐỒ & TỌA ĐỘ DMA (id_pq = 1, 2) */}
            {/* ========================================================= */}
            {isLuongDma && (
              <div className="space-y-4">
                {/* Banner Thông tin DMA */}
                <div className="rounded-[22px] border border-[#8db0ee] bg-gradient-to-br from-[#eff6ff] via-white to-[#eef4ff] p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f69d9] to-[#5f93f0] text-white shadow-md">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h1 className="text-[22px] font-bold text-[#183f82]">
                          DMA {selectedDma?.ten_dma || "---"} (
                          {selectedDma?.loai_thiet_bi})
                        </h1>
                        <p className="mt-1 text-sm text-[#4f72ad]">
                          Vị trí:{" "}
                          <b>{selectedDma?.vi_tri_dma || "Chưa xác định"}</b> |
                          Thiết bị: <b>{selectedDma?.thiet_bi || "N/A"}</b>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenMap(selectedDma?.vi_do, selectedDma?.kinh_do)
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
                        <b>Vĩ độ (Latitude):</b> {selectedDma?.vi_do || "---"}
                      </div>
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-700">
                        * Tọa độ GPS đồng bộ từ API
                        `http://fdtech.coder96.com:7843/api/dma`. Nhấn "Mở
                        Google Maps GPS" để xem bản đồ thực địa.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LUỒNG 2: SỰ CỐ & KHẮC PHỤC THIẾT BỊ (id_pq >= 3) */}
            {/* ========================================================= */}
            {isLuongSuCo && (
              <div>
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {/* Header thông tin thiết bị */}
                    <div className="rounded-[22px] border border-[#8db0ee] bg-gradient-to-br from-[#eff6ff] via-white to-[#eef4ff] p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f69d9] text-white shadow">
                            <Wrench size={18} />
                          </div>
                          <div>
                            <h1 className="text-[20px] font-bold text-[#183f82]">
                              Loại thiết bị:{" "}
                              {currentCategorySuCo?.loai_thiet_bi}
                            </h1>
                            <p className="text-sm text-[#4f72ad]">
                              Danh sách sự cố:{" "}
                              <b>{selectedDeviceObj?.ten_thiet_bi || "---"}</b>
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
                          filteredErrors.map((err, idx) => (
                            <div
                              key={err.id || idx}
                              onClick={() => {
                                setSelectedErrorId(err.id);
                                setViewMode("detail");
                              }}
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

                              <span className="rounded-lg bg-[#f4f8ff] px-3 py-1.5 text-xs font-semibold text-[#2d5ab2] group-hover:bg-[#2f69d9] group-hover:text-white">
                                Xem hướng xử lý
                              </span>
                            </div>
                          ))
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
                      <h1 className="text-[22px] font-bold text-[#183f82]">
                        Sự cố: {selectedErrorObj?.loi_so}
                      </h1>
                      <p className="text-sm text-[#4f72ad]">
                        Thiết bị: <b>{selectedDeviceObj?.ten_thiet_bi}</b> |
                        Phân loại: <b>{currentCategorySuCo?.loai_thiet_bi}</b>
                      </p>

                      <div className="mt-4 flex gap-2">
                        {[
                          { key: "HuongKhacPhuc", label: "Hướng khắc phục" },
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
                          <div className="rounded-xl border border-blue-100 bg-[#f4f8ff] p-4 leading-relaxed">
                            <h3 className="mb-2 font-bold text-[#1d478d]">
                              Quy trình xử lý sự cố:
                            </h3>
                            <p className="whitespace-pre-line">
                              {selectedErrorObj?.huong_khac_phuc}
                            </p>
                          </div>
                        )}

                        {activeTab === "NguyenNhan" && (
                          <div className="rounded-xl border border-blue-100 bg-[#f4f8ff] p-4 leading-relaxed">
                            <h3 className="mb-2 font-bold text-[#1d478d]">
                              Phân tích nguyên nhân:
                            </h3>
                            <p className="whitespace-pre-line">
                              {selectedErrorObj?.nguyen_nhan}
                            </p>
                          </div>
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
    </div>
  );
}
