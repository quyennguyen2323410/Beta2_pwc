import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowLeft,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

// Import hàm gọi API từ file quản lý API riêng
import { fetchDmaLocations } from "../API/dmaApi";

// Danh sách lỗi mẫu gán theo từng loại Thiết bị
const defaultErrorTemplates = {
  "Bộ mạch PHT": [
    {
      id: "pht-1",
      title: "Mất tín hiệu truyền dữ liệu PHT",
      left: [
        "Kiểm tra nguồn cấp cho bộ mạch PHT.",
        "Khởi động lại mô-đun truyền thông.",
      ],
      right: [
        "Kiểm tra SIM và ăng-ten kết nối mạng.",
        "Đối chiếu dữ liệu truyền về server.",
      ],
      causes: [
        "Nguồn điện chập chờn hoặc pin yếu.",
        "Mất sóng di động tại khu vực lắp đặt.",
      ],
      docs: ["HDSD Bộ mạch PHT", "Sơ đồ đấu nối PHT"],
    },
    {
      id: "pht-2",
      title: "Sai số đo cảm biến PHT",
      left: ["Vệ sinh đầu đo cảm biến.", "Hiệu chỉnh lại thông số calib."],
      right: ["Kiểm tra đường ống dẫn áp.", "So sánh với đồng hồ chuẩn."],
      causes: ["Cặn bẩn bám vào cảm biến.", "Lỗi firmware bộ mạch."],
      docs: ["Quy trình hiệu chuẩn PHT"],
    },
  ],
  Regulo: [
    {
      id: "reg-1",
      title: "Không điều khiển được van Regulo",
      left: [
        "Kiểm tra áp lực đầu vào/đầu ra.",
        "Rà soát van solenoid điều khiển.",
      ],
      right: ["Đo tín hiệu điều khiển từ bộ Regulo.", "Kiểm tra nguồn cấp."],
      causes: ["Lỗi màng điều khiển Regulo.", "Kẹt van solenoid."],
      docs: ["Hướng dẫn sửa chữa Regulo", "Checklist kiểm tra áp"],
    },
  ],
  "Cello 4S": [
    {
      id: "cel-1",
      title: "Mất kết nối Logger Cello 4S",
      left: [
        "Kiểm tra pin và nguồn nuôi Cello.",
        "Đồng bộ lại cấu hình gửi tin.",
      ],
      right: [
        "Kiểm tra vị trí đặt Ăng-ten.",
        "Kiểm tra cổng giao tiếp RS232/RS485.",
      ],
      causes: ["Hết pin dự phòng.", "Mất sóng mạng di động."],
      docs: ["HDSD Logger Cello 4S", "Sơ đồ chân Cello 4S"],
    },
  ],
};

const fallbackErrors = [
  {
    id: "gen-1",
    title: "Mất tín hiệu giám sát",
    left: [
      "Kiểm tra nguồn điện cấp cho thiết bị.",
      "Kiểm tra kết nối mạng/truyền thông.",
    ],
    right: [
      "Kiểm tra đèn trạng thái LED trên thiết bị.",
      "Đo điện áp đầu vào.",
    ],
    causes: ["Nguồn cấp không ổn định.", "Lỗi cáp tín hiệu hoặc mất sóng."],
    docs: ["Hướng dẫn xử lý sự cố chung", "Checklist kiểm tra hiện trường"],
  },
];

const accentMap = {
  "Bộ mạch PHT": "from-[#eff6ff] via-white to-[#eef4ff]",
  Regulo: "from-[#eefdf7] via-white to-[#edf8ff]",
  "Cello 4S": "from-[#fff9ee] via-white to-[#f5f7ff]",
  Sofrel: "from-[#fef2f2] via-white to-[#fff5f5]",
  Pegasus: "from-[#faf5ff] via-white to-[#f3e8ff]",
};

