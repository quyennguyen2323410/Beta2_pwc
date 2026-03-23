import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

const defaultDevices = [
  {
    id: "1",
    group: "Van giảm áp",
    brand: "Bernad",
    name: "Bermad 720",
    description:
      "Van giảm áp điều khiển thủy lực dùng để ổn định áp lực đầu ra trong mạng lưới DMA, phù hợp cho khu vực có biến động tải lớn.",
    normalErrors: 2,
    advancedErrors: 1,
    sections: {
      introduction:
        "Bermad 720 là dòng van giảm áp được sử dụng phổ biến trong mạng lưới cấp nước để kiểm soát áp lực đầu ra ổn định.",
      usage:
        "Thiết bị dùng để duy trì áp lực đầu ra ở mức cài đặt, bảo vệ mạng lưới khỏi dao động áp suất lớn.",
      installation:
        "Lắp đúng chiều dòng chảy, kiểm tra áp suất đầu vào, đầu ra và đảm bảo không rò rỉ tại các vị trí kết nối.",
      commonErrors:
        "Áp đầu ra không ổn định, kẹt màng van, rò nước tại buồng điều khiển.",
      advanced:
        "Kiểm tra pilot, lọc pilot, đường impulse, độ kín của màng và độ nhạy của cơ cấu phản hồi áp.",
      process:
        "Cô lập tuyến, xả áp, tháo pilot, vệ sinh màng, kiểm tra thân van, lắp lại và hiệu chỉnh áp đầu ra.",
      media:
        "Hình ảnh hiện trường, video vệ sinh pilot, video cân chỉnh áp sau sửa chữa.",
    },
  },
  {
    id: "2",
    group: "Đồng hồ đo nước",
    brand: "Sensus",
    name: "Sensus iPERL",
    description:
      "Đồng hồ đo nước điện tử có khả năng ghi nhận lưu lượng ổn định, hỗ trợ đọc số chính xác và phù hợp cho tích hợp số hóa.",
    normalErrors: 2,
    advancedErrors: 1,
    sections: {
      introduction:
        "Sensus iPERL là đồng hồ điện tử chuyên dùng cho đo đếm chính xác và tích hợp hệ thống đọc số từ xa.",
      usage:
        "Dùng để đo lưu lượng nước tiêu thụ và tích hợp với hệ thống thu thập dữ liệu.",
      installation:
        "Lắp đúng hướng mũi tên, tránh rung, đảm bảo đủ chiều dài ống và không có cặn bẩn lớn.",
      commonErrors:
        "Mất tín hiệu đọc, sai lệch chỉ số, pin cảnh báo, lỗi truyền dữ liệu.",
      advanced:
        "Kiểm tra module truyền thông, nguồn, nhiễu đường truyền, cấu hình logger và mapping dữ liệu.",
      process:
        "Kiểm tra ngoại quan, xác nhận chỉ số, test tín hiệu, thay module hoặc hiệu chuẩn lại nếu cần.",
      media: "Hình ảnh kết nối thực tế, video kiểm tra tín hiệu đọc số từ xa.",
    },
  },
  {
    id: "3",
    group: "Data logger",
    brand: "HWM",
    name: "HWM Permalog+",
    description:
      "Thiết bị data logger thu thập áp lực và lưu lượng phục vụ theo dõi thất thoát, dao động áp và hành vi mạng lưới theo thời gian.",
    normalErrors: 2,
    advancedErrors: 1,
    sections: {
      introduction:
        "HWM Permalog+ là data logger phục vụ thu thập dữ liệu áp lực/lưu lượng và hỗ trợ phát hiện bất thường.",
      usage:
        "Dùng để ghi dữ liệu hiện trường, phát hiện biến động áp lực và hỗ trợ phân tích rò rỉ.",
      installation:
        "Gắn chắc thiết bị, xác nhận pin, đồng bộ thời gian, cấu hình chu kỳ ghi nhận.",
      commonErrors:
        "Mất kết nối, không đồng bộ dữ liệu, pin yếu, dữ liệu thu thiếu.",
      advanced:
        "Kiểm tra firmware, cấu hình truyền dữ liệu, vùng phủ sóng và mapping kênh đo.",
      process:
        "Kiểm tra nguồn, kiểm tra cổng kết nối, cấu hình lại thiết bị và đồng bộ với hệ thống.",
      media: "Ảnh cấu hình logger, video kiểm tra đồng bộ dữ liệu thực tế.",
    },
  },
];

