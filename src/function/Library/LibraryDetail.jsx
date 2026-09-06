import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  AlertTriangle,
  Cpu,
  Info,
  Search,
  Loader2,
} from "lucide-react";

export default function DMASearchPage() {
  // States chứa dữ liệu từ API
  const [categories, setCategories] = useState([]);
  const [dmaList, setDmaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States chọn lựa trên Dropdown & Tìm kiếm
  const [selectedCatId, setSelectedCatId] = useState(1);
  const [selectedSubId, setSelectedSubId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch dữ liệu từ Backend đồng thời
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dmaRes, troubleRes] = await Promise.all([
          fetch("http://fdtech.coder96.com:7843/api/dma"),
          fetch("http://fdtech.coder96.com:7843/api/su-co-thiet-bi"),
        ]);

        const dmaData = await dmaRes.json();
        const troubleData = await troubleRes.json();

        if (dmaData.success) setDmaList(dmaData.data || []);
        if (troubleData.success) setCategories(troubleData.data || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError("Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tổng hợp danh mục cho Dropdown 1 (Đảm bảo luôn có DMA Vùng 1 & Vùng 2)
  const allCategories = useMemo(() => {
    const defaultDmaCategories = [
      { id_pq: 1, loai_thiet_bi: "DMA - Vùng 1" },
      { id_pq: 2, loai_thiet_bi: "DMA - Vùng 2" },
    ];

    // Đổ các loại thiết bị từ API nếu chưa có id_pq trùng
    const existingIds = new Set(categories.map((c) => Number(c.id_pq)));
    const filteredDefaults = defaultDmaCategories.filter(
      (d) => !existingIds.has(d.id_pq),
    );

    return [...filteredDefaults, ...categories];
  }, [categories]);

  // Kiểm tra luồng DMA (id_pq 1, 2) hay Luồng Sự Cố (id_pq >= 3)
  const isDMAMode = useMemo(() => {
    return selectedCatId === 1 || selectedCatId === 2;
  }, [selectedCatId]);

  // 2. Danh sách Dropdown 2 thuộc Luồng hiện tại
  const rawSubOptions = useMemo(() => {
    if (isDMAMode) {
      return dmaList.filter(
        (item) => Number(item.id_pq) === Number(selectedCatId),
      );
    } else {
      const cat = categories.find(
        (item) => Number(item.id_pq) === Number(selectedCatId),
      );
      return cat ? cat.devices || [] : [];
    }
  }, [isDMAMode, selectedCatId, dmaList, categories]);

  // 3. Tích hợp TÌM KIẾM nhanh vào Dropdown 2
  const subOptions = useMemo(() => {
    if (!searchTerm.trim()) return rawSubOptions;

    const term = searchTerm.toLowerCase().trim();
    return rawSubOptions.filter((item) => {
      const name = isDMAMode ? item.ten_dma : item.ten_thiet_bi;
      return String(name || "")
        .toLowerCase()
        .includes(term);
    });
  }, [rawSubOptions, searchTerm, isDMAMode]);

  // Tự động chọn item đầu tiên khi đổi Dropdown 1 hoặc kết quả Tìm kiếm thay đổi
  useEffect(() => {
    if (subOptions.length > 0) {
      const firstItemName = isDMAMode
        ? subOptions[0].ten_dma
        : subOptions[0].ten_thiet_bi;
      setSelectedSubId(firstItemName);
    } else {
      setSelectedSubId("");
    }
  }, [selectedCatId, subOptions, isDMAMode]);

  // 4. Lấy đối tượng chi tiết đang chọn
  const currentDetail = useMemo(() => {
    if (!selectedSubId) return null;

    if (isDMAMode) {
      return dmaList.find(
        (item) => String(item.ten_dma) === String(selectedSubId),
      );
    } else {
      const cat = categories.find(
        (item) => Number(item.id_pq) === Number(selectedCatId),
      );
      return cat?.devices?.find((dev) => dev.ten_thiet_bi === selectedSubId);
    }
  }, [selectedSubId, isDMAMode, dmaList, categories, selectedCatId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 font-semibold text-slate-600">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          Đang tải dữ liệu hệ thống...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle size={36} className="mx-auto text-rose-500 mb-2" />
          <p className="font-semibold text-slate-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ================= BAR THÔNG TIN / LỌC ================= */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* DROPDOWN 1: LOẠI THIẾT BỊ / VÙNG */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">
              Loại thiết bị:
            </span>
            <select
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(Number(e.target.value));
                setSearchTerm(""); // Reset tìm kiếm khi chuyển danh mục
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              {allCategories.map((cat) => (
                <option key={cat.id_pq} value={cat.id_pq}>
                  {cat.loai_thiet_bi}
                </option>
              ))}
            </select>
          </div>

          {/* DROPDOWN 2: ĐỔI THEO LUỒNG */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">
              {isDMAMode ? "Mã DMA:" : "Dòng thiết bị:"}
            </span>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              {subOptions.length === 0 && (
                <option value="">(Không tìm thấy dữ liệu)</option>
              )}
              {subOptions.map((item, idx) => (
                <option
                  key={idx}
                  value={isDMAMode ? item.ten_dma : item.ten_thiet_bi}
                >
                  {isDMAMode ? `DMA ${item.ten_dma}` : item.ten_thiet_bi}
                </option>
              ))}
            </select>
          </div>

          {/* TÌM KIẾM */}
          <div className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder={isDMAMode ? "Tìm mã DMA..." : "Tìm tên thiết bị..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* ================= GIAO DIỆN HIỂN THỊ CHI TIẾT ================= */}

        {/* ----------------- LUỒNG 1: HIỂN THỊ DMA (id_pq 1 & 2) ----------------- */}
        {isDMAMode && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* THÔNG TIN CHÍNH DMA */}
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    DMA {currentDetail?.ten_dma || "---"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {currentDetail?.loai_thiet_bi_chung || "DMA"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Vị trí đặt DMA
                  </span>
                  <p className="mt-1 text-base font-medium text-slate-700">
                    {currentDetail?.vi_tri_dma || "Chưa cập nhật"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Thiết bị lắp đặt tại điểm
                  </span>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                    <Cpu size={16} />
                    {currentDetail?.thiet_bi || "Chưa có thiết bị"}
                  </div>
                </div>
              </div>
            </div>

            {/* TỌA ĐỘ GPS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Info size={18} className="text-blue-500" /> Tọa độ GPS
              </h3>
              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kinh độ (Longitude):</span>
                  <span className="font-bold text-slate-700">
                    {currentDetail?.kinh_do || "---"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vĩ độ (Latitude):</span>
                  <span className="font-bold text-slate-700">
                    {currentDetail?.vi_do || "---"}
                  </span>
                </div>
              </div>
              {currentDetail?.kinh_do && currentDetail?.vi_do && (
                <a
                  href={`https://maps.google.com/?q=${currentDetail.vi_do},${currentDetail.kinh_do}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                >
                  <MapPin size={16} /> Xem trên Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* ----------------- LUỒNG 2: HIỂN THỊ SỰ CỐ THIẾT BỊ (id_pq >= 3) ----------------- */}
        {!isDMAMode && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {currentDetail?.ten_thiet_bi || "Chọn thiết bị"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Danh sách lỗi & Hướng xử lý sự cố kỹ thuật
                  </p>
                </div>
              </div>

              {/* DANH SÁCH LỖI/SỰ CỐ CỦA THIẾT BỊ */}
              <div className="mt-6 space-y-4">
                {(!currentDetail?.errors ||
                  currentDetail.errors.length === 0) && (
                  <p className="text-sm italic text-slate-400">
                    Chưa có ghi nhận sự cố cho thiết bị này.
                  </p>
                )}

                {currentDetail?.errors?.map((err, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-amber-300"
                  >
                    <div className="flex items-center gap-2 font-bold text-amber-700">
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs">
                        Lỗi #{err.loi_so}
                      </span>
                      <span>{err.tinh_trang}</span>
                    </div>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-3 text-sm border border-slate-100">
                        <span className="font-semibold text-rose-600">
                          Nguyên nhân:
                        </span>
                        <p className="mt-1 text-slate-600">
                          {err.nguyen_nhan || "Chưa cập nhật"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3 text-sm border border-slate-100">
                        <span className="font-semibold text-emerald-600">
                          Hướng khắc phục:
                        </span>
                        <p className="mt-1 text-slate-600">
                          {err.huong_khac_phuc || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
