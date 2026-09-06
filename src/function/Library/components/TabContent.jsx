import React from "react";
import { FileText, Wrench, AlertCircle, BookOpen } from "lucide-react";

const tabIconMap = {
  "Cách xử lý": Wrench,
  "Nguyên nhân": AlertCircle,
  "Tài liệu": BookOpen,
};

export default function TabContent({
  activeTab,
  selectedError,
  isEditing = false,
  editData = {},
  handleEditChange,
}) {
  const CurrentTabIcon = tabIconMap[activeTab] || FileText;

  // Lấy dữ liệu theo Tab hiện tại
  const getContentByTab = () => {
    if (!selectedError) return [];
    if (activeTab === "Cách xử lý") {
      return {
        primary: selectedError.left || [],
        secondary: selectedError.right || [],
      };
    }
    if (activeTab === "Nguyên nhân") {
      return { primary: selectedError.causes || [], secondary: [] };
    }
    if (activeTab === "Tài liệu") {
      return { primary: selectedError.docs || [], secondary: [] };
    }
    return { primary: [], secondary: [] };
  };

  const { primary, secondary } = getContentByTab();

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/75 bg-white/78 shadow-[0_16px_42px_rgba(30,64,175,0.10)] backdrop-blur-xl">
      <div className="border-b border-blue-100 bg-white/70 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.26)]">
              <CurrentTabIcon size={23} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                Chi tiết hướng dẫn
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#163f7e]">
                {activeTab}
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/75 px-4 py-3 text-sm font-semibold text-blue-700">
            {isEditing ? "Đang chỉnh sửa nội dung" : "Chế độ xem hướng dẫn"}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isEditing ? (
          <textarea
            name={activeTab}
            value={editData[activeTab] || ""}
            onChange={handleEditChange}
            rows={10}
            className="w-full rounded-3xl border border-blue-100 bg-white/90 px-5 py-4 text-base leading-8 text-[#163f7e] shadow-inner outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            placeholder="Nhập nội dung quy trình, dòng 1, dòng 2..."
          />
        ) : primary.length > 0 || secondary.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cột chính */}
            <div className="space-y-3">
              {primary.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-[14px] border border-blue-100 bg-white/80 p-3.5 shadow-sm transition hover:bg-white"
                >
                  <span className="font-bold text-[#1d478d]">{index + 1}.</span>
                  <span className="text-sm leading-6 text-[#4c6898]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Cột bổ sung (ví dụ: các bước bổ sung của Cách xử lý) */}
            {secondary.length > 0 && (
              <div className="space-y-3">
                {secondary.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-[14px] border border-blue-100 bg-white/80 p-3.5 shadow-sm transition hover:bg-white"
                  >
                    <span className="font-bold text-[#2f69d9]">•</span>
                    <span className="text-sm leading-6 text-[#4c6898]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyContent />
        )}
      </div>
    </section>
  );
}

function EmptyContent() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
        <FileText size={26} />
      </div>
      <h4 className="mt-3 text-lg font-bold text-[#163f7e]">
        Chưa có nội dung
      </h4>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#6c7fa4]">
        Mục này chưa có bài viết hướng dẫn chi tiết.
      </p>
    </div>
  );
}