const initialNewErrorState = {
  title: "",
  cause1: "",
  cause2: "",
  step1: "",
  step2: "",
  doc1: "",
  doc2: "",
};

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State quản lý dữ liệu API
  const [dmaList, setDmaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // State lưu danh sách lỗi động (Bao gồm lỗi mặc định + lỗi do người dùng thêm)
  const [errorTemplates, setErrorTemplates] = useState(defaultErrorTemplates);

  // State bộ lọc và hiển thị
  const [search, setSearch] = useState("");
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [selectedDmaId, setSelectedDmaId] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState("");
  const [activeTab, setActiveTab] = useState("Cách xử lý");
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [openAddModal, setOpenAddModal] = useState(false);

  const [newError, setNewError] = useState(initialNewErrorState);

  // Load danh sách DMA từ API Service
  const loadDmaData = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const data = await fetchDmaLocations();
      setDmaList(data || []);

      const types = [
        ...new Set((data || []).map((item) => item.thiet_bi)),
      ].filter(Boolean);
      const urlGroup = searchParams.get("group");
      const defaultType =
        urlGroup && types.includes(urlGroup)
          ? urlGroup
          : types[0] || "Bộ mạch PHT";

      setSelectedDeviceType(defaultType);
    } catch (err) {
      console.error("Lỗi tải dữ liệu DMA:", err);
      setApiError("Không thể kết nối đến máy chủ API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDmaData();
  }, []);

  // Danh sách các Loại Thiết bị (Unique list)
  const deviceTypes = useMemo(() => {
    return [...new Set(dmaList.map((item) => item.thiet_bi))].filter(Boolean);
  }, [dmaList]);

  // Danh sách DMA được lọc theo Thiết bị & Keyword
  const filteredDmaList = useMemo(() => {
    return dmaList.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchType = item.thiet_bi === selectedDeviceType;
      const matchKeyword =
        !keyword ||
        item.ten_dma?.toString().toLowerCase().includes(keyword) ||
        item.vi_tri_dma?.toLowerCase().includes(keyword) ||
        item.thiet_bi?.toLowerCase().includes(keyword);

      return matchType && matchKeyword;
    });
  }, [dmaList, search, selectedDeviceType]);

  // Tự động chọn DMA đầu tiên khi danh sách lọc thay đổi
  useEffect(() => {
    if (
      filteredDmaList.length &&
      !filteredDmaList.some((d) => d.ten_dma === selectedDmaId)
    ) {
      setSelectedDmaId(filteredDmaList[0].ten_dma);
    }
  }, [filteredDmaList, selectedDmaId]);

  // DMA hiện tại đang chọn
  const selectedDma = useMemo(() => {
    return (
      filteredDmaList.find((item) => item.ten_dma === selectedDmaId) ||
      filteredDmaList[0]
    );
  }, [filteredDmaList, selectedDmaId]);

  // Danh sách sự cố/lỗi của Thiết bị hiện tại
  const currentErrors = useMemo(() => {
    if (!selectedDma?.thiet_bi) return fallbackErrors;
    return errorTemplates[selectedDma.thiet_bi] || fallbackErrors;
  }, [selectedDma, errorTemplates]);

  // Tự động chọn lỗi đầu tiên khi DMA hoặc Loại thiết bị thay đổi
  useEffect(() => {
    if (currentErrors.length) {
      const exists = currentErrors.some((err) => err.id === selectedErrorId);
      if (!exists) setSelectedErrorId(currentErrors[0].id);
    }
  }, [currentErrors, selectedErrorId]);

  const selectedError =
    currentErrors.find((err) => err.id === selectedErrorId) || currentErrors[0];

  // Đổi Loại Thiết Bị
  const changeDeviceType = (type) => {
    setIsAnimating(true);
    setSelectedDeviceType(type);
    setViewMode("list");
    setActiveTab("Cách xử lý");

    const next = new URLSearchParams(searchParams);
    next.set("group", type);
    setSearchParams(next);

    setTimeout(() => setIsAnimating(false), 220);
  };

  const handleOpenError = (errorId) => {
    setSelectedErrorId(errorId);
    setViewMode("detail");
    setActiveTab("Cách xử lý");
  };

  // Mở Google Maps theo tọa độ (Latitude: vi_do, Longitude: kinh_do)
  const handleOpenMap = (lat, lng) => {
    if (!lat || !lng) {
      alert("Chưa có thông tin tọa độ cho thiết bị này!");
      return;
    }
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, "_blank", "noopener,noreferrer");
  };

  // Thêm lỗi mới vào State
  const handleSaveNewError = () => {
    if (!newError.title.trim()) {
      alert("Vui lòng nhập tên lỗi!");
      return;
    }

    const deviceName = selectedDma?.thiet_bi || selectedDeviceType;
    const generatedId = `custom-${Date.now()}`;

    const newErrorObj = {
      id: generatedId,
      title: newError.title.trim(),
      left: [newError.step1, newError.step2].filter(Boolean),
      right: ["Kiểm tra lại hệ thống sau khi thao tác."],
      causes: [newError.cause1, newError.cause2].filter(Boolean),
      docs: [newError.doc1, newError.doc2].filter(Boolean),
    };

    setErrorTemplates((prev) => ({
      ...prev,
      [deviceName]: [...(prev[deviceName] || []), newErrorObj],
    }));

    setNewError(initialNewErrorState);
    setOpenAddModal(false);
    setSelectedErrorId(generatedId);
  };

  const cardClass =
    "rounded-[20px] border border-[#8db0ee] bg-white/88 p-4 shadow-[0_10px_30px_rgba(34,73,137,0.08)] backdrop-blur-sm transition-all duration-300";

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center gap-3 text-[#2f69d9]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-lg font-semibold">
          Đang tải dữ liệu thiết bị...
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
          onClick={loadDmaData}
          className="mt-2 rounded-lg bg-[#2f69d9] px-4 py-2 text-white shadow transition hover:bg-[#1d478d]"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800">
      <div className="w-full px-3 py-3 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <main className="rounded-[22px] border border-[#7ba2e6]/80 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef5ff] p-3 shadow-[0_18px_40px_rgba(35,72,138,0.10)] sm:rounded-[28px] sm:p-4 lg:p-5">
          {/* Header Controls */}
          <section className="grid gap-3 lg:grid-cols-[220px_220px_1fr]">
            {/* Dropdown loại Thiết bị */}
            <select
              value={selectedDeviceType}
              onChange={(e) => changeDeviceType(e.target.value)}
              className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
            >
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  Thiết bị: {type}
                </option>
              ))}
            </select>

            {/* Dropdown Mã DMA */}
            <select
              value={selectedDma?.ten_dma || ""}
              onChange={(e) => {
                const nextDma = filteredDmaList.find(
                  (item) => item.ten_dma === e.target.value,
                );
                if (nextDma) {
                  setSelectedDmaId(nextDma.ten_dma);
                  setViewMode("list");
                }
              }}
              className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
            >
              {filteredDmaList.map((item) => (
                <option key={item.stt || item.ten_dma} value={item.ten_dma}>
                  DMA: {item.ten_dma}
                </option>
              ))}
            </select>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4f72ad]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm DMA, vị trí, loại thiết bị..."
                className="h-11 w-full rounded-[12px] border border-[#8db0ee] bg-white px-3 pr-11 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
              />
            </div>
          </section>

          {/* Main Content Area */}
          <section
            className={`mt-4 transition-all duration-300 ${
              isAnimating
                ? "translate-y-1 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            {viewMode === "list" ? (
              <div className="space-y-4">
                {/* Banner Thông tin DMA đang chọn */}
                <div
                  className={`rounded-[22px] border border-[#8db0ee] bg-gradient-to-br ${
                    accentMap[selectedDeviceType] ||
                    "from-[#eff6ff] via-white to-[#eef4ff]"
                  } p-4 shadow-[0_14px_34px_rgba(34,73,137,0.10)]`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f69d9] to-[#5f93f0] text-white shadow-md">
                        <Sparkles size={17} />
                      </div>
                      <div>
                        <h1 className="text-[22px] font-bold text-[#183f82] sm:text-[26px]">
                          DMA {selectedDma?.ten_dma || "---"} (
                          {selectedDma?.thiet_bi})
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#4f72ad] sm:text-base">
                          <span>
                            Vị trí: {selectedDma?.vi_tri_dma || "Chưa xác định"}
                          </span>
                          <span>•</span>
                          <span>
                            Tọa độ: {selectedDma?.kinh_do || "---"},{" "}
                            {selectedDma?.vi_do || "---"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenMap(
                                selectedDma?.vi_do,
                                selectedDma?.kinh_do,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-[#8db0ee] bg-white px-2 py-0.5 text-xs font-semibold text-[#2f69d9] shadow-sm transition hover:bg-[#2f69d9] hover:text-white"
                          >
                            <MapPin size={12} />
                            Xem tọa độ
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenAddModal(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#4f80de] bg-white px-4 py-2.5 text-sm font-semibold text-[#1d478d] shadow-[0_8px_18px_rgba(54,102,190,0.12)] transition hover:-translate-y-0.5 hover:bg-[#f7fbff]"
                    >
                      <Plus size={16} />
                      Thêm lỗi
                    </button>
                  </div>
                </div>

                {/* Danh sách lỗi & Sidebar thông tin */}
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                        Các sự cố / lỗi ghi nhận
                      </h2>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2d5ab2]">
                        {currentErrors.length} lỗi
                      </span>
                    </div>

                    <div className="space-y-3">
                      {currentErrors.map((error, index) => (
                        <button
                          key={error.id}
                          type="button"
                          onClick={() => handleOpenError(error.id)}
                          className="group flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#8db0ee] bg-white/90 px-4 py-4 text-left shadow-[0_6px_18px_rgba(34,73,137,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6e98e7] hover:bg-white hover:shadow-[0_12px_24px_rgba(34,73,137,0.12)]"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8ec3]">
                              Lỗi {index + 1}
                            </div>
                            <div className="mt-1 text-[18px] font-bold text-[#1d478d]">
                              {error.title}
                            </div>
                            <div className="mt-2 text-sm leading-6 text-[#5977a9]">
                              {error.causes?.[0] || "Chưa cập nhật nguyên nhân"}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-[10px] border border-[#8db0ee] bg-[#f4f8ff] px-3 py-2 text-sm font-semibold text-[#2d5ab2] transition group-hover:bg-[#ebf2ff]">
                            Xem chi tiết
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar Thông tin DMA */}
                  <div className={cardClass}>
                    <h2 className="mb-3 text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                      Thông tin kỹ thuật DMA
                    </h2>
                    <div className="space-y-3 text-[#4c6898]">
                      <div className="rounded-[12px] bg-white/82 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)]">
                        • <b>Mã DMA:</b> {selectedDma?.ten_dma || "N/A"}
                      </div>
                      <div className="rounded-[12px] bg-white/82 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)]">
                        • <b>Loại thiết bị:</b> {selectedDma?.thiet_bi || "N/A"}
                      </div>
                      <div className="rounded-[12px] bg-white/82 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)]">
                        • <b>Địa điểm:</b> {selectedDma?.vi_tri_dma || "N/A"}
                      </div>

                      {/* Thẻ hiển thị GPS + Nút Xem Tọa Độ */}
                      <div className="flex items-center justify-between rounded-[12px] bg-white/82 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)]">
                        <div>
                          • <b>Tọa độ GPS:</b> {selectedDma?.kinh_do || "---"},{" "}
                          {selectedDma?.vi_do || "---"}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenMap(
                              selectedDma?.vi_do,
                              selectedDma?.kinh_do,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#8db0ee] bg-[#f4f8ff] px-3 py-1.5 text-xs font-semibold text-[#2f69d9] shadow-sm transition hover:bg-[#2f69d9] hover:text-white"
                        >
                          <MapPin size={14} />
                          Xem bản đồ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chi tiết Lỗi / Sự cố */
              <div className="space-y-4">
                <div
                  className={`rounded-[22px] border border-[#8db0ee] bg-gradient-to-br ${
                    accentMap[selectedDeviceType] ||
                    "from-[#eff6ff] via-white to-[#eef4ff]"
                  } p-4 shadow-[0_14px_34px_rgba(34,73,137,0.10)]`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f69d9] to-[#5f93f0] text-white shadow-md">
                        <Sparkles size={17} />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-[#4f72ad] transition hover:text-[#1d478d]"
                        >
                          <ArrowLeft size={16} /> Quay lại danh sách lỗi
                        </button>
                        <h1 className="text-[22px] font-bold text-[#183f82] sm:text-[26px]">
                          Sự cố: {selectedError?.title || "Không rõ lỗi"}
                        </h1>
                        <p className="mt-1 text-sm text-[#4f72ad] sm:text-base">
                          Thiết bị: {selectedDma?.thiet_bi} • Mã DMA:{" "}
                          {selectedDma?.ten_dma}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenAddModal(true)}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#4f80de] bg-white px-4 py-2.5 text-sm font-semibold text-[#1d478d] shadow-[0_8px_18px_rgba(54,102,190,0.12)] transition hover:-translate-y-0.5 hover:bg-[#f7fbff]"
                    >
                      <Plus size={16} />
                      Thêm lỗi khác
                    </button>
                  </div>

                  {/* Tabs switch */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Cách xử lý", "Nguyên nhân", "Tài liệu"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-[12px] border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                          activeTab === tab
                            ? "border-[#4f80de] bg-white text-[#1d478d] shadow-[0_8px_18px_rgba(54,102,190,0.14)]"
                            : "border-[#9bb8ee] bg-white/70 text-[#5d77a8] hover:bg-white hover:text-[#244a8a]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr]">
                  <div className={cardClass}>
                    <div className="space-y-4 text-[15px] leading-7 text-[#4c6898] sm:text-base">
                      {(activeTab === "Cách xử lý"
                        ? selectedError?.left || []
                        : activeTab === "Nguyên nhân"
                          ? selectedError?.causes || []
                          : selectedError?.docs || []
                      ).map((line, index) => (
                        <div
                          key={`${line}-${index}`}
                          className="flex gap-3 rounded-[12px] bg-white/80 px-3 py-2 shadow-[0_4px_12px_rgba(34,73,137,0.05)] transition hover:bg-white"
                        >
                          <span className="font-bold text-[#1d478d]">
                            {index + 1}.
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className="space-y-3 text-[15px] leading-7 text-[#4c6898] sm:text-base">
                      {(selectedError?.right || []).map((line, index) => (
                        <div
                          key={`${line}-${index}`}
                          className="rounded-[12px] bg-white/80 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)] transition hover:bg-white"
                        >
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modal Thêm lỗi mới */}
      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[24px] border border-[#9bb8ee] bg-white p-5 shadow-[0_24px_60px_rgba(20,40,90,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d8fc2]">
                  Thư viện kỹ thuật DMA
                </div>
                <h3 className="mt-1 text-[22px] font-bold text-[#183f82]">
                  Thêm lỗi mới cho {selectedDma?.thiet_bi} (DMA{" "}
                  {selectedDma?.ten_dma})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-[12px] border border-[#9bb8ee] p-2 text-sm font-semibold text-[#244a8a] hover:bg-[#f6f9ff]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Tên lỗi *"
                value={newError.title}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, title: value }))
                }
              />
              <Input
                label="Bước xử lý 1"
                value={newError.step1}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, step1: value }))
                }
              />
              <Input
                label="Nguyên nhân 1"
                value={newError.cause1}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, cause1: value }))
                }
              />
              <Input
                label="Bước xử lý 2"
                value={newError.step2}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, step2: value }))
                }
              />
              <Input
                label="Nguyên nhân 2"
                value={newError.cause2}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, cause2: value }))
                }
              />
              <Input
                label="Tài liệu tham khảo 1"
                value={newError.doc1}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, doc1: value }))
                }
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-[12px] border border-[#9bb8ee] px-4 py-2.5 text-sm font-semibold text-[#244a8a] hover:bg-[#f6f9ff]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNewError}
                className="rounded-[12px] bg-gradient-to-r from-[#2f69d9] to-[#5f93f0] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,105,217,0.25)] hover:opacity-95"
              >
                Lưu lỗi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#355a96]">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[12px] border border-[#9bb8ee] bg-white px-3 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
      />
    </label>
  );
}