export default function Library() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  // const [groupFilter, setGroupFilter] = useState("Tất cả");
  const [searchParams] = useSearchParams();
  const groupFromUrl = searchParams.get("group");

  const [groupFilter, setGroupFilter] = useState(groupFromUrl || "Tất cả");
  useEffect(() => {
    if (groupFromUrl) {
      setGroupFilter(groupFromUrl);
    } else {
      setGroupFilter("Tất cả");
    }
  }, [groupFromUrl]);

  const [brandFilter, setBrandFilter] = useState("Tất cả");
  const [openAddModal, setOpenAddModal] = useState(false);

  const [newDevice, setNewDevice] = useState({
    group: "",
    brand: "",
    name: "",
    description: "",
    normalErrors: "",
    advancedErrors: "",
    introduction: "",
    usage: "",
    installation: "",
    commonErrors: "",
    advanced: "",
    process: "",
    media: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("pwc_library_devices");
    if (saved) {
      setDevices(JSON.parse(saved));
    } else {
      localStorage.setItem(
        "pwc_library_devices",
        JSON.stringify(defaultDevices),
      );
      setDevices(defaultDevices);
    }
  }, []);

  const saveDevices = (updated) => {
    setDevices(updated);
    localStorage.setItem("pwc_library_devices", JSON.stringify(updated));
  };

  const groups = useMemo(() => {
    const unique = [...new Set(devices.map((item) => item.group))];
    return ["Tất cả", ...unique];
  }, [devices]);

  const brands = useMemo(() => {
    const unique = [...new Set(devices.map((item) => item.brand))];
    return ["Tất cả", ...unique];
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
      const matchGroup =
        groupFilter === "Tất cả" ? true : item.group === groupFilter;

      const matchBrand =
        brandFilter === "Tất cả" ? true : item.brand === brandFilter;

      return matchSearch && matchGroup && matchBrand;
    });
  }, [devices, search, groupFilter, brandFilter]);

  const handleNewDeviceChange = (e) => {
    const { name, value } = e.target;
    setNewDevice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDevice = (e) => {
    e.preventDefault();

    if (!newDevice.group || !newDevice.brand || !newDevice.name) {
      alert("Vui lòng nhập tối thiểu: nhóm thiết bị, hãng và tên thiết bị.");
      return;
    }

    const createdDevice = {
      id: String(Date.now()),
      group: newDevice.group,
      brand: newDevice.brand,
      name: newDevice.name,
      description: newDevice.description || "Chưa có mô tả.",
      normalErrors: Number(newDevice.normalErrors || 0),
      advancedErrors: Number(newDevice.advancedErrors || 0),
      sections: {
        introduction: newDevice.introduction || "Chưa có nội dung giới thiệu.",
        usage: newDevice.usage || "Chưa có hướng dẫn sử dụng.",
        installation: newDevice.installation || "Chưa có nội dung cài đặt.",
        commonErrors: newDevice.commonErrors || "Chưa có lỗi thường gặp.",
        advanced: newDevice.advanced || "Chưa có nội dung nâng cao.",
        process: newDevice.process || "Chưa có quy trình sửa chữa.",
        media: newDevice.media || "Chưa có media.",
      },
    };

    const updated = [createdDevice, ...devices];
    saveDevices(updated);
    setOpenAddModal(false);

    setNewDevice({
      group: "",
      brand: "",
      name: "",
      description: "",
      normalErrors: "",
      advancedErrors: "",
      introduction: "",
      usage: "",
      installation: "",
      commonErrors: "",
      advanced: "",
      process: "",
      media: "",
    });
  };

  const handleDeleteDevice = (deviceId, deviceName) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa mục "${deviceName}" không?`,
    );
    if (!confirmed) return;

    const updated = devices.filter((item) => item.id !== deviceId);
    saveDevices(updated);
    window.dispatchEvent(new Event("pwc-library-updated"));
  };

  const handleViewDetail = (deviceId) => {
    navigate(`/Library/${deviceId}`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="mt-2 text-2xl font-bold text-slate-800 xl:text-[34px]">
            Thư viện kỹ thuật theo phân loại thiết bị
          </h1>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm xl:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập thiết bị, hãng, lỗi hoặc quy trình..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nhóm thiết bị
            </label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
            >
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Hãng
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
            >
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {/* Add card đưa lên đầu */}
          <button
            type="button"
            onClick={() => setOpenAddModal(true)}
            className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#0b8ea0]/40 bg-[#f7fcfd] p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b8ea0]/10 text-[#0b8ea0]">
              <Plus size={28} />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-800">
              Thêm thiết bị mới
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
              Thêm nhóm thiết bị, hãng, tên thiết bị và các mục nội dung kỹ
              thuật để mở rộng thư viện nội bộ.
            </p>
          </button>

          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-[#134e8c]">
                    {device.group}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                    {device.brand}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDevice(device.id, device.name)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                  title="Xóa mục"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-slate-900">
                {device.name}
              </h3>

              <div className="mt-4 flex-1">
                <p className="mt-4 text-base leading-8 text-slate-600">
                  {device.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    {device.normalErrors} lỗi thường gặp
                  </span>
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                    {device.advancedErrors} lỗi nâng cao
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewDetail(device.id)}
                className="mt-6 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-semibold text-[#134e8c] transition hover:bg-slate-100"
              >
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>
      </section>

      {openAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
                  Thêm thiết bị mới
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Mở rộng thư viện kỹ thuật
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InputField
                  label="Nhóm thiết bị"
                  name="group"
                  value={newDevice.group}
                  onChange={handleNewDeviceChange}
                  placeholder="Ví dụ: Van giảm áp"
                />
                <InputField
                  label="Hãng"
                  name="brand"
                  value={newDevice.brand}
                  onChange={handleNewDeviceChange}
                  placeholder="Ví dụ: Bermad"
                />
                <InputField
                  label="Tên thiết bị"
                  name="name"
                  value={newDevice.name}
                  onChange={handleNewDeviceChange}
                  placeholder="Ví dụ: Bermad 720"
                />
              </div>

              <TextareaField
                label="Mô tả ngắn"
                name="description"
                value={newDevice.description}
                onChange={handleNewDeviceChange}
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Số lỗi thường gặp"
                  name="normalErrors"
                  value={newDevice.normalErrors}
                  onChange={handleNewDeviceChange}
                  type="number"
                />
                <InputField
                  label="Số lỗi nâng cao"
                  name="advancedErrors"
                  value={newDevice.advancedErrors}
                  onChange={handleNewDeviceChange}
                  type="number"
                />
              </div>

              <TextareaField
                label="Giới thiệu"
                name="introduction"
                value={newDevice.introduction}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Hướng dẫn sử dụng"
                name="usage"
                value={newDevice.usage}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Cài đặt"
                name="installation"
                value={newDevice.installation}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Lỗi thường gặp"
                name="commonErrors"
                value={newDevice.commonErrors}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Advanced"
                name="advanced"
                value={newDevice.advanced}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Quy trình sửa chữa"
                name="process"
                value={newDevice.process}
                onChange={handleNewDeviceChange}
              />
              <TextareaField
                label="Media"
                name="media"
                value={newDevice.media}
                onChange={handleNewDeviceChange}
              />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#0f8fad] px-5 py-3 font-semibold text-white shadow-md transition hover:bg-[#0d7d97]"
                >
                  Lưu thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
      />
    </div>
  );
}

function TextareaField({ label, name, value, onChange, rows = 4 }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={`Nhập nội dung cho mục ${label}...`}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
      />
    </div>
  );
}
