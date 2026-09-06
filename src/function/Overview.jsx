import React from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  BookOpen,
  ChevronRight,
  Droplets,
  Gauge,
  MapPinned,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const navigate = useNavigate();

  const urgentAlerts = [
    {
      level: "Nghiêm trọng",
      title: "Áp lực đầu ra PRV tăng bất thường",
      device: "PRV-DMA-02",
      area: "DMA Phú Hòa",
      time: "13:53",
      status: "Chưa xử lý",
    },
    {
      level: "Cao",
      title: "Logger mất tín hiệu dữ liệu",
      device: "LOG-084",
      area: "DMA Tân Phú",
      time: "12:33",
      status: "Đang kiểm tra",
    },
    {
      level: "Trung bình",
      title: "Lưu lượng đột biến ngoài ngưỡng",
      device: "FM-112",
      area: "DMA Khu A",
      time: "11:20",
      status: "Theo dõi",
    },
  ];

  const deviceHealth = [
    ["Van giảm áp PRV", 7, 5, "71%"],
    ["Logger", 180, 27, "85%"],
    ["Đồng hồ lưu lượng", 96, 8, "92%"],
    ["Cảm biến áp lực", 205, 26, "87%"],
  ];

  const knowledgeItems = [
    {
      title: "Quy trình xử lý lỗi PRV",
      desc: "Áp cao, không giữ áp, rò rỉ, kẹt màng van",
      count: "13 lỗi",
    },
    {
      title: "Hướng dẫn kiểm tra Logger",
      desc: "Mất kết nối, pin yếu, SIM lỗi, mất dữ liệu",
      count: "14 lỗi",
    },
    {
      title: "Datasheet thiết bị",
      desc: "Thông số kỹ thuật, catalogue, manual PDF",
      count: "28 tài liệu",
    },
  ];

  const pageBg =
    "min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fbff_32%,#eef4ff_58%,#f9fbff_100%)] text-slate-800";

  const glassCard =
    "rounded-[28px] border border-white/70 bg-white/70 shadow-[0_24px_70px_rgba(30,64,175,0.13)] backdrop-blur-2xl";

  const softCard =
    "rounded-[24px] border border-white/75 bg-white/75 shadow-[0_18px_45px_rgba(30,64,175,0.11)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(30,64,175,0.18)]";

  return (
    <div className={pageBg}>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <main className="space-y-5">
          {/* HERO */}
          <section
            className={`${glassCard} relative overflow-hidden p-5 sm:p-7`}
          >
            {/* <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" /> */}

            <div className="relative grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div>
                {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
                  <Sparkles size={16} />
                  PWC AI Monitoring System
                </div> */}

                <h1 className="text-[26px] font-black uppercase leading-tight tracking-tight text-[#123a77] sm:text-[34px] lg:text-[40px]">
                  Tổng quan giám sát thiết bị, cảnh báo lỗi và tài liệu xử lý
                </h1>

                <p className="mt-4 max-w-5xl text-[15px] leading-7 text-[#4d6798] sm:text-[17px]">
                  Hệ thống hỗ trợ kỹ sư vận hành theo dõi tình trạng thiết bị,
                  xem cảnh báo bất thường, tra cứu datasheet và phương án xử lý
                  lỗi nhanh chóng. Trong thời gian chờ API Intelli, giao diện sử
                  dụng dữ liệu mẫu để hoàn thiện trải nghiệm trước.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/Library")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(37,99,235,0.42)]"
                  >
                    <BookOpen size={18} />
                    Mở kho tài liệu
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/AI")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <Bot size={18} />
                    Hỏi AI xử lý lỗi
                  </button>

                  {/* <button
                    type="button"
                    onClick={() => navigate("/Library")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <Plus size={18} />
                    Cập nhật lỗi mới
                  </button> */}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-gradient-to-br from-[#0f3b7c] via-[#1454a7] to-[#14b8c8] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_24px_60px_rgba(14,88,170,0.28)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-100">
                      Tình trạng mạng lưới
                    </p>
                    <h2 className="mt-1 text-3xl font-black">Ổn định</h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 shadow-inner backdrop-blur">
                    <Droplets size={28} />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm text-blue-100">
                      <span>Thiết bị hoạt động tốt</span>
                      <span>86.4%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full w-[86%] rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.75)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/14 p-3 backdrop-blur">
                      <p className="text-xs text-blue-100">Cập nhật gần nhất</p>
                      <p className="mt-1 text-lg font-black">13:53</p>
                    </div>
                    <div className="rounded-2xl bg-white/14 p-3 backdrop-blur">
                      <p className="text-xs text-blue-100">Nguồn dữ liệu</p>
                      <p className="mt-1 text-lg font-black">Mock Data</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN CONTENT */}
          <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            {/* PRIORITY ALERTS */}
            <div className={`${softCard} p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-[#163f7e]">
                    Cảnh báo ưu tiên
                  </h2>
                  <p className="mt-1 text-sm text-[#6c7fa4]">
                    Các lỗi cần kỹ sư kiểm tra trước trong ngày
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {urgentAlerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="rounded-2xl border border-white/75 bg-white/80 p-4 shadow-[0_10px_25px_rgba(30,64,175,0.08)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
                          <AlertTriangle size={22} />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">
                              {alert.level}
                            </span>
                            <span className="text-xs font-semibold text-[#7890b4]">
                              {alert.time}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-black text-[#183f82]">
                            {alert.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#657da8]">
                            {alert.device} · {alert.area}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          {alert.status}
                        </span>
                        <button
                          onClick={() => navigate("/Library")}
                          className="rounded-xl bg-[#163f7e] px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          Xử lý
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK SEARCH */}
            <div className={`${softCard} p-5`}>
              <h2 className="text-2xl font-black text-[#163f7e]">
                Tra cứu nhanh
              </h2>
              <p className="mt-1 text-sm text-[#6c7fa4]">
                Tìm lỗi, thiết bị, mã DMA hoặc tài liệu hướng dẫn
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/85 px-4 py-3 shadow-inner">
                <Search size={20} className="text-blue-500" />
                <input
                  type="text"
                  placeholder="Nhập mã thiết bị, tên lỗi, mã DMA..."
                  className="w-full bg-transparent text-sm font-medium text-[#163f7e] outline-none placeholder:text-[#8fa2c2]"
                />
              </div>

              <div className="mt-4 grid gap-3">
                {knowledgeItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => navigate("/Library")}
                    className="rounded-2xl border border-white/80 bg-white/80 p-4 text-left shadow-[0_10px_25px_rgba(30,64,175,0.08)] transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-[#183f82]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-[#6c7fa4]">
                          {item.desc}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                        {item.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
