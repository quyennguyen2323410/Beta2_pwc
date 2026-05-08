import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const defaultDevices = [
  {
    id: "1",
    group: "Van giảm áp",
    brand: "Bernad",
    name: "Bermad 720",
    description:
      "Van giảm áp điều khiển thủy lực dùng để ổn định áp lực đầu ra.",
    errors: [
      {
        id: "prv-1",
        title: "Áp đầu ra cao",
        left: [
          "Đóng van đầu vào, tạm ngắt nước qua van giảm áp.",
          "Kiểm tra màng van, vệ sinh hoặc thay thế nếu hư.",
        ],
        right: [
          "Đóng van hạ lưu để kiểm tra cảm biến lỗi ngay.",
          "Thử lên pilot để đo lưu lượng đột ngột qua van.",
        ],
        causes: [
          "Mở van bi hư hoặc hạt đo cảm biến bám lâu ngày.",
          "Thông pilot không điều khiển được van.",
        ],
        docs: [
          "TL hướng dẫn bảo trì van giảm áp",
          "Tra cứu dữ liệu logger",
          "Cách kiểm tra màng van",
        ],
      },
      {
        id: "prv-2",
        title: "Không giữ áp",
        left: [
          "Kiểm tra đầu vào và đầu ra để xác định độ tụt áp.",
          "Rà soát pilot, van kim và màng điều khiển.",
        ],
        right: [
          "Đo áp tại 2 đầu van để so sánh với cài đặt.",
          "Xác nhận có rò rỉ hoặc nghẽn trên tuyến bypass hay không.",
        ],
        causes: [
          "Pilot chỉnh sai hoặc tắc nghẽn đường impulse.",
          "Màng van mòn hoặc buồng điều khiển rò nước.",
        ],
        docs: [
          "Quy trình chỉnh pilot",
          "Checklist kiểm tra áp",
          "Sơ đồ cấu tạo PRV",
        ],
      },
    ],
  },
  {
    id: "2",
    group: "Logger",
    brand: "HWM",
    name: "HWM Permalog+",
    description:
      "Thiết bị logger thu thập dữ liệu áp lực và lưu lượng hiện trường.",
    errors: [
      {
        id: "log-1",
        title: "Mất tín hiệu logger",
        left: [
          "Kiểm tra trạng thái pin và nguồn cấp của logger.",
          "Đồng bộ lại thiết bị và kiểm tra chu kỳ gửi dữ liệu.",
        ],
        right: [
          "Thử lại kênh truyền để loại trừ lỗi mạng di động.",
          "Đối chiếu dữ liệu hiện trường với dữ liệu nhận trên hệ thống.",
        ],
        causes: [
          "Pin yếu hoặc hết pin.",
          "Mất sóng, lỗi đồng bộ hoặc sai cấu hình logger.",
        ],
        docs: [
          "TL hướng dẫn bảo trì logger",
          "Cấu hình logger",
          "Đọc dữ liệu logger",
        ],
      },
      {
        id: "log-2",
        title: "Mất dữ liệu",
        left: [
          "Kiểm tra bộ nhớ logger và chu kỳ ghi nhận.",
          "Xác nhận thiết bị còn đồng bộ thời gian với hệ thống.",
        ],
        right: [
          "Đối chiếu dữ liệu cuối cùng nhận được với hiện trường.",
          "Kiểm tra firmware và cấu hình gửi gói tin.",
        ],
        causes: [
          "Lỗi bộ nhớ hoặc mất đồng bộ thời gian.",
          "Firmware cũ hoặc chu kỳ gửi dữ liệu thiết lập sai.",
        ],
        docs: [
          "Checklist kiểm tra dữ liệu",
          "HDSD bộ nhớ logger",
          "Quy trình reset logger",
        ],
      },
    ],
  },
  {
    id: "3",
    group: "ĐH cỡ lớn",
    brand: "Sensus",
    name: "Sensus iPERL",
    description: "Thiết bị đo nước cỡ lớn dùng trong mạng lưới chính.",
    errors: [
      {
        id: "meter-1",
        title: "Đồng hồ đo bất thường",
        left: [
          "Khóa tuyến và kiểm tra tình trạng đo thực tế tại hiện trường.",
          "Đối chiếu số liệu đo với lưu lượng tham chiếu để xác định sai lệch.",
        ],
        right: [
          "Kiểm tra cánh đo, cảm biến và cụm truyền tín hiệu.",
          "Xác nhận có nghẹt cặn hoặc ảnh hưởng rung động trên tuyến hay không.",
        ],
        causes: [
          "Sai số đo do cặn bẩn hoặc mài mòn cơ cấu đo.",
          "Tín hiệu truyền không ổn định hoặc lắp đặt sai hướng dòng.",
        ],
        docs: [
          "Hướng dẫn kiểm tra đồng hồ cỡ lớn",
          "Quy trình tháo lắp và hiệu chuẩn",
          "Checklist kiểm tra hiện trường",
        ],
      },
    ],
  },
];

