import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const defaultDevices = [
  {
    id: "1",
    group: "Van giảm áp",
    brand: "Bernad",
    name: "Bermad 720",
    description:
      "Van giảm áp điều khiển thủy lực dùng để ổn định áp lực đầu ra.",
    normalErrors: 2,
    advancedErrors: 1,
    sections: {
      introduction:
        "Bermad 720 là dòng van giảm áp phổ biến trong mạng lưới cấp nước.",
      usage: "Dùng để duy trì áp lực đầu ra ở mức cài đặt.",
      installation:
        "Lắp đúng chiều dòng chảy, kiểm tra rò rỉ tại các vị trí kết nối.",
      commonErrors:
        "Áp đầu ra không ổn định, kẹt màng van, rò nước tại buồng điều khiển.",
      advanced: "Kiểm tra pilot, lọc pilot, đường impulse, độ kín của màng.",
      process:
        "Cô lập tuyến, xả áp, tháo pilot, vệ sinh màng, kiểm tra thân van.",
      media: "Ảnh hiện trường, video vệ sinh pilot, video cân chỉnh áp.",
    },
  },
  {
    id: "2",
    group: "Logger",
    brand: "HWM",
    name: "HWM Permalog+",
    description:
      "Thiết bị logger thu thập dữ liệu áp lực và lưu lượng hiện trường.",
    normalErrors: 2,
    advancedErrors: 1,
    sections: {
      introduction:
        "Logger dùng để theo dõi dữ liệu hiện trường và phát hiện bất thường.",
      usage: "Ghi dữ liệu áp lực/lưu lượng và hỗ trợ phân tích rò rỉ.",
      installation: "Gắn chắc thiết bị, xác nhận pin, đồng bộ thời gian.",
      commonErrors: "Mất kết nối, pin yếu, không đồng bộ dữ liệu.",
      advanced: "Kiểm tra firmware, sóng truyền, mapping kênh đo.",
      process: "Kiểm tra nguồn, cấu hình lại thiết bị và đồng bộ với hệ thống.",
      media: "Ảnh cấu hình logger, video kiểm tra đồng bộ dữ liệu.",
    },
  },
  {
    id: "3",
    group: "Khác",
    brand: "Generic",
    name: "Van xả khí",
    description: "Thiết bị phụ trợ dùng trong vận hành mạng lưới.",
    normalErrors: 1,
    advancedErrors: 1,
    sections: {
      introduction: "Van xả khí hỗ trợ loại bỏ khí tồn đọng trong ống.",
      usage: "Dùng tại các vị trí cao điểm trên tuyến ống.",
      installation: "Bố trí đúng vị trí, đảm bảo kín khít và dễ bảo trì.",
      commonErrors: "Rò rỉ, kẹt cơ cấu, xả khí kém.",
      advanced: "Kiểm tra phao, buồng khí và lỗ thoát.",
      process: "Cô lập, tháo kiểm tra, vệ sinh và lắp lại.",
      media: "Hình ảnh kết cấu và quy trình kiểm tra.",
    },
  },
];

