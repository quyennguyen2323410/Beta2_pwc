import React from "react";
import { Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const navigate = useNavigate();

  const topStats = [
    { label: "Trạm nước", value: "7 khu vực" },
    { label: "Mực nước hiện tại", value: "Ổn định" },
    { label: "Lỗi hôm nay", value: "12 lỗi" },
    { label: "Cảnh báo áp lực", value: "35 cảnh báo" },
    { label: "Thiết bị bình thường", value: "420 / 480" },
  ];

  const commonIssues = [
    {
      device: "PRV",
      issue: "Áp đầu ra cao",
      cause: "Kẹt màng van",
      action: "Vệ sinh / thay màng",
    },
    {
      device: "Logger",
      issue: "Mất kết nối",
      cause: "Tín yếu / sóng kém",
      action: "Thực hiện / thay SIM",
    },
    {
      device: "Van/VAF",
      issue: "Không giữ áp",
      cause: "Bể đài / đầu nguồn",
      action: "Kiểm tra đầu ống / bơm / van",
    },
  ];

  const deviceGroups = [
    {
      title: "Van giảm áp",
      total: "7 hôm nay",
      items: [
        ["Không giữ áp", 1],
        ["Áp dao động", 4],
        ["Rò rỉ", 5],
      ],
    },
    {
      title: "Logger",
      total: "7 hôm nay",
      items: [
        ["Mất tín hiệu / kết nối", 12],
        ["Pin yếu", 15],
      ],
    },
  ];

  const docs = [
    ["Quy trình xử lý lỗi", 13],
    ["Hướng dẫn sử dụng", 14],
    ["Catalogue thiết bị", 13],
    ["Sơ đồ mạng lưới", 23],
    ["PDF HDSD Logger", 12],
  ];

  const alerts = [
    { icon: "T", text: "8:29 Áp lực bất thường", time: "13:53" },
    { icon: "L", text: "8:45 Lưu lượng đột biến", time: "12:33" },
    { icon: "T", text: "8:55 Mất dữ liệu", time: "13:53" },
  ];

  const cardClass =
    "rounded-[18px] border border-[#7ba2e6]/70 bg-gradient-to-br from-white via-[#f7faff] to-[#eef4ff] p-3 shadow-[0_8px_24px_rgba(32,76,152,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(32,76,152,0.14)] sm:rounded-[22px] sm:p-4";

  const innerCardClass =
    "rounded-[14px] border border-[#8db0ee] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";

  return (
    <div className="min-h-screen  text-slate-800">
      <div className="w-full max-w-none px-3 py-3 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <main className="space-y-3 sm:space-y-4">
          <section className="rounded-[20px] border border-[#7ba2e6]/80 bg-gradient-to-br from-white via-[#f7faff] to-[#eef4ff] p-3 shadow-[0_10px_32px_rgba(35,72,138,0.10)] sm:rounded-[28px] sm:p-4">
            <div className="border-b border-[#8db0ee] pb-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f69d9] to-[#4e8df5] text-white shadow-md">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h1 className="text-[18px] font-bold uppercase leading-tight tracking-wide text-[#183f82] sm:text-[24px]">
                    CÔNG TY CỔ PHẦN CẤP NƯỚC PHÚ HÒA TÂN
                  </h1>
                  <p className="mt-2 text-[14px] leading-6 text-[#48679d] sm:max-w-5xl sm:text-[16px] sm:leading-7">
                    Tổng hợp tình trạng van giảm áp, logger và thiết bị trên
                    mạng lưới – hỗ trợ phát hiện lỗi, tra cứu nguyên nhân và
                    hướng xử lý nhanh.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {topStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[14px] border border-[#8db0ee] bg-white/90 px-3 py-3 shadow-[0_6px_18px_rgba(45,87,165,0.08)] transition-all duration-200 hover:border-[#5f8ee6] hover:shadow-[0_10px_22px_rgba(45,87,165,0.14)] sm:min-h-[86px] sm:px-4"
                >
                  <div className="text-[13px] font-semibold text-[#5672a7] sm:text-sm">
                    {item.label}
                  </div>
                  <div className="mt-2 text-[18px] font-bold text-[#173f82] sm:text-[20px]">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:gap-4 2xl:grid-cols-[1.9fr_1fr] xl:grid-cols-[1.75fr_0.98fr]">
            <div className={cardClass}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-bold text-[#183f82] sm:text-[22px]">
                  Lỗi phổ biến
                </h2>
                <button className="shrink-0 rounded-lg border border-[#7ca1e8] bg-white px-2.5 py-1 text-xs font-bold text-[#2d5ab2] shadow-sm transition hover:bg-[#f3f7ff]">
                  9
                </button>
              </div>

              <div className="overflow-x-auto rounded-[14px] border border-[#8db0ee] bg-white/85">
                <table className="min-w-[640px] w-full border-collapse text-left text-[13px] sm:text-sm">
                  <thead>
                    <tr className="bg-[#f4f8ff] text-[#224989]">
                      {["Thiết bị", "Lỗi", "Nguyên nhân", "Cách xử lý"].map(
                        (head) => (
                          <th
                            key={head}
                            className="border-b border-r border-[#8db0ee] px-2 py-3 font-bold last:border-r-0 sm:px-3"
                          >
                            {head}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {commonIssues.map((row, index) => (
                      <tr
                        key={row.device + row.issue}
                        className={`text-[#4b6698] transition hover:bg-[#f8fbff] ${index !== commonIssues.length - 1 ? "border-b border-[#d7e3fb]" : ""}`}
                      >
                        <td className="border-r border-[#d7e3fb] px-2 py-3 font-semibold text-[#284d8b] sm:px-3">
                          {row.device}
                        </td>
                        <td className="border-r border-[#d7e3fb] px-2 py-3 sm:px-3">
                          {row.issue}
                        </td>
                        <td className="border-r border-[#d7e3fb] px-2 py-3 sm:px-3">
                          {row.cause}
                        </td>
                        <td className="px-2 py-3 sm:px-3">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={cardClass}>
              <div className="rounded-[14px] border border-[#8db0ee] bg-white/90 px-3 py-3 text-[#17396b] shadow-[0_6px_18px_rgba(45,87,165,0.06)] sm:px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold sm:text-base">
                    Q nhập - áp cao
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8db0ee] bg-[#f4f8ff] text-sm text-[#2d5ab2] shadow-sm">
                    ?
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                <div className={`${innerCardClass} p-3`}>
                  <div className="font-bold text-[#224989]">Nguyên nhân</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-[#4b6698] sm:text-base">
                    <li>Cặn cát</li>
                    <li>Pin yếu</li>
                  </ul>
                </div>

                <div className={`${innerCardClass} p-3`}>
                  <div className="font-bold text-[#224989]">
                    Sức ép / khuyến nghị
                  </div>
                  <div className="mt-2 text-[14px] text-[#4b6698] sm:text-base">
                    Thay pin
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-[#27416f] sm:mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/Library")}
                  className="block w-full rounded-[12px] border border-[#8db0ee] bg-white/90 px-3 py-3 text-left text-[14px] shadow-[0_6px_18px_rgba(45,87,165,0.06)] transition hover:-translate-y-0.5 hover:bg-[#f4f8ff] hover:shadow-[0_10px_22px_rgba(45,87,165,0.12)] sm:text-base"
                >
                  A. HDSD van giảm áp .pdf
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/Library")}
                  className="block w-full rounded-[12px] border border-[#8db0ee] bg-white/90 px-3 py-3 text-left text-[14px] shadow-[0_6px_18px_rgba(45,87,165,0.06)] transition hover:-translate-y-0.5 hover:bg-[#f4f8ff] hover:shadow-[0_10px_22px_rgba(45,87,165,0.12)] sm:text-base"
                >
                  B. HDSD logger .pdf
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/AI")}
                  className="block w-full rounded-[12px] border border-[#8db0ee] bg-gradient-to-r from-[#edf4ff] to-[#f8fbff] px-3 py-3 text-left text-[14px] font-medium text-[#224989] shadow-[0_6px_18px_rgba(45,87,165,0.08)] transition hover:-translate-y-0.5 hover:from-[#e2eeff] hover:to-[#f3f8ff] hover:shadow-[0_10px_22px_rgba(45,87,165,0.14)] sm:text-base"
                >
                  C. Hỏi AI để tra cứu nhanh
                </button>
              </div>
            </div>
          </section>

          <section className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-[1.15fr_0.9fr_1fr]">
            <div className={cardClass}>
              <h2 className="mb-3 text-[18px] font-bold text-[#183f82] sm:text-[22px]">
                Phân loại theo thiết bị (2 ngày)
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {deviceGroups.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-[14px] border border-[#8db0ee] bg-white/88 shadow-[0_4px_14px_rgba(45,87,165,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[#d7e3fb] bg-[#f4f8ff] px-3 py-2.5">
                      <div className="text-sm font-bold text-[#224989] sm:text-base">
                        {group.title}
                      </div>
                      <div className="text-xs font-semibold text-[#5a78ad] sm:text-sm">
                        {group.total}
                      </div>
                    </div>
                    <div className="space-y-2 px-3 py-3 text-[14px] text-[#4b6698] sm:text-base">
                      {group.items.map(([label, count]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5 transition hover:bg-[#f7faff]"
                        >
                          <div>{label}</div>
                          <div className="shrink-0 font-bold text-[#224989]">
                            {count} ✓
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="mb-3 text-[18px] font-bold text-[#183f82] sm:text-[22px]">
                Thư viện tài liệu
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {docs.map(([label, page]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate("/Library")}
                    className="flex w-full items-start justify-between gap-3 rounded-[12px] border border-[#8db0ee] bg-white/90 px-3 py-3 text-left text-[14px] text-[#4b6698] shadow-[0_6px_18px_rgba(45,87,165,0.06)] transition hover:-translate-y-0.5 hover:bg-[#f4f8ff] hover:shadow-[0_10px_22px_rgba(45,87,165,0.12)] sm:items-center sm:text-base"
                  >
                    <span className="min-w-0 flex-1 leading-6">{label}</span>
                    <span className="shrink-0 rounded-lg border border-[#7ca1e8] bg-[#f6f9ff] px-2 py-1 text-[11px] font-bold text-[#2d5ab2] sm:text-xs">
                      {page}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="mb-3 text-[18px] font-bold text-[#183f82] sm:mb-4 sm:text-[22px]">
                Cảnh báo từ logger real time
              </h2>

              <div className="space-y-2 sm:space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.text}
                    className="grid grid-cols-[30px_1fr_58px] items-center gap-2 sm:grid-cols-[34px_1fr_74px] sm:gap-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#8db0ee] bg-[#f4f8ff] text-xs font-bold text-[#2d5ab2] shadow-sm sm:h-8 sm:w-8 sm:text-sm">
                      {alert.icon}
                    </div>
                    <div className="rounded-[12px] border border-[#8db0ee] bg-white/92 px-2 py-2 text-[13px] text-[#4b6698] shadow-[0_6px_18px_rgba(45,87,165,0.06)] transition hover:bg-[#f7faff] sm:px-3 sm:py-3 sm:text-base">
                      {alert.text}
                    </div>
                    <div className="rounded-[10px] border border-[#8db0ee] bg-[#f6f9ff] px-1.5 py-2 text-center text-[11px] font-bold text-[#2d5ab2] shadow-sm sm:px-2 sm:text-sm">
                      {alert.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
