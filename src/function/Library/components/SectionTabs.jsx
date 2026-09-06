import React from "react";

export default function SectionTabs({
  sectionTabs = [],
  activeTab,
  setActiveTab,
}) {
  return (
    <aside className="rounded-[24px] border border-white/75 bg-white/78 p-4 shadow-[0_16px_42px_rgba(30,64,175,0.10)] backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-xl font-black text-[#163f7e]">Mục tài liệu</h2>
        <p className="mt-1 text-xs leading-5 text-[#6c7fa4]">
          Chọn nội dung kỹ thuật cần tra cứu hoặc cập nhật.
        </p>
      </div>

      <div className="space-y-2">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "border-blue-200 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)]"
                  : "border-white/80 bg-white/75 text-[#526d9b] hover:-translate-y-0.5 hover:bg-white hover:text-blue-700"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {Icon && <Icon size={18} />}
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
