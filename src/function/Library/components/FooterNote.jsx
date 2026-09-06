import React from "react";
import { CheckCircle2, PencilLine } from "lucide-react";

export default function FooterNote({ setIsEditing }) {
  return (
    <section className="rounded-[30px] border border-white/75 bg-white/72 p-5 shadow-[0_24px_70px_rgba(30,64,175,0.13)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h3 className="text-lg font-black text-[#163f7e]">
              Ghi chú vận hành hiện trường
            </h3>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[#6c7fa4]">
              Nếu phát hiện lỗi mới hoặc quy trình khắc phục chưa chính xác, hãy
              kích hoạt chế độ chỉnh sửa để cập nhật kho tri thức.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-bold text-amber-700 transition hover:-translate-y-0.5 hover:bg-white"
        >
          <PencilLine size={18} />
          Chuyển sang Luồng Chỉnh Sửa
        </button>
      </div>
    </section>
  );
}
