import React from "react";
import { ArrowLeft, Database, MapPin, PencilLine, Save, X } from "lucide-react";

export default function DeviceHeader({
  selectedDevice,
  isEditing,
  editData,
  handleEditChange,
  handleSaveEdit,
  setIsEditing,
  navigate,
}) {
  const lat = selectedDevice?.lat || 10.772109;
  const lng = selectedDevice?.lng || 106.652887;

  const handleOpenGoogleMaps = () => {
    if (!lat || !lng) return;
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/75 bg-white/72 p-5 shadow-[0_24px_70px_rgba(30,64,175,0.13)] backdrop-blur-2xl sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          {/* Nút quay lại danh mục chung */}
          <button
            type="button"
            onClick={() => navigate("/Library")}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3.5 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            <ArrowLeft size={16} />
            Quay lại thư viện kỹ thuật
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              <Database size={15} />
              Datasheet thiết bị / Kho tri thức
            </div>

            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <MapPin size={14} className="text-blue-600" />
              Tọa độ: {lng}, {lat}
            </button>
          </div>

          {/* LUỒNG 2: CHẾ ĐỘ CHỈNH SỬA (EDIT FLOW) */}
          {isEditing ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FieldItem
                label="Tên thiết bị"
                name="name"
                value={editData?.name || ""}
                onChange={handleEditChange}
              />
              <FieldItem
                label="Hãng / thương hiệu"
                name="brand"
                value={editData?.brand || ""}
                onChange={handleEditChange}
              />
              <FieldItem
                label="Nhóm thiết bị"
                name="group"
                value={editData?.group || ""}
                onChange={handleEditChange}
              />
              <FieldItem
                label="Số lỗi thường gặp"
                name="normalErrors"
                type="number"
                value={editData?.normalErrors || 0}
                onChange={handleEditChange}
              />
              <FieldItem
                label="Số lỗi nâng cao"
                name="advancedErrors"
                type="number"
                value={editData?.advancedErrors || 0}
                onChange={handleEditChange}
              />
            </div>
          ) : (
            /* LUỒNG 1: CHẾ ĐỘ XEM CHI TIẾT (VIEW FLOW) */
            <>
              <h1 className="mt-4 text-[28px] font-black leading-tight tracking-tight text-[#123a77] sm:text-[38px]">
                {selectedDevice?.name || "Chưa chọn thiết bị"}
              </h1>

              <p className="mt-2 text-base font-semibold text-[#6078a6]">
                {selectedDevice?.group || "N/A"} ·{" "}
                {selectedDevice?.brand || "N/A"}
              </p>

              <p className="mt-4 max-w-4xl text-[15px] leading-7 text-[#4d6798] sm:text-[17px]">
                {selectedDevice?.description ||
                  "Chưa có thông tin mô tả chi tiết cho thiết bị này."}
              </p>
            </>
          )}
        </div>

        {/* Nút bấm chuyển đổi giữa 2 luồng */}
        <div className="flex flex-wrap gap-3 xl:justify-end">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <X size={18} />
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-[0_14px_32px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5"
              >
                <Save size={18} />
                Lưu thay đổi
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-5 py-3 font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <PencilLine size={18} />
              Chỉnh sửa thông tin
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function FieldItem({ label, name, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#355a96]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-2xl border border-blue-100 bg-white/90 px-4 text-sm font-semibold text-[#163f7e] shadow-inner outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}