const tabs = ["Cách xử lý", "Nguyên nhân", "Tài liệu"];

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Cách xử lý");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const groupFromUrl = searchParams.get("group") || "";
  const keywordFromUrl = searchParams.get("q") || "";

  useEffect(() => {
    const saved = localStorage.getItem("pwc_library_devices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDevices(
          Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultDevices,
        );
      } catch {
        setDevices(defaultDevices);
      }
    } else {
      localStorage.setItem(
        "pwc_library_devices",
        JSON.stringify(defaultDevices),
      );
      setDevices(defaultDevices);
    }
  }, []);

  useEffect(() => {
    if (keywordFromUrl) setSearch(keywordFromUrl);
  }, [keywordFromUrl]);

  const groups = useMemo(() => {
    const unique = [
      ...new Set(devices.map((item) => item.group).filter(Boolean)),
    ];
    return unique;
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        keyword === "" ||
        item.name.toLowerCase().includes(keyword) ||
        item.group.toLowerCase().includes(keyword) ||
        item.brand.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.sections?.commonErrors?.toLowerCase().includes(keyword);

      const matchGroup = groupFromUrl ? item.group === groupFromUrl : true;
      return matchSearch && matchGroup;
    });
  }, [devices, search, groupFromUrl]);

  useEffect(() => {
    if (!filteredDevices.length) {
      setSelectedDeviceId("");
      return;
    }

    const stillExists = filteredDevices.some(
      (item) => item.id === selectedDeviceId,
    );
    if (!stillExists) setSelectedDeviceId(filteredDevices[0].id);
  }, [filteredDevices, selectedDeviceId]);

  const selectedDevice =
    filteredDevices.find((item) => item.id === selectedDeviceId) ||
    filteredDevices[0] ||
    null;

  const relatedDocs = useMemo(() => {
    if (!selectedDevice) return [];

    if (selectedDevice.group === "Van giảm áp") {
      return [
        { title: "TL hướng dẫn bảo trì van giảm áp", tag: "PDF" },
        { title: "Tra cứu dữ liệu logger", tag: "PDF" },
        { title: "Cách kiểm tra màng van", tag: "PDF" },
      ];
    }

    if (selectedDevice.group === "Logger") {
      return [
        { title: "TL hướng dẫn bảo trì logger", tag: "PDF" },
        { title: "Cấu hình logger", tag: "PDF" },
        { title: "Đọc dữ liệu logger", tag: "PDF" },
      ];
    }

    return [
      { title: "Tài liệu kỹ thuật hiện trường", tag: "PDF" },
      { title: "Checklist kiểm tra thiết bị", tag: "PDF" },
    ];
  }, [selectedDevice]);

  const handleChangeGroup = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("group", value);
    else next.delete("group");
    setSearchParams(next);
  };

  const handleChangeKeyword = (value) => {
    setSearch(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    setSearchParams(next);
  };

  const issueTitle =
    selectedDevice?.group === "Van giảm áp"
      ? "Sự cố: Áp đầu ra cao"
      : selectedDevice?.group === "Logger"
        ? "Sự cố: Mất tín hiệu logger"
        : "Sự cố: Thiết bị bất thường";

  const steps =
    selectedDevice?.group === "Van giảm áp"
      ? [
          "Đóng van đầu vào, tạm ngắt nước qua van giảm áp.",
          "Kiểm tra màng van, vệ sinh hoặc thay thế nếu hư.",
        ]
      : selectedDevice?.group === "Logger"
        ? [
            "Kiểm tra nguồn cấp và trạng thái pin logger.",
            "Đồng bộ lại thiết bị và xác nhận tín hiệu truyền dữ liệu.",
          ]
        : [
            "Cô lập thiết bị để kiểm tra an toàn.",
            "Đối chiếu tình trạng thực tế với tài liệu kỹ thuật.",
          ];

  const causes =
    selectedDevice?.group === "Van giảm áp"
      ? [
          "Mở van bi hư hoặc hạt đo cảm biến bám lâu ngày.",
          "Thông pilot không điều khiển được van.",
        ]
      : selectedDevice?.group === "Logger"
        ? [
            "Pin yếu hoặc hết pin.",
            "Mất sóng, lỗi đồng bộ hoặc lỗi cấu hình logger.",
          ]
        : ["Thiết bị lắp sai vị trí hoặc bám cặn.", "Thiếu bảo trì định kỳ."];

  const reenact =
    selectedDevice?.group === "Van giảm áp"
      ? [
          "Đóng van hạ lưu để đo cảm biến lỗi ngay.",
          "Thử lại pilot để xác định điểm nghẽn dòng.",
        ]
      : selectedDevice?.group === "Logger"
        ? [
            "Reset logger và đọc lại chu kỳ ghi dữ liệu.",
            "So sánh dữ liệu hiện trường với dữ liệu gửi về hệ thống.",
          ]
        : [
            "Quan sát tình trạng thiết bị dưới tải thực tế.",
            "Đối chiếu với mẫu lỗi gần nhất.",
          ];

  const detailLines =
    activeTab === "Cách xử lý"
      ? steps
      : activeTab === "Nguyên nhân"
        ? causes
        : reenact;

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-slate-800">
      <div className="mx-auto max-w-[1280px] px-4 py-5 lg:px-6">
        <div className="space-y-4 rounded-[26px] border-2 border-[#214e95] bg-[#fbf8ef] p-4 shadow-sm">
          <section className="grid gap-3 lg:grid-cols-[220px_220px_1fr]">
            <select
              value={groupFromUrl}
              onChange={(e) => handleChangeGroup(e.target.value)}
              className="h-11 rounded-[8px] border-2 border-[#214e95] bg-white px-3 text-[15px] text-[#17396b] outline-none"
            >
              <option value="">Chọn nhóm TB</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={selectedDevice?.name || ""}
              onChange={(e) => {
                const nextDevice = filteredDevices.find(
                  (item) => item.name === e.target.value,
                );
                if (nextDevice) setSelectedDeviceId(nextDevice.id);
              }}
              className="h-11 rounded-[8px] border-2 border-[#214e95] bg-white px-3 text-[15px] text-[#17396b] outline-none"
            >
              <option value="">Chọn lưu lượng</option>
              {filteredDevices.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#214e95]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleChangeKeyword(e.target.value)}
                placeholder=""
                className="h-11 w-full rounded-[8px] border-2 border-[#214e95] bg-white px-3 pr-10 text-[15px] text-[#17396b] outline-none"
              />
            </div>
          </section>

          <section className="flex flex-wrap gap-2 border-b-2 border-[#214e95] pb-3">
            {[
              { label: "Van giảm áp", value: "Van giảm áp" },
              { label: "Logger", value: "Logger" },
              { label: "ĐH cỡ lớn", value: "Khác" },
            ].map((tab) => {
              const active = (groupFromUrl || "") === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => handleChangeGroup(tab.value)}
                  className={`rounded-t-[12px] border-2 border-[#214e95] px-4 py-2 text-[15px] font-semibold ${
                    active
                      ? "bg-[#eaf1ff] text-[#143765]"
                      : "bg-white text-[#355588]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </section>

          <section className="space-y-4">
            <div className="flex items-start gap-3 text-[#17396b]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#214e95] bg-white font-bold">
                !
              </div>
              <div>
                <h1 className="text-[24px] font-bold">{issueTitle}</h1>
                <p className="mt-1 text-[15px] text-[#355588]">
                  {selectedDevice?.brand || "Thiết bị"} •{" "}
                  {selectedDevice?.name || "Chưa chọn thiết bị"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-[12px] border-2 border-[#214e95] px-4 py-2 text-sm font-semibold ${
                    activeTab === tab
                      ? "bg-[#eaf1ff] text-[#143765]"
                      : "bg-white text-[#355588]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr]">
              <div className="rounded-[18px] border-2 border-[#214e95] bg-white p-4">
                <div className="space-y-3 text-[16px] leading-7 text-[#27416f]">
                  {detailLines.map((line, index) => (
                    <div key={line} className="flex gap-3">
                      <span className="font-bold text-[#17396b]">
                        {index + 1}.
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border-2 border-[#214e95] bg-white p-4 text-[16px] leading-7 text-[#27416f]">
                <ul className="list-disc space-y-2 pl-5">
                  {selectedDevice?.group === "Van giảm áp" ? (
                    <>
                      <li>Đóng van hạ lưu hết do cảm biến lỗi ngay.</li>
                      <li>Thử lên pilot để đo lưu lượng đột ngột qua van.</li>
                    </>
                  ) : selectedDevice?.group === "Logger" ? (
                    <>
                      <li>Đồng bộ lại hệ đo cảm biến lỗi ngay.</li>
                      <li>Thử lại kênh truyền để loại trừ lỗi mạng.</li>
                    </>
                  ) : (
                    <>
                      <li>
                        Đối chiếu thiết bị với tình trạng vận hành hiện tại.
                      </li>
                      <li>Ghi nhận hiện tượng để bổ sung tri thức nội bộ.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="rounded-[10px] border-2 border-[#214e95] bg-white px-4 py-2 text-sm font-semibold text-[#17396b]"
              >
                Đã xử lý sự cố ☑
              </button>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr]">
            <div className="rounded-[18px] border-2 border-[#214e95] bg-white p-4">
              <h2 className="mb-3 text-[20px] font-bold text-[#17396b]">
                Nguyên nhân thường gặp
              </h2>
              <div className="space-y-3 text-[16px] text-[#27416f]">
                {causes.map((cause) => (
                  <label key={cause} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[#214e95]"
                    />
                    <span>{cause}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border-2 border-[#214e95] bg-white p-4">
              <h2 className="mb-3 text-[20px] font-bold text-[#17396b]">
                Tham khảo thêm tài liệu
              </h2>
              <div className="space-y-3">
                {relatedDocs.map((doc) => (
                  <button
                    key={doc.title}
                    type="button"
                    onClick={() => navigate("/QA")}
                    className="flex w-full items-center justify-between rounded-[10px] border-2 border-[#214e95] bg-[#fbf8ef] px-3 py-3 text-left text-[#27416f] hover:bg-[#f4f8ff]"
                  >
                    <span>{doc.title}</span>
                    <span className="rounded-[6px] border-2 border-[#214e95] px-2 py-1 text-xs font-bold text-[#214e95]">
                      {doc.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="pt-1 text-[#27416f]">
            <button
              type="button"
              onClick={() => navigate("/QA")}
              className="text-[18px] font-medium hover:text-[#214e95]"
            >
              ! Tham khảo thêm tri thức liên.
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