const topTabs = [
  { label: "Van giảm áp", value: "Van giảm áp" },
  { label: "Logger", value: "Logger" },
  { label: "ĐH cỡ lớn", value: "ĐH cỡ lớn" },
];

const accentMap = {
  "Van giảm áp": "from-[#eff6ff] via-white to-[#eef4ff]",
  Logger: "from-[#eefdf7] via-white to-[#edf8ff]",
  "ĐH cỡ lớn": "from-[#fff9ee] via-white to-[#f5f7ff]",
};

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [devices] = useState(defaultDevices);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(
    searchParams.get("group") || "Van giảm áp",
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState("");
  const [activeTab, setActiveTab] = useState("Cách xử lý");
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newError, setNewError] = useState({
    title: "",
    cause1: "",
    cause2: "",
    step1: "",
    step2: "",
    doc1: "",
    doc2: "",
  });

  useEffect(() => {
    const urlGroup = searchParams.get("group");
    if (urlGroup) setSelectedGroup(urlGroup);
  }, [searchParams]);

  const filteredDevices = useMemo(() => {
    return devices.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchGroup = item.group === selectedGroup;
      const matchKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.brand.toLowerCase().includes(keyword) ||
        item.group.toLowerCase().includes(keyword) ||
        item.errors.some((error) =>
          error.title.toLowerCase().includes(keyword),
        );
      return matchGroup && matchKeyword;
    });
  }, [devices, search, selectedGroup]);

  useEffect(() => {
    if (
      filteredDevices.length &&
      !filteredDevices.some((d) => d.id === selectedDeviceId)
    ) {
      setSelectedDeviceId(filteredDevices[0].id);
    }
  }, [filteredDevices, selectedDeviceId]);

  const selectedDevice =
    filteredDevices.find((item) => item.id === selectedDeviceId) ||
    filteredDevices[0];

  useEffect(() => {
    if (selectedDevice?.errors?.length) {
      const exists = selectedDevice.errors.some(
        (err) => err.id === selectedErrorId,
      );
      if (!exists) setSelectedErrorId(selectedDevice.errors[0].id);
    }
  }, [selectedDevice, selectedErrorId]);

  const selectedError =
    selectedDevice?.errors?.find((err) => err.id === selectedErrorId) ||
    selectedDevice?.errors?.[0];

  const changeGroup = (group) => {
    setIsAnimating(true);
    setSelectedGroup(group);
    setViewMode("list");
    setActiveTab("Cách xử lý");
    const next = new URLSearchParams(searchParams);
    next.set("group", group);
    setSearchParams(next);
    setTimeout(() => setIsAnimating(false), 220);
  };

  const handleOpenError = (errorId) => {
    setSelectedErrorId(errorId);
    setViewMode("detail");
    setActiveTab("Cách xử lý");
  };

  const cardClass =
    "rounded-[20px] border border-[#8db0ee] bg-white/88 p-4 shadow-[0_10px_30px_rgba(34,73,137,0.08)] backdrop-blur-sm transition-all duration-300";

  return (
    <div className="min-h-screen text-slate-800">
      <div className="w-full px-3 py-3 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <main className="rounded-[22px] border border-[#7ba2e6]/80 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef5ff] p-3 shadow-[0_18px_40px_rgba(35,72,138,0.10)] sm:rounded-[28px] sm:p-4 lg:p-5">
          <section className="grid gap-3 lg:grid-cols-[196px_196px_1fr]">
            <select
              value={selectedGroup}
              onChange={(e) => changeGroup(e.target.value)}
              className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
            >
              {topTabs.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDevice?.name || ""}
              onChange={(e) => {
                const nextDevice = filteredDevices.find(
                  (item) => item.name === e.target.value,
                );
                if (nextDevice) {
                  setSelectedDeviceId(nextDevice.id);
                  setViewMode("list");
                }
              }}
              className="h-11 rounded-[12px] border border-[#8db0ee] bg-white px-3 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
            >
              {filteredDevices.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4f72ad]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhanh thiết bị / lỗi"
                className="h-11 w-full rounded-[12px] border border-[#8db0ee] bg-white px-3 pr-11 text-[15px] text-[#244a8a] shadow-sm outline-none transition focus:border-[#4f80de] focus:ring-4 focus:ring-[#4f80de]/10"
              />
            </div>
          </section>

          <section className="mt-4 border-b border-[#a7c0ef] pb-3">
            <div className="flex flex-wrap gap-2">
              {topTabs.map((tab) => {
                const active = selectedGroup === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => changeGroup(tab.value)}
                    className={`group relative overflow-hidden rounded-[12px] border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                      active
                        ? "border-[#4f80de] bg-gradient-to-r from-[#eaf2ff] to-white text-[#1d478d] shadow-[0_8px_20px_rgba(54,102,190,0.16)]"
                        : "border-[#9bb8ee] bg-white/80 text-[#5572a8] hover:-translate-y-0.5 hover:border-[#6f99e6] hover:bg-[#f7faff] hover:text-[#244a8a]"
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {active ? (
                      <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#4f80de] to-[#7babff]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className={`mt-4 transition-all duration-300 ${
              isAnimating
                ? "translate-y-1 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            {viewMode === "list" ? (
              <div className="space-y-4">
                <div
                  className={`rounded-[22px] border border-[#8db0ee] bg-gradient-to-br ${accentMap[selectedGroup]} p-4 shadow-[0_14px_34px_rgba(34,73,137,0.10)]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f69d9] to-[#5f93f0] text-white shadow-md">
                        <Sparkles size={17} />
                      </div>
                      <div>
                        <h1 className="text-[22px] font-bold text-[#183f82] sm:text-[26px]">
                          Danh sách lỗi {selectedGroup.toLowerCase()}
                        </h1>
                        <p className="mt-1 text-sm text-[#4f72ad] sm:text-base">
                          {selectedDevice?.brand || "Thiết bị"} •{" "}
                          {selectedDevice?.name || "Chưa chọn thiết bị"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenAddModal(true)}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-[#4f80de] bg-white px-4 py-2.5 text-sm font-semibold text-[#1d478d] shadow-[0_8px_18px_rgba(54,102,190,0.12)] transition hover:-translate-y-0.5 hover:bg-[#f7fbff]"
                    >
                      <Plus size={16} />
                      Thêm lỗi
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className={cardClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                        Các lỗi thường gặp
                      </h2>
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2d5ab2]">
                        {selectedDevice?.errors?.length || 0} lỗi
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedDevice?.errors?.map((error, index) => (
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
                              {error.causes?.[0]}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-[10px] border border-[#8db0ee] bg-[#f4f8ff] px-3 py-2 text-sm font-semibold text-[#2d5ab2] transition group-hover:bg-[#ebf2ff]">
                            Xem chi tiết
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="mb-3 text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                      Gợi ý nội dung khi thêm lỗi
                    </h2>
                    <div className="space-y-3 text-[#4c6898]">
                      {[
                        "Tên lỗi / hiện tượng",
                        "Nguyên nhân 1, nguyên nhân 2",
                        "Cách xử lý từng bước",
                        "Các ghi chú kiểm tra hiện trường",
                        "Tài liệu PDF / SOP liên quan",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-[12px] bg-white/82 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)]"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`rounded-[22px] border border-[#8db0ee] bg-gradient-to-br ${accentMap[selectedGroup]} p-4 shadow-[0_14px_34px_rgba(34,73,137,0.10)]`}
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
                          className="mb-2 text-sm font-semibold text-[#4f72ad] transition hover:text-[#1d478d]"
                        >
                          ← Quay lại danh sách lỗi
                        </button>
                        <h1 className="text-[22px] font-bold text-[#183f82] sm:text-[26px]">
                          Sự cố: {selectedError?.title}
                        </h1>
                        <p className="mt-1 text-sm text-[#4f72ad] sm:text-base">
                          {selectedDevice?.brand || "Thiết bị"} •{" "}
                          {selectedDevice?.name || "Chưa chọn thiết bị"}
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
                          key={line}
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
                      {(selectedError?.right || []).map((line) => (
                        <div
                          key={line}
                          className="rounded-[12px] bg-white/80 px-3 py-3 shadow-[0_4px_12px_rgba(34,73,137,0.05)] transition hover:bg-white"
                        >
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className={cardClass}>
                    <h2 className="mb-3 text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                      Nguyên nhân thường gặp
                    </h2>
                    <div className="space-y-3">
                      {(selectedError?.causes || []).map((cause) => (
                        <label
                          key={cause}
                          className="flex items-start gap-3 rounded-[12px] bg-white/82 px-3 py-3 text-[#4c6898] shadow-[0_4px_12px_rgba(34,73,137,0.05)] transition hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[#4f80de]"
                          />
                          <span>{cause}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h2 className="mb-3 text-[19px] font-bold text-[#183f82] sm:text-[22px]">
                      Tham khảo thêm tài liệu
                    </h2>
                    <div className="space-y-3">
                      {(selectedError?.docs || []).map((doc) => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => navigate("/QA")}
                          className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#8db0ee] bg-white/88 px-3 py-3 text-left text-[#4c6898] shadow-[0_6px_18px_rgba(34,73,137,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6e98e7] hover:bg-white hover:shadow-[0_12px_24px_rgba(34,73,137,0.12)]"
                        >
                          <span className="min-w-0 flex-1">{doc}</span>
                          <span className="shrink-0 rounded-[10px] border border-[#7ca1e8] bg-[#f5f9ff] px-2 py-1 text-xs font-bold text-[#2d5ab2]">
                            PDF
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/QA")}
                  className="text-left text-[18px] font-medium text-[#295292] transition hover:text-[#1d478d] hover:underline"
                >
                  ! Tham khảo thêm tri thức liên.
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {openAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[24px] border border-[#9bb8ee] bg-white p-5 shadow-[0_24px_60px_rgba(20,40,90,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d8fc2]">
                  Thư viện kỹ thuật
                </div>
                <h3 className="mt-1 text-[22px] font-bold text-[#183f82]">
                  Thêm lỗi mới cho {selectedGroup}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-[12px] border border-[#9bb8ee] px-3 py-2 text-sm font-semibold text-[#244a8a] hover:bg-[#f6f9ff]"
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Tên lỗi"
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
                label="Tài liệu 1"
                value={newError.doc1}
                onChange={(value) =>
                  setNewError((prev) => ({ ...prev, doc1: value }))
                }
              />
              <div className="sm:col-span-2">
                <Input
                  label="Tài liệu 2"
                  value={newError.doc2}
                  onChange={(value) =>
                    setNewError((prev) => ({ ...prev, doc2: value }))
                  }
                />
              </div>
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
                onClick={() => setOpenAddModal(false)}
                className="rounded-[12px] bg-gradient-to-r from-[#2f69d9] to-[#5f93f0] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(47,105,217,0.25)]"
              >
                Lưu lỗi
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
