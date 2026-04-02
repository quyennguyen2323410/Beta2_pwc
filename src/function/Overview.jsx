import React from "react";
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

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-slate-800">
      <div className="mx-auto max-w-[1280px] px-4 py-5 lg:px-6">
        <main className="space-y-4">
          <section className="rounded-[26px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
            <div className="border-b-2 border-[#214e95] pb-3">
              <h1 className="text-[24px] font-bold uppercase tracking-wide text-[#16396f]">
                CÔNG TY CỔ PHẦN CẤP NƯỚC PHÚ HÒA TÂN
              </h1>
              <p className="mt-2 max-w-5xl text-[16px] leading-7 text-[#27416f]">
                Tổng hợp tình trạng van giảm áp, logger và thiết bị trên mạng
                lưới – hỗ trợ phát hiện lỗi, tra cứu nguyên nhân và hướng xử lý
                nhanh.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              {topStats.map((item) => (
                <div
                  key={item.label}
                  className="min-h-[86px] rounded-[10px] border-2 border-[#214e95] bg-white px-4 py-3"
                >
                  <div className="text-sm font-semibold text-[#2b4a7f]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-[20px] font-bold text-[#143765]">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.7fr_0.95fr]">
            <div className="space-y-4">
              <div className="rounded-[22px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[22px] font-bold text-[#16396f]">
                    Lỗi phổ biến
                  </h2>
                  <button className="rounded-md border-2 border-[#214e95] px-2 py-1 text-xs font-bold text-[#214e95]">
                    9
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-[#17396b]">
                        {["Thiết bị", "Lỗi", "Nguyên nhân", "Cách xử lý"].map(
                          (head) => (
                            <th
                              key={head}
                              className="border-2 border-[#214e95] px-3 py-2 font-bold"
                            >
                              {head}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {commonIssues.map((row) => (
                        <tr
                          key={row.device + row.issue}
                          className="text-[#2a446d]"
                        >
                          <td className="border-2 border-[#214e95] px-3 py-2 font-semibold">
                            {row.device}
                          </td>
                          <td className="border-2 border-[#214e95] px-3 py-2">
                            {row.issue}
                          </td>
                          <td className="border-2 border-[#214e95] px-3 py-2">
                            {row.cause}
                          </td>
                          <td className="border-2 border-[#214e95] px-3 py-2">
                            {row.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
                <div className="rounded-[22px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
                  <h2 className="mb-3 text-[22px] font-bold text-[#16396f]">
                    Phân loại theo thiết bị (2 ngày)
                  </h2>

                  <div className="space-y-4">
                    {deviceGroups.map((group) => (
                      <div
                        key={group.title}
                        className="border-2 border-[#214e95]"
                      >
                        <div className="flex items-center justify-between border-b-2 border-[#214e95] bg-white px-3 py-2">
                          <div className="font-bold text-[#17396b]">
                            {group.title}
                          </div>
                          <div className="text-sm font-semibold text-[#355588]">
                            {group.total}
                          </div>
                        </div>
                        <div className="space-y-2 px-3 py-3 text-[#27416f]">
                          {group.items.map(([label, count]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <div>• {label}</div>
                              <div className="font-bold">{count} ✓</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
                  <h2 className="mb-3 text-[22px] font-bold text-[#16396f]">
                    Thư viện tài liệu
                  </h2>
                  <div className="space-y-3">
                    {docs.map(([label, page]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigate("/Library")}
                        className="flex w-full items-center justify-between rounded-[10px] border-2 border-[#214e95] bg-white px-3 py-3 text-left text-[#27416f] hover:bg-[#f4f8ff]"
                      >
                        <span>{label}</span>
                        <span className="rounded-md border border-[#214e95] px-2 py-1 text-xs font-bold text-[#214e95]">
                          {page}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
                <div className="rounded-[14px] border-2 border-[#214e95] bg-white px-4 py-3 text-[#17396b]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold">Q nhập - áp cao</div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#214e95] text-sm">
                      ?
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border-2 border-[#214e95] bg-white p-3">
                    <div className="font-bold text-[#17396b]">Nguyên nhân</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[#27416f]">
                      <li>Cặn cát</li>
                      <li>Pin yếu</li>
                    </ul>
                  </div>

                  <div className="rounded-[12px] border-2 border-[#214e95] bg-white p-3">
                    <div className="font-bold text-[#17396b]">
                      Sức ép / khuyến nghị
                    </div>
                    <div className="mt-2 text-[#27416f]">Thay pin</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-[#27416f]">
                  <button
                    type="button"
                    onClick={() => navigate("/Library")}
                    className="block w-full rounded-[10px] border-2 border-[#214e95] bg-white px-3 py-3 text-left hover:bg-[#f4f8ff]"
                  >
                    A. HDSD van giảm áp .pdf
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/Library")}
                    className="block w-full rounded-[10px] border-2 border-[#214e95] bg-white px-3 py-3 text-left hover:bg-[#f4f8ff]"
                  >
                    B. HDSD logger .pdf
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/AI")}
                    className="block w-full rounded-[10px] border-2 border-[#214e95] bg-white px-3 py-3 text-left hover:bg-[#f4f8ff]"
                  >
                    C. Hỏi AI để tra cứu nhanh
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
                <h2 className="mb-4 text-[22px] font-bold text-[#16396f]">
                  Cảnh báo từ logger real time
                </h2>

                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.text}
                      className="grid grid-cols-[34px_1fr_74px] items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center border-2 border-[#214e95] bg-white text-sm font-bold text-[#214e95]">
                        {alert.icon}
                      </div>
                      <div className="rounded-[10px] border-2 border-[#214e95] bg-white px-3 py-3 text-[#27416f]">
                        {alert.text}
                      </div>
                      <div className="rounded-[8px] border-2 border-[#214e95] bg-white px-2 py-2 text-center text-sm font-bold text-[#214e95]">
                        {alert.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
