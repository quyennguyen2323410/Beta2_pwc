import React, { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BookOpen,
  Search,
  FileText,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  X,
  Layers,
  MapPin,
  Wrench,
  Loader2,
  FileQuestion,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAllDmaData } from "../API/dmaApi";

// Component Highlight từ khóa tìm kiếm
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
            className="rounded bg-amber-200/90 px-1 font-semibold text-amber-950"
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

export default function Overview() {
  const navigate = useNavigate();

  // Dữ liệu từ API
  const [locations, setLocations] = useState([]);
  const [troubleList, setTroubleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State tìm kiếm & bộ lọc
  const [search, setSearch] = useState("");
  const [searchFilterType, setSearchFilterType] = useState("all"); // 'all' | 'errors' | 'dmas'

  // Tải dữ liệu hệ thống
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const { locations: locs, troubleList: troubles } =
          await fetchAllDmaData();
        if (isMounted) {
          setLocations(locs || []);
          setTroubleList(troubles || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tra cứu:", err);
        if (isMounted) {
          setFetchError("Không thể tải dữ liệu tìm kiếm.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tổng hợp danh sách tất cả các sự cố
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

  // Tổng hợp danh sách tất cả điểm đo DMA
  const allDmaList = useMemo(() => {
    return locations.map((loc) => ({
      ...loc,
      loai_thiet_bi: loc.loai_thiet_bi || `DMA Vùng ${loc.id_pq}`,
    }));
  }, [locations]);

  // Thống kê số lượng theo danh mục mặc định
  const prvCount = useMemo(() => {
    const cat = troubleList.find(
      (c) =>
        c.loai_thiet_bi?.toUpperCase().includes("PRV") ||
        Number(c.id_pq) === 3,
    );
    if (!cat) return "13 lỗi";
    let count = 0;
    (cat.devices || []).forEach((d) => (count += (d.errors || []).length));
    return `${count} lỗi`;
  }, [troubleList]);

  const loggerCount = useMemo(() => {
    const cat = troubleList.find(
      (c) =>
        c.loai_thiet_bi?.toUpperCase().includes("LOGGER") ||
        Number(c.id_pq) === 4,
    );
    if (!cat) return "14 lỗi";
    let count = 0;
    (cat.devices || []).forEach((d) => (count += (d.errors || []).length));
    return `${count} lỗi`;
  }, [troubleList]);

  // Kết quả tìm kiếm
  const globalSearchResults = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return { errors: [], dmas: [], total: 0 };

    const matchedErrors = allErrorsList.filter((item) => {
      const loiMatch = item.loi_so?.toString().toLowerCase().includes(kw);
      const tinhTrangMatch = item.tinh_trang?.toLowerCase().includes(kw);
      const nguyenNhanMatch = item.nguyen_nhan?.toLowerCase().includes(kw);
      const huongKhacPhucMatch = item.huong_khac_phuc
        ?.toLowerCase()
        .includes(kw);
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

  // Điều hướng khi click vào sự cố
  const handleSelectIncident = (item) => {
    navigate(
      `/Library/${encodeURIComponent(item.loai_thiet_bi)}/${encodeURIComponent(item.ten_thiet_bi)}/detail/${item.id}`,
    );
  };

  // Điều hướng khi click vào DMA
  const handleSelectDma = (loc) => {
    navigate(
      `/Library/${encodeURIComponent(loc.loai_thiet_bi)}/${encodeURIComponent(loc.ten_dma)}`,
    );
  };

  // Danh mục tra cứu nhanh khi không tìm kiếm
  const knowledgeItems = [
    {
      title: "Quy trình xử lý lỗi PRV",
      desc: "Áp cao, không giữ áp, rò rỉ, kẹt màng van",
      count: prvCount,
      icon: FileText,
      color: "from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/60",
      action: () => {
        const cat = troubleList.find((c) =>
          c.loai_thiet_bi?.toUpperCase().includes("PRV"),
        );
        if (cat) navigate(`/Library/${encodeURIComponent(cat.loai_thiet_bi)}`);
        else navigate("/Library");
      },
    },
    {
      title: "Hướng dẫn kiểm tra Logger",
      desc: "Mất kết nối, pin yếu, SIM lỗi, mất dữ liệu",
      count: loggerCount,
      icon: HelpCircle,
      color: "from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-200/60",
      action: () => {
        const cat = troubleList.find((c) =>
          c.loai_thiet_bi?.toUpperCase().includes("LOGGER"),
        );
        if (cat) navigate(`/Library/${encodeURIComponent(cat.loai_thiet_bi)}`);
        else navigate("/Library");
      },
    },
    {
      title: "Datasheet thiết bị",
      desc: "Thông số kỹ thuật, catalogue, manual PDF",
      count: "28 tài liệu",
      icon: FolderOpen,
      color: "from-teal-500/10 to-emerald-500/10 text-teal-600 border-teal-200/60",
      action: () => navigate("/Library"),
    },
  ];

  const pageBg =
    "min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fbff_32%,#eef4ff_58%,#f9fbff_100%)] text-slate-800";

  const glassCard =
    "rounded-[28px] border border-white/70 bg-white/70 shadow-[0_24px_70px_rgba(30,64,175,0.13)] backdrop-blur-2xl";

  const softCard =
    "rounded-[24px] border border-white/75 bg-white/75 shadow-[0_18px_45px_rgba(30,64,175,0.11)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_28px_70px_rgba(30,64,175,0.18)]";

  return (
    <div className={pageBg}>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <main className="space-y-6">
          {/* HERO */}
          <section
            className={`${glassCard} relative overflow-hidden p-6 sm:p-8`}
          >
            <div className="max-w-4xl">
              <h1 className="text-[26px] font-black uppercase leading-tight tracking-tight text-[#123a77] sm:text-[34px] lg:text-[38px]">
                Tổng quan tài liệu xử lý
              </h1>

              <p className="mt-4 text-[15px] leading-7 text-[#4d6798] sm:text-[17px]">
                Hệ thống hỗ trợ kỹ sư vận hành theo dõi tình trạng thiết bị và
                phương án xử lý lỗi nhanh chóng.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/Library")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(37,99,235,0.42)]"
                >
                  <BookOpen size={18} />
                  Mở kho tài liệu
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/AI")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <Bot size={18} />
                  Hỏi AI xử lý lỗi
                </button>
              </div>
            </div>
          </section>

          {/* TRA CỨU & TÌM KIẾM TOÀN CỤC */}
          <section className={`${softCard} p-6 sm:p-8`}>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#163f7e]">
                  Tra cứu nhanh
                </h2>
                <p className="mt-1 text-sm text-[#6c7fa4]">
                  Tìm kiếm tức thì theo mã lỗi, tên thiết bị, mã điểm đo DMA hoặc hướng khắc phục
                </p>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <Loader2 size={15} className="animate-spin" />
                  Đang đồng bộ dữ liệu...
                </div>
              )}
            </div>

            {/* Ô TÌM KIẾM */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/95 px-4 py-3.5 shadow-sm transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={20} className="shrink-0 text-blue-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập mã thiết bị, tên lỗi, mã DMA, nguyên nhân hoặc phương án xử lý..."
                  className="w-full bg-transparent text-sm font-medium text-[#163f7e] outline-none placeholder:text-[#8fa2c2]"
                />
                {hasSearchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                    title="Xóa tìm kiếm"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* KHI CÓ TỪ KHÓA TÌM KIẾM -> HIỂN THỊ KẾT QUẢ TÌM KIẾM */}
            {hasSearchKeyword ? (
              <div className="space-y-4">
                {/* Header thanh lọc kết quả */}
                <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[#183f82]">
                    Tìm thấy <b>{globalSearchResults.total}</b> kết quả khớp với "
                    <span className="font-bold text-blue-600">{search}</span>"
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl bg-white/80 p-1 text-xs font-semibold shadow-inner">
                      <button
                        type="button"
                        onClick={() => setSearchFilterType("all")}
                        className={`rounded-lg px-3 py-1.5 transition ${
                          searchFilterType === "all"
                            ? "bg-[#163f7e] text-white shadow-sm font-bold"
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
                            ? "bg-[#163f7e] text-white shadow-sm font-bold"
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
                              ? "bg-[#163f7e] text-white shadow-sm font-bold"
                              : "text-[#4c6898] hover:text-[#183f82]"
                          }`}
                        >
                          Điểm đo DMA ({globalSearchResults.dmas.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danh sách kết quả hoặc thông báo trống */}
                {globalSearchResults.total === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center">
                    <FileQuestion className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <h3 className="text-base font-bold text-[#183f82]">
                      Không tìm thấy dữ liệu phù hợp
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                      Không có sự cố, thiết bị hoặc điểm DMA nào khớp với từ khóa "<b>{search}</b>".
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#163f7e] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Thẻ Sự cố */}
                    {(searchFilterType === "all" || searchFilterType === "errors") &&
                      globalSearchResults.errors.map((item) => (
                        <div
                          key={`err-${item.id}`}
                          onClick={() => handleSelectIncident(item)}
                          className="group flex flex-col justify-between rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_20px_rgba(30,64,175,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:bg-white hover:shadow-[0_14px_30px_rgba(30,64,175,0.12)] cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                <Layers size={12} />
                                <HighlightText
                                  text={item.loai_thiet_bi}
                                  query={search}
                                />
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                <HighlightText
                                  text={item.ten_thiet_bi}
                                  query={search}
                                />
                              </span>
                            </div>

                            <h3 className="mt-2.5 text-sm font-bold text-[#183f82] group-hover:text-blue-600 transition">
                              <HighlightText
                                text={`Lỗi số ${item.loi_so || 1}: ${item.tinh_trang || "Sự cố thiết bị"}`}
                                query={search}
                              />
                            </h3>

                            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                              {item.nguyen_nhan && (
                                <p className="line-clamp-2 rounded-lg bg-slate-50 p-2">
                                  <b className="text-[#163f7e]">Nguyên nhân:</b>{" "}
                                  <HighlightText
                                    text={item.nguyen_nhan}
                                    query={search}
                                  />
                                </p>
                              )}
                              {item.huong_khac_phuc && (
                                <p className="line-clamp-2 rounded-lg bg-blue-50/60 p-2 text-blue-900">
                                  <b className="text-blue-700">Khắc phục:</b>{" "}
                                  <HighlightText
                                    text={item.huong_khac_phuc}
                                    query={search}
                                  />
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-blue-600 opacity-80 group-hover:opacity-100">
                            <span>Chi tiết hướng xử lý</span>
                            <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                          </div>
                        </div>
                      ))}

                    {/* Thẻ DMA */}
                    {(searchFilterType === "all" || searchFilterType === "dmas") &&
                      globalSearchResults.dmas.map((loc) => (
                        <div
                          key={`dma-${loc.stt || loc.ten_dma}`}
                          onClick={() => handleSelectDma(loc)}
                          className="group flex flex-col justify-between rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_20px_rgba(30,64,175,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400 hover:bg-white hover:shadow-[0_14px_30px_rgba(30,64,175,0.12)] cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">
                                <MapPin size={12} />
                                <HighlightText
                                  text={loc.loai_thiet_bi}
                                  query={search}
                                />
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                                <HighlightText
                                  text={loc.ten_dma}
                                  query={search}
                                />
                              </span>
                            </div>

                            <h3 className="mt-2.5 text-sm font-bold text-[#183f82] group-hover:text-cyan-600 transition">
                              <HighlightText
                                text={loc.vi_tri_dma || `Điểm đo ${loc.ten_dma}`}
                                query={search}
                              />
                            </h3>

                            {loc.thiet_bi && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                                <Wrench size={13} className="text-slate-400 shrink-0" />
                                <span className="line-clamp-1">
                                  <HighlightText
                                    text={loc.thiet_bi}
                                    query={search}
                                  />
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-cyan-700 opacity-80 group-hover:opacity-100">
                            <span>Xem vị trí & thiết bị</span>
                            <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              /* KHI CHƯA NHẬP TỪ KHÓA -> HIỂN THỊ DANH MỤC TRUY CẬP NHANH */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {knowledgeItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={item.action}
                      className="group flex flex-col justify-between rounded-2xl border border-white/80 bg-white/80 p-5 text-left shadow-[0_10px_25px_rgba(30,64,175,0.08)] transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_35px_rgba(30,64,175,0.14)]"
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-br ${item.color}`}
                          >
                            <IconComponent size={22} />
                          </div>
                          <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                            {item.count}
                          </span>
                        </div>

                        <h3 className="font-black text-[#183f82] transition group-hover:text-blue-600">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-[#6c7fa4]">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 opacity-80 group-hover:opacity-100">
                        <span>Xem chi tiết</span>
                        <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
