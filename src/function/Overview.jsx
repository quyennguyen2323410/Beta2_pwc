import React from "react";
import { useNavigate } from "react-router-dom";

export default function Overview() {
  const navigate = useNavigate();

  // ===== top buttons =====
  const handleLogout = () => {
    localStorage.removeItem("pwc_auth");
    sessionStorage.removeItem("pwc_auth");
    navigate("/Login", { replace: true });
  };

  const handleUseAI = () => {
    navigate("/AI");
  };

  const handleOpenLibrary = () => {
    navigate("/Library");
  };

  // ===== KPI click =====
  const handleGoDevices = () => navigate("/KpiDevices");
  const handleGoQuestions = () => navigate("/KpiQuestions");
  const handleGoReports = () => navigate("/KpiReports");
  const handleGoRating = () => navigate("/KpiRating");
  const handleGoTasks = () => navigate("/KpiTasks");
  const handleGoIdeas = () => navigate("/KpiIdeas");
  const handleGoProcesses = () => navigate("/KpiProcesses");
  const handleGoRole = () => navigate("/KpiRole");

  // ===== placeholder data =====
  const kpiData = {
    devices: "--",
    questions: "--",
    reports: "--",
    rating: "--",
    tasks: "--",
    ideas: "--",
    processes: "--",
    roleName: "Kỹ thuật viên",
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="mb-6 rounded-[28px] bg-white/70 border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="px-5 py-5 md:px-7 md:py-6">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            CÔNG TY CỔ PHẦN CẤP NƯỚC PHÙ HÒA TÂN
          </p>
          <h1 className="mt-3 text-[28px] leading-tight font-bold text-slate-800 md:text-3xl">
            Quản lý tri thức – Vận hành – AI
          </h1>
        </div>
      </div>

      {/* hero */}
      <section className="grid gap-4 xl:grid-cols-[1.8fr_0.95fr]">
        <div className="rounded-[30px] bg-gradient-to-br from-[#08384d] via-[#124b6c] to-[#2d5f99] p-6 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffe7a6]">
            Tầm nhìn
          </p>

          <h2 className="mt-3 text-[28px] font-bold leading-tight xl:text-[30px]">
            Chuẩn hóa quy trình – tích lũy dữ liệu – nâng tầm vận hành bằng AI
          </h2>

          <p className="mt-5 max-w-4xl text-[15px] leading-7 text-white/95 xl:text-[16px]">
            Website mẫu này mô phỏng các luồng nghiệp vụ chính của PWC WaterCare
            AI: tra cứu thiết bị, hỏi đáp kỹ thuật, giao việc, chốt số đồng hồ,
            quản lý sáng kiến và trợ lý AI hỗ trợ quyết định.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleUseAI}
              className="w-full sm:w-auto min-h-[52px] rounded-2xl bg-[#1896b4] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1486a1] active:scale-[0.98]"
            >
              Dùng trợ lý AI
            </button>

            <button
              type="button"
              onClick={handleOpenLibrary}
              className="w-full sm:w-auto min-h-[52px] rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/15 active:scale-[0.98]"
            >
              Xem thư viện kỹ thuật
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#476f9f] to-[#456d9c] p-5 text-white shadow-sm">
            <p className="text-sm">Tiết kiệm thời gian tra cứu</p>
            <p className="mt-3 text-3xl font-bold">{kpiData.devices}</p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#476f9f] to-[#456d9c] p-5 text-white shadow-sm">
            <p className="text-sm">Chuẩn hóa thao tác hiện trường</p>
            <p className="mt-3 text-3xl font-bold">{kpiData.questions}</p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#476f9f] to-[#456d9c] p-5 text-white shadow-sm">
            <p className="text-sm">Nền tảng dữ liệu cho AI</p>
            <p className="mt-3 text-3xl font-bold">{kpiData.reports}</p>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <button
          type="button"
          onClick={handleGoDevices}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.devices}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Thiết bị trong thư viện
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Thiết bị đã chuẩn hóa dữ liệu kỹ thuật.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoQuestions}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.questions}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Câu hỏi đã lưu trữ
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Lịch sử xử lý sự cố và tham vấn nội bộ.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoReports}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.reports}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Báo cáo chốt số
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Biểu mẫu đã lưu và có thể đồng bộ về cơ sở dữ liệu.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoRating}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.rating}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Điểm hài lòng câu trả lời
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Điểm trung bình dựa trên đánh giá 1–5 sao.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoTasks}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.tasks}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Công việc đang thực hiện
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Các đầu việc hiện trường đang chạy.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoIdeas}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.ideas}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Sáng kiến đã duyệt
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Ý tưởng đã được chấp thuận triển khai.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoProcesses}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.processes}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Quy trình đang nâng cấp
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Nội dung đang nghiên cứu hoặc chuẩn hóa SOP.
          </p>
        </button>

        <button
          type="button"
          onClick={handleGoRole}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
            KPI
          </p>
          <h3 className="mt-3 text-[28px] font-bold text-slate-900">
            {kpiData.roleName}
          </h3>
          <p className="mt-3 text-[15px] font-bold text-slate-900">
            Vai trò hiện tại
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Thông tin người dùng hiện tại, sẽ lấy từ backend sau.
          </p>
        </button>
      </section>
    </div>
  );
}
