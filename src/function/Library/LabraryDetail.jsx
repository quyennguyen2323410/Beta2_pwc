import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PencilLine } from "lucide-react";

const sectionTabs = [
  { key: "introduction", label: "Giới thiệu" },
  { key: "usage", label: "Hướng dẫn sử dụng" },
  { key: "installation", label: "Cài đặt" },
  { key: "commonErrors", label: "Lỗi thường gặp" },
  { key: "advanced", label: "Video hướng dẫn" },
  { key: "process", label: "Quy trình sửa chữa" },
  { key: "media", label: "Media" },
];

export default function LibraryDetail() {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("commonErrors");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("pwc_library_devices");
    if (saved) {
      setDevices(JSON.parse(saved));
    }
  }, []);

  const selectedDevice = useMemo(() => {
    return devices.find((item) => String(item.id) === String(deviceId));
  }, [devices, deviceId]);

  useEffect(() => {
    if (selectedDevice) {
      setEditData({
        group: selectedDevice.group || "",
        brand: selectedDevice.brand || "",
        name: selectedDevice.name || "",
        description: selectedDevice.description || "",
        normalErrors: selectedDevice.normalErrors ?? 0,
        advancedErrors: selectedDevice.advancedErrors ?? 0,
        introduction: selectedDevice.sections?.introduction || "",
        usage: selectedDevice.sections?.usage || "",
        installation: selectedDevice.sections?.installation || "",
        commonErrors: selectedDevice.sections?.commonErrors || "",
        advanced: selectedDevice.sections?.advanced || "",
        process: selectedDevice.sections?.process || "",
        media: selectedDevice.sections?.media || "",
      });
    }
  }, [selectedDevice]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = () => {
    const updatedDevices = devices.map((item) => {
      if (String(item.id) !== String(deviceId)) return item;

      return {
        ...item,
        group: editData.group,
        brand: editData.brand,
        name: editData.name,
        description: editData.description,
        normalErrors: Number(editData.normalErrors || 0),
        advancedErrors: Number(editData.advancedErrors || 0),
        sections: {
          introduction: editData.introduction,
          usage: editData.usage,
          installation: editData.installation,
          commonErrors: editData.commonErrors,
          advanced: editData.advanced,
          process: editData.process,
          media: editData.media,
        },
      };
    });

    localStorage.setItem("pwc_library_devices", JSON.stringify(updatedDevices));
    setDevices(updatedDevices);
    setIsEditing(false);
  };

  if (!selectedDevice || !editData) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          Không tìm thấy thiết bị
        </h2>
        <p className="mt-3 text-slate-600">
          Thiết bị có thể đã bị xóa hoặc chưa tồn tại.
        </p>
        <button
          type="button"
          onClick={() => navigate("/Library")}
          className="mt-5 rounded-2xl bg-[#0f8fad] px-5 py-3 font-semibold text-white"
        >
          Quay lại thư viện
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
              Chi tiết thiết bị
            </p>

            {isEditing ? (
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <input
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  placeholder="Tên thiết bị"
                />
                <input
                  name="brand"
                  value={editData.brand}
                  onChange={handleEditChange}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  placeholder="Hãng"
                />
                <input
                  name="group"
                  value={editData.group}
                  onChange={handleEditChange}
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  placeholder="Nhóm thiết bị"
                />
                <input
                  name="normalErrors"
                  value={editData.normalErrors}
                  onChange={handleEditChange}
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  placeholder="Số lỗi thường gặp"
                />
                <input
                  name="advancedErrors"
                  value={editData.advancedErrors}
                  onChange={handleEditChange}
                  type="number"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  placeholder="Số lỗi nâng cao"
                />
              </div>
            ) : (
              <>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                  {selectedDevice.name}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedDevice.group} • {selectedDevice.brand}
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-2xl bg-[#0f8fad] px-5 py-3 font-semibold text-white shadow-md transition hover:bg-[#0d7d97]"
                >
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-[#184f8c] shadow-sm transition hover:bg-slate-50"
              >
                <PencilLine size={18} />
                Sửa nội dung
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {sectionTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border border-[#7dd7da] bg-[#d9f5f3] text-[#0d7478]"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-bold text-slate-800">
            {sectionTabs.find((item) => item.key === activeTab)?.label}
          </h3>

          {isEditing ? (
            <textarea
              name={activeTab}
              value={editData[activeTab] || ""}
              onChange={handleEditChange}
              rows={8}
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
              placeholder="Nhập nội dung..."
            />
          ) : (
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
              {selectedDevice.sections?.[activeTab] || "Chưa có nội dung."}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Mô tả ngắn hiển thị ngoài card
            </label>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
              placeholder="Mô tả ngắn..."
            />
          </div>
        )}
      </section>
    </div>
  );
}
