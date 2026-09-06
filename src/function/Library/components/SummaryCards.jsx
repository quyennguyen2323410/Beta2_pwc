import React from "react";
import { AlertTriangle, Gauge, HardDrive, MapPin } from "lucide-react";

export default function SummaryCards({ selectedDma, currentErrors = [] }) {
  const dmaName = selectedDma?.ten_dma || "---";
  const deviceType =
    selectedDma?.thiet_bi || selectedDma?.loai_thiet_bi || "N/A";
  const location = selectedDma?.vi_tri_dma || "Chưa xác định";
  const totalErrors = currentErrors.length;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CardItem
        icon={HardDrive}
        label="Mã DMA"
        value={dmaName}
        desc="Trạm/Khu vực quản lý"
        tone="from-blue-600 to-cyan-500"
      />
      <CardItem
        icon={Gauge}
        label="Loại thiết bị"
        value={deviceType}
        desc="Thiết bị đo/điều khiển"
        tone="from-indigo-600 to-blue-500"
      />
      <CardItem
        icon={MapPin}
        label="Vị trí lắp đặt"
        value={location}
        desc="Địa điểm hiện trường"
        tone="from-teal-500 to-emerald-400"
      />
      <CardItem
        icon={AlertTriangle}
        label="Sự cố ghi nhận"
        value={`${totalErrors} lỗi`}
        desc="Tổng số bài hướng dẫn"
        tone="from-amber-500 to-orange-400"
      />
    </section>
  );
}

function CardItem({ icon: Icon, label, value, desc, tone }) {
  return (
    <div className="rounded-[24px] border border-white/75 bg-white/78 p-4 shadow-[0_16px_42px_rgba(30,64,175,0.10)] backdrop-blur-xl transition-all hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-md`}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6c8ec3]">
            {label}
          </p>
          <h4 className="truncate text-lg font-bold text-[#183f82]">{value}</h4>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#5977a9]">{desc}</p>
    </div>
  );
}
